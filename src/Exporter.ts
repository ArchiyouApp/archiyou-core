import { MeshingQualitySettings, Shape, AnyShape, ShapeCollection} from './internal'
import { MESHING_MAX_DEVIATION, MESHING_ANGULAR_DEFLECTION, MESHING_MINIMUM_POINTS, MESHING_TOLERANCE, MESHING_EDGE_MIN_LENGTH } from './internal';
import { GLTFBuilder } from './GLTFBuilder';

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

    //// END SETTINGS ////

    _parent = null; 

    constructor(parent:any) 
    {
        this._parent = parent; // Either reference to WebWorker or Main.vue
    }

    exportToStep():string
    {
        // Taken from: https://github.com/zalo/CascadeStudio/blob/1a0f44b4d7617cc9dfc1dd6833945e04e2dfc1c9/js/CADWorker/CascadeStudioFileUtils.js

        /* OC docs:
            - https://dev.opencascade.org/doc/refman/html/class_s_t_e_p_control___writer.html
            - Output modes: https://dev.opencascade.org/doc/refman/html/_s_t_e_p_control___step_model_type_8hxx.html#a032affe8dae498d429a83225f8c5da4e
        */

        const filename = this._getFileName() + '.step';
        let sceneCompoundShape = this._parent.geom.all().filter(s => s.visible()).toOcCompound();

        console.info(`Exporter::exportToStep: Output of ${sceneCompoundShape.NbChildren()} Shapes`);

        const oc = this._parent.geom._oc;
        
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

    exportToStl():ArrayBuffer
    {
        // !!!! TODO: is seperate triangulation needed? !!!!
        /* See OC docs: 
            - https://dev.opencascade.org/doc/refman/html/class_stl_a_p_i.html
        */

        const oc = this._parent.geom._oc;
        const filename = this._getFileName() + '.stl';
        
        let sceneCompoundShape = this._parent.geom.all().filter(s => s.visible()).toOcCompound();

        console.info(`Exporter::exportToStep: Output of ${sceneCompoundShape.NbChildren()} Shapes`);
        let ocStlWriter = new oc.StlAPI_Writer();
        ocStlWriter.ASCIIMode = false; // binary
        let result = ocStlWriter.Write(sceneCompoundShape, filename, new oc.Message_ProgressRange_1()); // Shape, stream content, ASCI or not

        if (!result)
        {
            console.error(`Exporter::exportToStl: Error exporting to STL. Try again, or another format!`);
            return null;
        }
        else {
            let stlFileBinary = oc.FS.readFile("/" + filename, { encoding:"binary" });
            oc.FS.unlink("/" + filename);
            return stlFileBinary.buffer;
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
    exportToGLTF(quality?:MeshingQualitySettings, binary:boolean=true, archiyouFormat:boolean=true, includePointsAndLines:boolean=true, extraShapesAsPointLines:boolean=true):ArrayBuffer|string
    {
        const oc = this._parent.geom._oc;
        
        const meshingQuality = quality || this._parent?.meshingQuality || this.DEFAULT_MESH_QUALITY;
        const filename = `file.${(binary) ? 'glb' : 'gltf'}`
        const docHandle = new oc.Handle_TDocStd_Document_2(new oc.TDocStd_Document(new oc.TCollection_ExtendedString_1()));

        const ocShapeTool = oc.XCAFDoc_DocumentTool.prototype.constructor.ShapeTool(docHandle.get().Main()).get(); // autonaming is on by default
        
        /* For now we export all visible shapes in a flattened scene (without nested scenegraph) 
            and export as much properties (id, color) as possible 
            NOTE: OC only exports Solids to GLTF - use custom method to export Vertices/Edges/Wires
        */
        
        this._parent.geom.all().filter(s => s.visible() && !['Vertex','Edge','Wire'].includes(s.type())).forEach(entity => {
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
                new oc.BRepMesh_IncrementalMesh_2(ocShape, meshingQuality.linearDeflection, false, meshingQuality.angularDeflection, false);
            }
        })

        const ocGLFTWriter = new oc.RWGltf_CafWriter(new oc.TCollection_AsciiString_2(filename), binary);
        
        const ocCoordSystemConverter = ocGLFTWriter.CoordinateSystemConverter();
        ocCoordSystemConverter.SetInputCoordinateSystem_2(oc.RWMesh_CoordinateSystem.RWMesh_CoordinateSystem_Zup);
        ocGLFTWriter.SetCoordinateSystemConverter(ocCoordSystemConverter);
        ocGLFTWriter.SetForcedUVExport(true); // to output UV coords
        ocGLFTWriter.Perform_2(docHandle, new oc.TColStd_IndexedDataMapOfStringString_1(), new oc.Message_ProgressRange_1());
        
        // TODO: We might need to pick up the seperate bin file for text-based GLTF
        const gltfFile = oc.FS.readFile(`./${filename}`, { encoding: (binary) ? 'binary' : 'utf8' });
        oc.FS.unlink("./" + filename);
        
        let gltfContent =  (binary) ? gltfFile.buffer : gltfFile;

        // clean up OC classes
        ocShapeTool.delete();
        ocGLFTWriter.delete();
        ocCoordSystemConverter.delete();

        // Force inclusion of points and lines to export
        if (includePointsAndLines)
        {
            const pointAndLineShapes:ShapeCollection = this._parent.geom.all().filter(s => (s.visible() && ['Vertex','Edge','Wire'].includes(s.type())));
            if (pointAndLineShapes.length > 0) gltfContent = new GLTFBuilder().addPointsAndLines(gltfContent, pointAndLineShapes, quality); 
        }

        // Add special archiyou data in GLTF asset.extras section
        if(archiyouFormat)
        {
            // add special Archiyou data to GLTF
            gltfContent = new GLTFBuilder().addArchiyouData(gltfContent, this._parent.ay); 
        }

        // extra base vertices and lines for every Shape used for specific visualization styles
        if (extraShapesAsPointLines)
        {
            const EXCLUDE_SHAPES_FOR_EXPORT = ['Vertex']; // We want to output vertices of edges/wires too! 
            // GLTFBuilder.addSeperatePointsAndLinesForShapes() skips the lines for these, but includes the points
            const extraOutputShapes = this._parent.geom.all().filter(s => (s.visible() && !EXCLUDE_SHAPES_FOR_EXPORT.includes(s.type())));
            gltfContent = new GLTFBuilder().addSeperatePointsAndLinesForShapes(gltfContent, extraOutputShapes, quality); 
        }
        
        
        return gltfContent; // NOTE: text-based has no embedded buffers (so is empty)
    }

    /** Export GLTF (binary or text) to the browser window */
    async exportToGLTFWindow(content:ArrayBuffer|string)
    {
        const fileHandle = (typeof content === 'string') ? 
                    await this.getNewFileHandle("GLTF files", "text/plain", "gltf") :
                    await this.getNewFileHandle("GLTF files", "application/octet-stream", "glb");

        this.writeFile(fileHandle, content).then(() => 
        {
          console.info("Saved GLTF to " + fileHandle.name);
        });
    }

    exportToGLTFAnimation(frameGLBs:Array<Uint8Array>):Promise<Uint8Array>
    {
        let gltfExporter = new GLTFBuilder();
        gltfExporter.createAnimation(frameGLBs);
        let buffer = gltfExporter.toGLTFBuffer();
        return buffer;
    }

    async exportToGLTFAnimationWindow(content:ArrayBuffer)
    {
        const fileHandle = await this.getNewFileHandle("GLTF files", "application/octet-stream", "glb");
        this.writeFile(fileHandle, content).then(() => 
        {
          console.info("Saved GLTF Animation to " + fileHandle.name);
        });
    }

    exportToSVG():string
    {
        // For now only export 2D edges on XY plane
        let edges2DCollection = this._parent.geom.all().filter(s => s.visible() && s.type() === 'Edge' && s.is2DXY());
        return edges2DCollection.toSvg();
    }

    async exportToSVGWindow(content:string)
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