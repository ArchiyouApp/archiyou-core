
// constants
import { MESHING_MAX_DEVIATION, MESHING_ANGULAR_DEFLECTION, MESHING_MINIMUM_POINTS, MESHING_TOLERANCE, MESHING_EDGE_MIN_LENGTH } from './internal';

import type { ArchiyouApp, AnyShapeOrCollection,
    ExportGLTFOptions, MeshingQualitySettings,
    toSVGOptions } from './internal'

import { isBrowser } from './internal'

import { Shape, AnyShape, ShapeCollection, 
    GLTFBuilder, 
    RunnerOps } from './internal'

type XmlNode = any; // TODO

//// TYPES ////

// avoid TS errors by extending global
declare global {

    interface Window {
        showOpenFilePicker:any,
        showSaveFilePicker:any,
    }

    interface globalThis
    {
        showOpenFilePicker:any,
        showSaveFilePicker:any,
    }

    interface Console {
        geom:any,
        user:any,
    }
}


export class Exporter
{
    //// SETTINGS ////
    DEFAULT_MESH_QUALITY = {
        linearDeflection: MESHING_MAX_DEVIATION,
        angularDeflection: MESHING_ANGULAR_DEFLECTION,
        tolerance: MESHING_TOLERANCE,
        edgeMinimalPoints: MESHING_MINIMUM_POINTS,
        edgeMinimalLength: MESHING_EDGE_MIN_LENGTH,
    }

    DEFAULT_GLTF_OPTIONS = {
        binary: true,
        archiyouFormat: true,
        archiyouOutput: { metrics: true, tables: true, docs: false, pipelines:true, formats: true, messages: true },
        includePointsAndLines: true,
        extraShapesAsPointLines: true,
        messages: [],
    } as ExportGLTFOptions

    //// END SETTINGS ////

    _ay:ArchiyouApp; // New method, see set Archiyou

    constructor(ay?:ArchiyouApp) 
    {
        this._ay = ay;
    }

    setArchiyou(ay:ArchiyouApp):this
    {
        this._ay = ay;
        return this;
    }

    /** Export given shapes or all shapes in Brep instance to STEP 
     *  Optionally supply a filename
    */
    exportToSTEP(shapes?:AnyShape|ShapeCollection, options:Record<string,any> = {}, filename?:string):string
    {
        // Taken from: https://github.com/zalo/CascadeStudio/blob/1a0f44b4d7617cc9dfc1dd6833945e04e2dfc1c9/js/CADWorker/CascadeStudioFileUtils.js

        /* 
            OC docs:
            - https://dev.opencascade.org/doc/refman/html/class_s_t_e_p_control___writer.html
            - Output modes: https://dev.opencascade.org/doc/refman/html/_s_t_e_p_control___step_model_type_8hxx.html#a032affe8dae498d429a83225f8c5da4e
        */

        const shapesToExport = new ShapeCollection(shapes as AnyShape);

        filename = filename || this._getFileName() + '.step';
        // Export given shape(s) or all in Brep instance
        const sceneShapes = (shapesToExport.length) 
                                ? shapesToExport 
                                : this._ay.brep.all().filter(s => s.visible());
        const sceneCompoundShape = new ShapeCollection(sceneShapes).toOcCompound(); // filter might return only one Shape

        console.info(`Exporter::exportToSTEP: Output of ${sceneCompoundShape.NbChildren()} Shapes`);

        const oc = this._ay.brep._oc;
        
        let ocWriter = new oc.STEPControl_Writer_1();
        let ocTransferResult = ocWriter.Transfer(sceneCompoundShape, 0, true, new oc.Message_ProgressRange_1()); 
        ocTransferResult = ocTransferResult.value; // return a struct: use value() to get real value
        if (ocTransferResult === 1)
        {
            // Write the STEP File to the virtual Emscripten Filesystem Temporarily
            let writeResult = ocWriter.Write(filename);
            writeResult = writeResult.value;
            if (writeResult === 1)
            {
                // Read the STEP File from the filesystem and clean up
                let stepFileText = oc.FS.readFile("/" + filename, { encoding:"utf8" });
                oc.FS.unlink("/" + filename);

                // Return the contents of the STEP File
                return stepFileText;
            }
            else
            {
                console.error("Exporter::exportToSTEP: File Export Transfer to STEP failed");
            }
        }
        else 
        {
            console.error("Exporter::exportToSTEP: File Export to STEP failed");
        }
    }

    /** Open a window to save the file in browser */
    async exportToSTEPWindow(content?:string)
    {
        const stepContent = content || this.exportToSTEP();
        await this._exportToFileWindow(stepContent, 'text/plain', 'step', 'STEP file');
    }

    /** Export given shapes or all shapes in Brep instance to STL
     *  Optionally supply a filename
    */
    exportToSTL(shapes?:AnyShape|ShapeCollection, options:Record<string,any> = {}, filename?:string):Uint8Array
    {
        const oc = this._ay.brep._oc;
        
        filename = (filename || this._getFileName());
        if(!filename.includes(".stl")) filename += '.stl';

        const shapesToExport = new ShapeCollection(shapes);

        const visibleShapes = (shapesToExport.length) 
                                    ? shapesToExport 
                                    : this._ay.brep.all().filter(s => s.visible());

        // IMPORTANT: Make sure all shapes are triangulated before exporting to STL
        // TODO: avoid doing this multiple times if already done before GLTF
        this._triangulateShapes(visibleShapes);

        const sceneCompoundShape = visibleShapes.toOcCompound();

        console.info(`Exporter::exportToSTEP: Output of ${sceneCompoundShape.NbChildren()} Shapes`);
        const ocStlWriter = new oc.StlAPI_Writer();
        ocStlWriter.ASCIIMode = false; // binary
        const result = ocStlWriter.Write(sceneCompoundShape, filename, new oc.Message_ProgressRange_1()); // Shape, stream content, ASCI or not

        if (!result)
        {
            console.error(`Exporter::exportToSTL: Error exporting to STL. Try again, or another format!`);
            return null;
        }
        else {
            const stlFileBinary = oc.FS.readFile("/" + filename, { encoding:"binary" });
            oc.FS.unlink("/" + filename);
            return stlFileBinary?.buffer;
        }
        
    }

    /** Open a window to save the STL file in browser */
    async exportToSTLWindow(content?:ArrayBuffer)
    {
        const stlContent = content || this.exportToSTL();
        await this._exportToFileWindow(stlContent, 'application/octet-stream', 'stl', 'STL file');
    }

    /** Export Scene to GLTF 
        
        Export high-resolution GLTF with added loose Points and Lines. And optionally export seperate Vertices and Edges per Shape

        OC docs: 
        - RWGltf_CafWriter: https://dev.opencascade.org/doc/refman/html/class_r_w_gltf___caf_writer.html
        - XCAFDoc_DocumentTool: - https://dev.opencascade.org/doc/refman/html/class_x_c_a_f_doc___document_tool.html
        - ShapeTool: https://dev.opencascade.org/doc/refman/html/class_x_c_a_f_doc___shape_tool.html
        - TDF_Label: https://dev.opencascade.org/doc/refman/html/class_t_d_f___label.html
        - TDataStd_Name: https://dev.opencascade.org/doc/refman/html/class_t_data_std___name.html
        - VisMaterialTool: https://dev.opencascade.org/doc/refman/html/class_x_c_a_f_doc___vis_material_tool.html#aaa1fb4d64b9eb24ed86bbe6d368010ab
        - XCAFDoc_VisMaterial - https://dev.opencascade.org/doc/refman/html/class_x_c_a_f_doc___vis_material.html
        - VisMaterialPBR: https://dev.opencascade.org/doc/refman/html/struct_x_c_a_f_doc___vis_material_p_b_r.html

    */
    async exportToGLTF(shapes?:AnyShapeOrCollection, options?:ExportGLTFOptions, filename?:string):Promise<ArrayBuffer|null>
    {
        const startGLTFExport = performance.now();

        const oc = this._ay.brep._oc;
        options = (!options) ? { ... this.DEFAULT_GLTF_OPTIONS } : { ... this.DEFAULT_GLTF_OPTIONS, ...options };
        
        const meshingQuality = options?.quality || this.DEFAULT_MESH_QUALITY;
        filename = (typeof filename === 'string') ? filename : `file.${(options.binary) ? 'glb' : 'gltf'}`;

        const docHandle = new oc.Handle_TDocStd_Document_2(new oc.TDocStd_Document(new oc.TCollection_ExtendedString_1()));

        const ocShapeTool = oc.XCAFDoc_DocumentTool.prototype.constructor.ShapeTool(docHandle.get().Main()).get(); // autonaming is on by default
        let ocIncMesh;

        /* For now we export all visible shapes in a flattened scene (without nested scenegraph) 
            and export as much properties (id, color) as possible 
            NOTE: OC only exports Solids to GLTF - use custom method to export Vertices/Edges/Wires
        */

        const shapesToExport = new ShapeCollection(shapes);
        const exportShapes = shapesToExport.length
                                ? shapesToExport 
                                : this._ay.brep.all().filter(s => s.visible() && !['Vertex','Edge','Wire'].includes(s.type()));

        if(exportShapes.length === 0)
        {
            console.error(`Exporter::exportToGLTF: No visible shapes to export`);
            return null;
        }

        exportShapes
            .forEach(entity => {
                if(Shape.isShape(entity)) // probably entities are all shapes but just to make sure
                {
                    const shape = entity as AnyShape;
                    const ocShape = shape._ocShape;
                    const ocShapeLabel = ocShapeTool.AddShape(ocShape,false,false); // Shape, makeAssembly, makePrepare

                    const shapeName = `${shape.getId()}__${shape.getName()}`; // save obj_id and name into GLTF node
                    
                    oc.TDataStd_Name.Set_2(ocShapeLabel, 
                                    oc.TDataStd_Name.GetID(), 
                                    new oc.TCollection_ExtendedString_2(shapeName, false)); // Set_2 not according to docs (no Set_3)

                    // Export basic material to GLTF
                    if (shape._getColorRGBA() !== null)
                    {
                        const ocMaterialTool = oc.XCAFDoc_DocumentTool.prototype.constructor.VisMaterialTool(ocShapeLabel).get(); // returns Handle< XCAFDoc_VisMaterialTool >
                        const ocMaterial = new oc.XCAFDoc_VisMaterial();
                        const ocPBRMaterial = new oc.XCAFDoc_VisMaterialPBR(); // this is a struct
                        ocPBRMaterial.BaseColor = new oc.Quantity_ColorRGBA_5(...shape._getColorRGBA()); // [ r,g,b,a]
                        ocMaterial.SetPbrMaterial(ocPBRMaterial);
                        const ocMaterialLabel = ocMaterialTool.AddMaterial_1( new oc.Handle_XCAFDoc_VisMaterial_2(ocMaterial), new oc.TCollection_AsciiString_2(shapeName)); // returns TDF_Label
                        ocMaterialTool.SetShapeMaterial_1(ocShapeLabel, ocMaterialLabel);

                        // NOTE: do we need to delete these OC classes (not here because we need them still). Save the references?
                    }
                    
                    // triangulate BREP to mesh
                    ocIncMesh = new oc.BRepMesh_IncrementalMesh_2(ocShape, meshingQuality.linearDeflection, false, meshingQuality.angularDeflection, false);
                }
        })

        const ocGLFTWriter = new oc.RWGltf_CafWriter(new oc.TCollection_AsciiString_2(filename), meshingQuality);
        
        const ocCoordSystemConverter = ocGLFTWriter.CoordinateSystemConverter();
        ocCoordSystemConverter.SetInputCoordinateSystem_2(oc.RWMesh_CoordinateSystem.RWMesh_CoordinateSystem_Zup);
        ocGLFTWriter.SetCoordinateSystemConverter(ocCoordSystemConverter);
        ocGLFTWriter.SetForcedUVExport(true); // to output UV coords
        ocGLFTWriter.Perform_2(docHandle, new oc.TColStd_IndexedDataMapOfStringString_1(), new oc.Message_ProgressRange_1());
        
        const gltfFile = oc.FS.readFile(`./${filename}`, { encoding: 'binary' }); // only binary for now
        let gltfContent =  new Uint8Array(gltfFile.buffer) as Uint8Array; 
        oc.FS.unlink("./" + filename);
        
        // clean up OC classes (if any shapes)
        ocShapeTool?.delete();
        ocIncMesh?.delete();
        ocGLFTWriter?.delete();
        ocCoordSystemConverter?.delete();

        console.info(`Exporter::exportToGLTF: Exported ${exportShapes.length} OC Shapes in ${Math.round(performance.now() - startGLTFExport)}ms`);
        const startGLTFExtra = performance.now();

        // Force inclusion of points and lines to export
        if (options.includePointsAndLines)
        {
            const startGLTFPointsAndLines = performance.now();
            const pointAndLineShapes:ShapeCollection = new ShapeCollection(
                        this._ay.brep.all()
                        .filter(s => (s.visible() && ['Vertex','Edge','Wire'].includes(s.type()))));
            if (pointAndLineShapes.length > 0)
            {
                gltfContent = await new GLTFBuilder().addPointsAndLines(gltfContent, pointAndLineShapes, meshingQuality); 
            }
            console.info(`Exporter::exportToGLTF: Exported ${pointAndLineShapes.length} Points and Lines in ${Math.round(performance.now() - startGLTFPointsAndLines)}ms`);
        }

        // extra vertices and lines for specific visualization styles
        if (options?.extraShapesAsPointLines)
        {
            console.info(`Exporter::exportToGLTF: Flag extraShapesAsPointLines: Exporting extra Shapes as Points and Lines. `);
            const startGLTFExtraShapes = performance.now();
            const extraOutputShapes = new ShapeCollection(this._ay.brep.all().filter(s => (s.visible() && !['Vertex','Edge','Wire'].includes(s.type()))));
            if( extraOutputShapes.length > 0)
            {
                gltfContent = await new GLTFBuilder().addSeperatePointsAndLinesForShapes(gltfContent, extraOutputShapes, meshingQuality); 
            }
            console.info(`Exporter::exportToGLTF: Exported extra ${extraOutputShapes.length} Shapes in ${Math.round(performance.now() - startGLTFExtraShapes)}ms`);            
        }

        // Add special archiyou data in GLTF asset.extras section
        if(options?.archiyouFormat)
        {
            console.info(`Exporter::exportToGLTF: Flag archiyouFormat: Exporting Archiyou data inside GLTF extras. Settings: ${JSON.stringify(options?.archiyouOutput)}`);
            // We do some performance measurements here
            const startGLTFArchiyouData = performance.now();
            gltfContent = await new GLTFBuilder().addArchiyouData(gltfContent, this._ay, options?.archiyouOutput || {}); 
            console.info(`Exporter::exportToGLTF: Exported archiyou data in ${Math.round(performance.now() - startGLTFArchiyouData)}ms`);	
        }
        else {
            console.info(`Exporter::exportToGLTF: Skipped Archiyou data export. Set export flag data to true and set metrics, tables, docs flags for output`);
        }

        console.info(`Exporter::exportToGLTF: Exported extra data in ${Math.round(performance.now() - startGLTFExtra)}ms`);	

        return gltfContent.buffer as ArrayBuffer; // convert Uint8Array to ArrayBuffer
    }

    /** Needs to be called before before STL 
     *  Also with GLTF but keep it seperate for now
     *  Return OcIncMesh instance to be able to delete them
     */
    _triangulateShapes(shapes:ShapeCollection, meshingQuality?:MeshingQualitySettings):Array<any>
    {
        const oc = this._ay.brep._oc;
        meshingQuality = meshingQuality || this.DEFAULT_MESH_QUALITY;
        const ocIncMeshes = [] as Array<any>;
        new ShapeCollection(shapes)
        .forEach(entity => {
            if(Shape.isShape(entity)) // probably entities are all shapes but just to make sure
            {
                const ocShape = entity._ocShape;
                const ocIncMesh = new oc.BRepMesh_IncrementalMesh_2(ocShape, meshingQuality.linearDeflection, false, meshingQuality.angularDeflection, false);
                ocIncMeshes.push(ocIncMesh);
            }
        });
        return ocIncMeshes;
    }

    /** Export GLTF (binary or text) to the browser window */
    async exportToGLTFWindow(content?:Uint8Array|string)
    {
        const mime = (typeof content === 'string') 
                    ? 'text/plain'
                    : 'application/octet-stream';

        const ext = (typeof content === 'string') ? 'gltf' : 'glb';
        const gltfContent = content || await this.exportToGLTF();
        await this._exportToFileWindow(gltfContent, mime, ext, 'GLTF file');
    }

    async exportToGLTFAnimation(frameGLBs:Array<Uint8Array>):Promise<Uint8Array>
    {
        const gltfExporter = new GLTFBuilder();
        await gltfExporter.createAnimation(frameGLBs);
        return gltfExporter.toGLTFBuffer();
    }

    async exportToGLTFAnimationWindow(content:Uint8Array)
    {
        await this._exportToFileWindow(content, 'application/octet-stream', 'glb', 'GLTF file');
    }

    /** Export entire (visual) model by creating a isometric 2D view  
     * TODO: seperate these functions into export3DtoSVG and export2DtoSVG
    */
    exportToSVG(shapes?:ShapeCollection, options:toSVGOptions={}):string
    {
        const shapesToExport = ShapeCollection.isShapeCollection(shapes) 
                                    ? shapes // only selected shapes
                                    : this._ay.brep.all().filter(s => s.visible()); // all visible ones in scene

        // if user forces only 2D export or shapes are all 2D anyway
        if(options?.only2D || shapesToExport.toArray().every(s => s.is2DXY()))
        {
            return this._export2DToSVG(shapesToExport, options);
        }
        else {
            console.info(`Exporter::exportToSVG(): Exporting from 3D to 2D using isometry. If you want only the 2D set only2D to true`)
            return this._export3DToSVG(shapesToExport, options);
        }

    }

    /** Shortcut function to export 3D shapes to SVG 
        Make a isometry first
    */
    _export3DToSVG(shapes:ShapeCollection, options:toSVGOptions={})
    {
        if(!ShapeCollection.isShapeCollection(shapes) || shapes.length === 0)
        { 
            throw new Error(`Exporter::_export3DToSVG(): Please supply a ShapeCollection with at least one shape!`);
        }
        return shapes._isometry().toSVG(options);
    }

    /** Export 2D shapes to SVG */
    _export2DToSVG(shapes:ShapeCollection, options:toSVGOptions={})
    {
        if(!ShapeCollection.isShapeCollection(shapes) || shapes.length === 0)
        { 
            throw new Error(`Exporter::_export2DToSVG(): Please supply a ShapeCollection with at least one shape!`);
        }
        return shapes.toSVG(options);
    }

    /** Combine all SVG's into one with SMIL keyframe animations
     *  We parse all SVGs and put all their content in seperate groups named "frame{{N}}"
     *  At the same time apply special SLIM SVG keyframe animation tags 
     *  so the SVG animation can be viewed inside ordinary browsers
     */
    exportToSVGAnimation(svgs:Array<string>):string
    {
        const SVG_FPS = 2; // 2 frames per second
        const SVG_FRAME_DURATION = 1 / SVG_FPS;

        const svgRootNodes = [] as Array<any>;
        const svgFrameGroups = [] as Array<string>; // <g id="frameN"><set id="anN" />{{ svg paths }}</g>
        const numFrames = svgs.length;

        return null;
        // TODO: Implement after change to fast-xml-parser
        /*

        svgs.forEach( (svg,frameNum) => {
            const parsedSvg = txml.parse(svg)[0];
            svgRootNodes.push(parsedSvg); // to find largest bbox later
            const pathNodes = txml.filter(parsedSvg.children, node => node.tagName === 'path'); // SVG only consists of path elements

            const svgFrameGroup = `
                        <g id="frame${frameNum}" visibility="hidden">
                            <set id="an${frameNum*2}" attributeName="visibility" begin="${SVG_FRAME_DURATION*frameNum}; an${frameNum*2+1}.end" to="visible" dur="${SVG_FRAME_DURATION}s" />
                            <set id="an${frameNum*2+1}" attributeName="visibility" begin="an${frameNum*2}.end" to="hidden" dur="${numFrames*SVG_FRAME_DURATION-SVG_FRAME_DURATION}s" />
                            ${pathNodes.map(p => this._XmlNodeToString(p)).join('')}
                        </g>`
            svgFrameGroups.push(svgFrameGroup);
        })

        // Get biggest bounding box
        svgRootNodes.sort( (a,b) => this._getSvgBboxArea(b) - this._getSvgBboxArea(a))
        const svgAnimated = this._XmlNodeToString(svgRootNodes[0], svgFrameGroups.join('\n')); // Wrap al groupes with largest SVG bbox

        return svgAnimated
        */
    }

    /** For some reason TXML does not offer a good node.toString() method */
    _XmlNodeToString(n:any, wrapped:string=''):string
    {
        const attrsStr = Object.keys(n.attributes).map( attr => `${attr}="${n.attributes[attr]}"`).join(' ');
        return `<${n.tagName} ${attrsStr}>${wrapped}</${n.tagName}>`
    }

    _getSvgBboxArea(svg:XmlNode):number
    {
        const bbox = svg.attributes['viewBox']?.split(' ');
        return (bbox) ? bbox[2] * bbox[3] : 0;
    }

    /** Open browser file window to save svg */
    async exportToSVGWindow(content:string)
    {
       await this._exportToFileWindow(content, 'text/svg', 'svg', 'SVG file');
    }

    exportToDXF(shapes?:AnyShape|ShapeCollection, options:Record<string,any> = {}):string|null
    {
        const shapesToExport = new ShapeCollection(shapes);
        const exportShapes = (shapesToExport.length) 
                            ? shapesToExport 
                            : this._ay.brep.all().filter(s => s.visible());

        if(exportShapes.length === 0)
        {
            console.warn(`Exporter::exportToDXF(): No visible shapes to export to DXF`);
            return null;
        }
        return exportShapes.toDXF();
    }


    /** Convenience method for exporting Shapes and save as file in browser and node */
    async save(filename:string, options:any={}, shapes?:ShapeCollection)
    {
        const EXTENTIONS_EXPORT_METHODS = {
            // extentions and mapping to exporter method
            'glb' : async (exp, shapes, filename, options) => await exp.exportToGLTF(shapes, options, filename),
            'svg': async (exp, shapes, filename, options) => exp.exportToSVG(shapes, options),
            'step': async (exp, shapes, filename, options) => exp.exportToSTEP(shapes, options, filename),
            'stl': async (exp, shapes, filename, options) => exp.exportToSTL(shapes, options, filename),
            'dxf' : async (exp, shapes, filename, options) => exp.exportToDXF(shapes, options, filename),
            // TODO: more
        }

        const ext = filename.split('.').pop();
        if(!Object.keys(EXTENTIONS_EXPORT_METHODS).includes(ext))
        {
            console.error(`Shape::save: Unsupported file extension to save file "${filename}".
                Please use any of these extensions: ${Object.keys(EXTENTIONS_EXPORT_METHODS).join(', ')}.
                Or as developer set mapping to export functions`);
            return;
        }
        const data = await EXTENTIONS_EXPORT_METHODS[ext](this, shapes, options, filename);        

        await this._saveDataToFile(data, filename);
    }

    /** save raw data to file in browser of node */
    async _saveDataToFile(data:any, filename:string)
    {
        if (isBrowser())
        {
            this.saveDataToFileWindow(data, filename);
        }
        else {
            // We are in backend Node
            const ops = new RunnerOps(); // some utils
            await ops.saveBlobToFile(data, filename);
        }
    }

    //// UTILS ////

    /** Simplified function to output data to a file window */
    async saveDataToFileWindow(data, filename:string)
    {
        const mime = this._mimeFromFileName(filename);
        const ext = filename.split('.').pop();
        await this._exportToFileWindow(data, mime, ext, `Save .${ext} File`);
    }

    /** Write data to local disk by opening a file picker in browser */
    async _exportToFileWindow(data:any, mime:string, ext:string, desc:string)
    {
        const fileHandle = await this.getNewFileHandle(desc, mime, ext);
        // Create a FileSystemWritableFileStream to write to
        const writable = await fileHandle.createWritable();
        // Write the contents of the file to the stream
        await writable.write(data);
        // Close the file and write the contents to disk.
        await writable.close();
        console.info(`Exporter::exportToWindow(): Saved file "${fileHandle.name}"`);
    }

    _getFileName():string
    {
        // Try to get script name from parent (Webworker (likely!), or Main))
        // TODO: Fix with new Runner structure
        return this._ay?.worker?.lastExecutionRequest?.script?.file_name || 'exportmodel';
    }

    _mimeFromFileName(fileName:string):string
    {
        const ext = fileName.split('.').pop();
        switch(ext)
        {
            case 'svg': return 'image/svg+xml';
            case 'dxf': return 'application/dxf';
            case 'stl': return 'application/sla';
            case 'step': return 'application/step';
            case 'glb': return 'model/gltf-binary';
            default: return 'application/octet-stream';
        }
    }

    // Taken from Cascade Studio
    async getNewFileHandle(desc, mime, ext, open = false)
    {
        const options = {
          types: [
            {
              description: desc,
              accept: {
                [mime]: ['.' + ext],
              },
            },
          ],
        };

        // open
        if (open) 
        {
            if (window.showOpenFilePicker) 
            {
                return await window.showOpenFilePicker(options);
            } 
            else {
                throw new Error("File Open Picker is not supported in this browser.");
            }
        } 
        // save
        else {
            // Chrome supports the file system API
            if (window.showSaveFilePicker)
            {
                return await window.showSaveFilePicker(options);
            } 
            else {
                // Fallback for unsupported browsers
                const exportFileName =  `${this._getFileName()}.${ext}`;
                return {
                    name:exportFileName,
                    async createWritable() 
                    {
                        const blobParts: Blob[] = [];
                        return {
                            async write(contents: Blob) 
                            {
                                blobParts.push(contents);
                            },
                            async close() {
                                const blob = new Blob(blobParts, { type: mime });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = exportFileName;
                                a.click();
                                URL.revokeObjectURL(url);
                            },
                        };
                    },
                };
            }
        }
    }



}