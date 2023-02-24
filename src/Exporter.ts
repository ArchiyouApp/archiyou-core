import { MeshingQualitySettings, MeshShape } from './internal'
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

    constructor(parent:any) // Either reference to WebWorker or Main.vue
    {
        this._parent = parent;
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

    async exportToStepWindow(content)
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

    exportToGLTF(quality?:MeshingQualitySettings):ArrayBuffer
    {
        // !!!! TODO: is seperate triangulation needed? !!!!
        // Export GLTF with seperate meshes for each Shape
        const oc = this._parent.geom._oc;
        
        const filename = this._getFileName() + '.glb';
        const meshingQuality = quality || this._parent?.meshingQuality || this.DEFAULT_MESH_QUALITY;

        let sceneCompoundShape = this._parent.geom.all().filter(s => s.visible()).toOcCompound();
        
        // Taken from: https://github.com/donalffons/opencascade.js/blob/master/starter-templates/ocjs-create-nuxt-app/components/shapeToUrl.js
        const docHandle = new oc.Handle_TDocStd_Document_2(new oc.TDocStd_Document(new oc.TCollection_ExtendedString_1()));
        
        const shapeTool = oc.XCAFDoc_DocumentTool.prototype.constructor.ShapeTool(docHandle.get().Main()).get();
        shapeTool.SetShape(shapeTool.NewShape(), sceneCompoundShape);

        new oc.BRepMesh_IncrementalMesh_2(sceneCompoundShape, meshingQuality.linearDeflection, false, meshingQuality.angularDeflection, false);

        // Export a GLB file (this will also perform the meshing)
        const cafWriter = new oc.RWGltf_CafWriter(new oc.TCollection_AsciiString_2("./file.glb"), true);
        cafWriter.Perform_2(docHandle, new oc.TColStd_IndexedDataMapOfStringString_1(), new oc.Message_ProgressRange_1());

        // Read the GLB file from the virtual file system
        const glbFile = oc.FS.readFile("./file.glb", { encoding: "binary" });
        // TODO: unlink
        
        return glbFile.buffer;
    }

    async exportToGLTFWindow(content:ArrayBuffer)
    {
        const fileHandle = await this.getNewFileHandle("GLTF files", "application/octet-stream", "glb");
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