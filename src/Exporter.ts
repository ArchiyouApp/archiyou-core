import { Shape, AnyShape, ShapeCollection, ArchiyouApp} from './internal'

import { ExportGLTFOptions, MeshingQualitySettings} from './internal'

import { MESHING_MAX_DEVIATION, MESHING_ANGULAR_DEFLECTION, MESHING_MINIMUM_POINTS, MESHING_TOLERANCE, MESHING_EDGE_MIN_LENGTH } from './internal';

import { GLTFBuilder } from './GLTFBuilder';

import * as txml from 'txml' // Browser independant XML elements and parsing, used in toSVG. See: https://github.com/TobiasNickel/tXml
import { tNode as TXmlNode } from 'txml/dist/txml' // bit hacky


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
        archiyouOutput: { metrics: true, tables: true, docs: true, pipelines:true, formats: true, messages: true },
        includePointsAndLines: true,
        extraShapesAsPointLines: true,
        messages: [],
    } as ExportGLTFOptions

    //// END SETTINGS ////

    _ay:ArchiyouApp; // New method, see set Archiyou

    constructor(ay:ArchiyouApp) 
    {
        this._ay = ay;
    }

    setArchiyou(ay:ArchiyouApp):this
    {
        this._ay = ay;
        return this;
    }

    exportToStep():string
    {
        // Taken from: https://github.com/zalo/CascadeStudio/blob/1a0f44b4d7617cc9dfc1dd6833945e04e2dfc1c9/js/CADWorker/CascadeStudioFileUtils.js

        /* OC docs:
            - https://dev.opencascade.org/doc/refman/html/class_s_t_e_p_control___writer.html
            - Output modes: https://dev.opencascade.org/doc/refman/html/_s_t_e_p_control___step_model_type_8hxx.html#a032affe8dae498d429a83225f8c5da4e
        */

        const filename = this._getFileName() + '.step';
        let sceneCompoundShape = new ShapeCollection(this._ay.geom.all()
                                    .filter(s => s.visible())).toOcCompound(); // filter might return only one Shape

        console.info(`Exporter::exportToStep: Output of ${sceneCompoundShape.NbChildren()} Shapes`);

        const oc = this._ay.geom._oc;
        
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
                console.error("Exporter::exportToStep: File Export Transfer to STEP failed");
            }
        }
        else 
        {
            console.error("Exporter::exportToStep: File Export to STEP failed");
        }
    }

    async exportToStepWindow(content:string)
    {
        let stepContent = content || this.exportToStep();
        const fileHandle = await this.getNewFileHandle("STEP files", "text/plain", "step");
        this.writeFile(fileHandle, stepContent).then(() => 
        {
          console.info("Saved STEP to " + fileHandle.name);
        });
    }

    exportToStl():Uint8Array
    {
        // !!!! TODO: is seperate triangulation needed? !!!!
        /* See OC docs: 
            - https://dev.opencascade.org/doc/refman/html/class_stl_a_p_i.html
        */

        const oc = this._ay.geom._oc;
        const filename = this._getFileName() + '.stl';
        
        let sceneCompoundShape = new ShapeCollection(
                                        this._ay.geom.all().filter(s => s.visible())).toOcCompound();

        console.info(`Exporter::exportToStep: Output of ${sceneCompoundShape.NbChildren()} Shapes`);
        const ocStlWriter = new oc.StlAPI_Writer();
        ocStlWriter.ASCIIMode = false; // binary
        const result = ocStlWriter.Write(sceneCompoundShape, filename, new oc.Message_ProgressRange_1()); // Shape, stream content, ASCI or not

        if (!result)
        {
            console.error(`Exporter::exportToStl: Error exporting to STL. Try again, or another format!`);
            return null;
        }
        else {
            const stlFileBinary = oc.FS.readFile("/" + filename, { encoding:"binary" });
            oc.FS.unlink("/" + filename);
            return stlFileBinary?.buffer;
        }
        
    }

    async exportToStlWindow(content:ArrayBuffer)
    {
        // TODO: check with new binary
        const fileHandle = await this.getNewFileHandle("STL files", "application/octet-stream", "stl");
        this.writeFile(fileHandle, content).then(() => 
        {
          console.info("Saved STL to " + fileHandle.name);
        });
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
    async exportToGLTF(options?:ExportGLTFOptions):Promise<Uint8Array|string>
    {
        const startGLTFExport = performance.now();

        const oc = this._ay.geom._oc;
        options = (!options) ? { ... this.DEFAULT_GLTF_OPTIONS } : { ... this.DEFAULT_GLTF_OPTIONS, ...options };
        
        const meshingQuality = options.quality || this.DEFAULT_MESH_QUALITY;
        const filename = `file.${(options.binary) ? 'glb' : 'gltf'}`
        const docHandle = new oc.Handle_TDocStd_Document_2(new oc.TDocStd_Document(new oc.TCollection_ExtendedString_1()));

        const ocShapeTool = oc.XCAFDoc_DocumentTool.prototype.constructor.ShapeTool(docHandle.get().Main()).get(); // autonaming is on by default
        let ocIncMesh;

        /* For now we export all visible shapes in a flattened scene (without nested scenegraph) 
            and export as much properties (id, color) as possible 
            NOTE: OC only exports Solids to GLTF - use custom method to export Vertices/Edges/Wires
        */
        
        new ShapeCollection(this._ay.geom.all().filter(s => s.visible() && !['Vertex','Edge','Wire'].includes(s.type())))
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
        
        // TODO: We might need to pick up the seperate bin file for text-based GLTF
        const gltfFile = oc.FS.readFile(`./${filename}`, { encoding: (options.binary) ? 'binary' : 'utf8' });
        oc.FS.unlink("./" + filename);
        
        let gltfContent =  (options.binary) ? new Uint8Array(gltfFile.buffer) : gltfFile;

        // clean up OC classes
        ocShapeTool.delete();
        ocIncMesh.delete();
        ocGLFTWriter.delete();
        ocCoordSystemConverter.delete();

        console.info(`Exporter::exportToGLTF: Exported OC data in ${Math.round(performance.now() - startGLTFExport)}ms`);
        const startGLTFExtra = performance.now();

        // Force inclusion of points and lines to export
        if (options.includePointsAndLines)
        {
            const startGLTFPointsAndLines = performance.now();
            const pointAndLineShapes:ShapeCollection = new ShapeCollection(
                        this._ay.geom.all()
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
            const startGLTFExtraShapes = performance.now();
            const extraOutputShapes = new ShapeCollection(this._ay.geom.all().filter(s => (s.visible() && !['Vertex','Edge','Wire'].includes(s.type()))));
            gltfContent = await new GLTFBuilder().addSeperatePointsAndLinesForShapes(gltfContent, extraOutputShapes, meshingQuality); 
            console.info(`Exporter::exportToGLTF: Exported extra ${extraOutputShapes.length} Shapes in ${Math.round(performance.now() - startGLTFExtraShapes)}ms`);
        }

        // Add special archiyou data in GLTF asset.extras section
        if(options?.archiyouFormat)
        {
            // add special Archiyou data to GLTF
            const startGLTFArchiyouData = performance.now();
            gltfContent = await new GLTFBuilder().addArchiyouData(gltfContent, this._ay, options?.archiyouOutput || {}); 
            console.info(`Exporter::exportToGLTF: Exported archiyou data in ${Math.round(performance.now() - startGLTFArchiyouData)}ms`);	
        }

        console.info(`Exporter::exportToGLTF: Exported extra data in ${Math.round(performance.now() - startGLTFExtra)}ms`);	

        return gltfContent; // NOTE: text-based has no embedded buffers (so is empty)
    }

    /** Export GLTF (binary or text) to the browser window */
    async exportToGLTFWindow(content:Uint8Array|string)
    {
        const fileHandle = (typeof content === 'string') ? 
                    await this.getNewFileHandle("GLTF files", "text/plain", "gltf") :
                    await this.getNewFileHandle("GLTF files", "application/octet-stream", "glb");

        this.writeFile(fileHandle, content).then(() => 
        {
          console.info("Saved GLTF to " + fileHandle.name);
        });
    }

    async exportToGLTFAnimation(frameGLBs:Array<Uint8Array>):Promise<Uint8Array>
    {
        let gltfExporter = new GLTFBuilder();
        await gltfExporter.createAnimation(frameGLBs);
        let buffer = gltfExporter.toGLTFBuffer();
        return buffer;
    }

    async exportToGLTFAnimationWindow(content:Uint8Array)
    {
        const fileHandle = await this.getNewFileHandle("GLTF files", "application/octet-stream", "glb");
        this.writeFile(fileHandle, content).then(() => 
        {
            console.info("Saved GLTF Animation to " + fileHandle.name);
        });
    }

    /** Export entire (visual) model by creating a isometric 2D view  */
    exportToSvg(only2D:boolean=false):string
    {
        if(!only2D)
        {
            const visibleShapes = this._ay.geom.all().filter(s => s.visible());
            return visibleShapes._isometry().toSvg();
        }
        else {
            // Only export 2D edges on XY plane
            const edges2DCollection = new ShapeCollection(this._ay.geom.all().filter(s => s.visible() && s.is2DXY()));
            return edges2DCollection.toSvg();
        }
    }

    /** Combine all SVG's into one with SMIL keyframe animations
     *  We parse all SVGs and put all their content in seperate groups named "frame{{N}}"
     *  At the same time apply special SLIM SVG keyframe animation tags 
     *  so the SVG animation can be viewed inside ordinary browsers
     */
    exportToSvgAnimation(svgs:Array<string>):string
    {
        const SVG_FPS = 2; // 2 frames per second
        const SVG_FRAME_DURATION = 1 / SVG_FPS;

        const svgRootNodes = [] as Array<TXmlNode>;
        const svgFrameGroups = [] as Array<string>; // <g id="frameN"><set id="anN" />{{ svg paths }}</g>
        const numFrames = svgs.length;


        svgs.forEach( (svg,frameNum) => {
            const parsedSvg = txml.parse(svg)[0];
            svgRootNodes.push(parsedSvg); // to find largest bbox later
            const pathNodes = txml.filter(parsedSvg.children, node => node.tagName === 'path'); // SVG only consists of path elements

            const svgFrameGroup = `
                        <g id="frame${frameNum}" visibility="hidden">
                            <set id="an${frameNum*2}" attributeName="visibility" begin="${SVG_FRAME_DURATION*frameNum}; an${frameNum*2+1}.end" to="visible" dur="${SVG_FRAME_DURATION}s" />
                            <set id="an${frameNum*2+1}" attributeName="visibility" begin="an${frameNum*2}.end" to="hidden" dur="${numFrames*SVG_FRAME_DURATION-SVG_FRAME_DURATION}s" />
                            ${pathNodes.map(p => this._txmlNodeToString(p)).join('')}
                        </g>`
            svgFrameGroups.push(svgFrameGroup);
        })

        // Get biggest bounding box
        svgRootNodes.sort( (a,b) => this._getSvgBboxArea(b) - this._getSvgBboxArea(a))
        const svgAnimated = this._txmlNodeToString(svgRootNodes[0], svgFrameGroups.join('\n')); // Wrap al groupes with largest SVG bbox

        return svgAnimated
    }

    /** For some reason TXML does not offer a good node.toString() method */
    _txmlNodeToString(n:TXmlNode, wrapped:string=''):string
    {
        const attrsStr = Object.keys(n.attributes).map( attr => `${attr}="${n.attributes[attr]}"`).join(' ');
        return `<${n.tagName} ${attrsStr}>${wrapped}</${n.tagName}>`
    }

    _getSvgBboxArea(svg:TXmlNode):number
    {
        const bbox = svg.attributes['viewBox']?.split(' ');
        return (bbox) ? bbox[2] * bbox[3] : 0;
    }

    async exportToSvgWindow(content:string)
    {
        const fileHandle = await this.getNewFileHandle("SVG files", "text/plain", "svg");
        this.writeFile(fileHandle, content).then(() => 
        {
          console.info("Saved SVG Animation to " + fileHandle.name);
        });
    }

    _getFileName()
    {
        return 'exportmodel'
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

        if (open) 
        {
            return await window.showOpenFilePicker(options);
        } 
        else {
            return await window.showSaveFilePicker(options);
        }
    }

    async writeFile(fileHandle, contents)
    {
        // Create a FileSystemWritableFileStream to write to.
        const writable = await fileHandle.createWritable();
        // Write the contents of the file to the stream.
        await writable.write(contents);
        // Close the file and write the contents to disk.
        await writable.close();
    }


}