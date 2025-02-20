import { Geom, AnyShape, Vector, Vertex, Edge, Wire, Face, ShapeCollection, SceneGraphNode, Gizmo, DimensionLineData, DocData, 
            ArchiyouApp, StatementResult, ConsoleMessage, Shape, VertexCollection} from './internal'
import { toRad, MeshingQualitySettings, ArchiyouData, ArchiyouOutputSettings } from './internal'
import { Document, Accessor, Scene, WebIO, Node, BufferUtils  } from '@gltf-transform/core';
import { sequence } from '@gltf-transform/functions';

/* Docs:
    - animation sequence: https://gltf-transform.donmccurdy.com/functions.html 
    - https://github.com/donmccurdy/glTF-Transform/blob/8d1eba3/packages/functions/src/sequence.ts#L27
    - animation sequence options: https://github.com/donmccurdy/glTF-Transform/blob/8d1eba3de55b93e1f3a656f1701c37dea48b3af1/packages/functions/src/sequence.ts#L6

*/


export class GLTFBuilder
{
    doc:any; // TODO: TS typing
    scene:any;
    buffer:any;

    //// SETTINGS ////
    SUBSHAPE_OUTPUT_NAME_SEPERATOR:string = '___';

    constructor()
    {
        this.doc = new Document(); // Start new GLTF document
        this.scene = this.doc.createScene('scene');
        //this.buffer = this.doc.createBuffer('buffer'); //.setURI('buffer.bin');
    }

    /** To binary GLTF buffer */
    async toGLTFBuffer():Promise<Uint8Array>
    {
        const io = new WebIO({credentials: 'include'});
        let arrayBuffer = await io.writeBinary(this.doc); 
        return arrayBuffer as any; // avoid TS errors
    }

    //// GLTF ANIMATION EXPORT ////

    /** build Animated GLTF */
    async createAnimation(frameGLBs:Array<Uint8Array>)
    {
        await this.loadFramesIntoScene(frameGLBs) // load GLB buffers into scene

        // now we got all frames into seperate nodes - we can use the special function sequence to build a animation out of it
        // NOTE: Blender has default FPS on animation of 24 - we want to place one Shape frame into exactly one frame in Blender
        let sequenceOptions = { fps: 24, pattern: /FrameShapes[0-9]+/, animation: 'ParamAnimation', sort: false }; // see: https://github.com/donmccurdy/glTF-Transform/blob/8d1eba3de55b93e1f3a656f1701c37dea48b3af1/packages/functions/src/sequence.ts#L6
        this.doc.transform(sequence(sequenceOptions));
    }

    /** Load GLB of frame into scene */
    async frameGLBToNode(GLBBuffer:Uint8Array, nodeName:string)
    {  
        const io = new WebIO();
        let frameGlbDoc = await io.readBinary(GLBBuffer);
        let incomingNode = frameGlbDoc.getRoot().listScenes()[0].listChildren()[0];
        incomingNode.setName(nodeName); // set name

        // merge
        this.doc = this.doc.merge(frameGlbDoc);
        // combine scenes
        let addedScene = this.doc.getRoot().listScenes()[1]; // https://gltf-transform.donmccurdy.com/classes/core.root.html
        let addedNode = addedScene.listChildren()[0];
        
        // fix axis
        let rotationQuaternion = this._quaternionFromAxisAngle( new Vector(1,0,0), -90);
        addedNode.setRotation(rotationQuaternion);

        this.scene.addChild(addedNode);
        addedScene.dispose();        
    }

    async loadFramesIntoScene(frameGLBs:Array<Uint8Array>)
    {
        for (let i = 0; i < frameGLBs.length; i++)
        {
            await this.frameGLBToNode(frameGLBs[i], `FrameShapes${i}`);
        }
        // merge buffers
        const buffer = this.doc.getRoot().listBuffers()[0];
        this.doc.getRoot().listAccessors().forEach((a) => a.setBuffer(buffer));
        this.doc.getRoot().listBuffers().forEach((b, index) => index > 0 ? b.dispose() : null);
    }

    _quaternionFromAxisAngle(axis:Vector, angleDeg:number):Array<number> // TODO: TS type 
    {
        // see: https://en.wikipedia.org/wiki/Quaternions_and_spatial_rotation
        let angleRad = toRad(angleDeg);
        
        let c = Math.cos(angleRad/2);
        let s = Math.sin(angleRad/2);
        let rotationQuaternion = [ axis.x*s, axis.y*s, axis.z*s, c ]; // [X, Y, Z, W] in GLTF

        return rotationQuaternion;
    }

    //// SPECIAL ARCHIYOU GLTF ADDITIONS ////

    /** Apply Archiyou GLTF format data to raw GLTF content buffer */
    async addArchiyouData(gltfContent:Uint8Array|string, ay:ArchiyouApp, settings:ArchiyouOutputSettings={}):Promise<Uint8Array>
    {

        const io = new WebIO({credentials: 'include'});
        if (typeof gltfContent === 'string')
        {
            // TODO
        }
        else {
            // Open ArrayBuffer and write extra data
            try 
            {
                this.doc = await io.readBinary(new Uint8Array(gltfContent)); // Force Uint8Array from ArrayBuffer
                let asset = this.doc.getRoot().getAsset();

                asset.generator = 'Archiyou';
                asset.extras = {};
                asset.extras.archiyou = {
                    // TODO: basic information like author?
                    scenegraph: ay.geom.scene.toGraph(),
                    gizmos: ay.gizmos, // TODO: need to create Gizmo in Geom not in the Worker
                    annotations: ay.geom._annotator.getAnnotationsData(),
                    // Console Messages. Include or not, or select types. NOTE: Console can be the standard console in DEBUG mode
                    messages: (settings?.messages !== false && ay?.console?.getBufferedMessages) ? ay.console.getBufferedMessages(settings?.messages) : [], 
                    // Document data by document name in special format for AY doc viewers (PDF and web)
                    docs: (settings?.docs !== false) ? (ay?.doc?.toData(settings?.docs) || {}) : {},  // TODO: toData is async: problem?
                    pipelines: ay.geom.getPipelineNames(), // TODO: Make this definitions not only names
                    metrics: (settings?.metrics !== false) ? (ay?.calc?.metrics() || {}) : {},
                    tables: (settings?.tables !== false) ? (ay?.calc?.toTableData() || {}) : {}, // danfojs-nodejs has problems. Disable on node for now
                    /* TODO: pipeline
                        Export models of pipelines for visualisation (GLB) and exports (STL, DXF) etc
                        something like:
                        pipelineModels: {
                            'cnc' : { 'glb' : { ... }, 'dxf' : { .... }},
                            '3dprint' : { 'glb : { ... }, 'stl' : { ...} }
                        }
                    */
                    managedParams: ay?.paramManager?.getOperatedParamsByOperation(),
                } as ArchiyouData
                
                const buffer = io.writeBinary(this.doc); 
                return buffer; 
            }   
            catch(e)
            {
                console.error(`GLTFBuilder::addArchiyouData(): Error "${e}". Returned original`)
                return gltfContent
            }
        }
    }


    /** Add all loose point and line Shapes (Vertex,Edge,Wire) to the GLTF buffer */
    async addPointsAndLines(gltfContent:Uint8Array, shapes:ShapeCollection, quality:MeshingQualitySettings):Promise<Uint8Array>
    {
        const io = new WebIO({credentials: 'include'});
        this.doc = await io.readBinary(gltfContent);
        const buffer = this.doc.getRoot().listBuffers()[0];

        // Create a node for every loose Vertex (TODO: check performace implications?)
        shapes.getShapesByType('Vertex').forEach(v => this._addPoints(v, buffer));
       
        // For every Edge and Wire make a seperate node
        const lines = new ShapeCollection(shapes.filter(s => ['Edge', 'Wire'].includes(s.type()))); // force collection from filter
        lines.forEach( l => 
        {
            this._addShapeLines(l, buffer, quality);
        })
                
        // export new GLTF binary content
        return io.writeBinary(this.doc); 
    }

    /** Add Vertices of Shape (including just one Vertex) as node to GLTF */
    _addPoints(shape:AnyShape, gltfBuffer:any)
    {
        let vArr:Array<number> = [];

        shape.vertices().forEach(v => {
            let va = v.toArray()
            vArr = vArr.concat([va[0],va[2], -va[1]]) // just switch z and y coordinate to fix different coordinate system
        })
        
        const gltfVertexBuffer = this.doc
            .createAccessor()
            .setArray(new Float32Array(vArr))
            .setType('VEC3')
            .setBuffer(gltfBuffer) // this automatically augments to existing buffer
        
        const gltfVertexPrimitive = this.doc
            .createPrimitive()
            .setAttribute('POSITION', gltfVertexBuffer)
            .setMode(0) // Point mode see: https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#_mesh_primitive_mode

        // color (TODO: check if this property is saved correctly)
        const shapeName = `${shape.getId()}__${shape.getName() || 'UnnamedObj' }${this.SUBSHAPE_OUTPUT_NAME_SEPERATOR}Points`;
        const rgba = shape._getColorRGBA();
        if (rgba)
        {
            const material = this.doc.createMaterial(shapeName)
                            .setBaseColorFactor(rgba) // RGBA
            gltfVertexPrimitive.setMaterial(material)
        }
        
        const vertMesh = this.doc.createMesh();
        vertMesh.addPrimitive(gltfVertexPrimitive);
        const vertNode = this.doc.createNode().setMesh(vertMesh).setName(shapeName);
        this.doc.getRoot().listScenes()[0].addChild(vertNode); // add node to scene
    }

    _addShapeLines(shape:AnyShape, gltfBuffer:any, quality:MeshingQualitySettings)
    {
        let lineArr:Array<number> = [];
        let edgesOfShape = shape.toMeshEdges(quality); // as EdgeMesh objects
        let lineCoords = [];
        
        edgesOfShape.forEach(e => {
            let edgeCoords = e.vertices; // these can have more than 6 for non-line edges!
            
            for (let i = 0; i < edgeCoords.length; i +=3  ) // coordinate index
            {
                const lineEdgeVert = [edgeCoords[i], edgeCoords[i+2], -edgeCoords[i+1]] // again switch Z and Y axis
                lineCoords = lineCoords.concat(lineEdgeVert)

                if ( i !== 0 && i !== edgeCoords.length - 3)
                {
                    // every GLTF edge is made of two vertex pairs (no line string like GL_LINE_STRIP) so add a extra vertex at every end vertex of new line edge
                    // except for the first and last vertex - if AY Edge is a Line (only two vertices) no GLTF vertices are added
                    lineCoords = lineCoords.concat(lineEdgeVert);
                }
                
            }
        })
        lineArr = lineArr.concat(lineCoords)
        
        const gltfLineBuffer = this.doc
            .createAccessor()
            .setArray(new Float32Array(lineArr))
            .setType('VEC3')
            .setBuffer(gltfBuffer)

        const gltfLinePrimitive = this.doc
            .createPrimitive()
            .setAttribute('POSITION', gltfLineBuffer)
            .setMode(1); // line mode

        // color
        const shapeName = `${shape.getId()}__${shape.getName() || 'UnnamedObj'}${this.SUBSHAPE_OUTPUT_NAME_SEPERATOR}Lines`; // default is 'Line' is name is undefined
        const rgba = shape._getColorRGBA();
        if (rgba)
        {
            const material = this.doc.createMaterial(shapeName)
                            .setBaseColorFactor(rgba) // RGBA
            gltfLinePrimitive.setMaterial(material)
        }

        const lineMesh = this.doc.createMesh();
        lineMesh.addPrimitive(gltfLinePrimitive);
        const lineNode = this.doc.createNode().setMesh(lineMesh).setName(shapeName);
        this.doc.getRoot().listScenes()[0].addChild(lineNode) // add node to scene
        
    }

    /** For visualization purposes it's handy output seperate point- and line buffer into the GLTF
     *  So these can be seperately styled in a GLTF viewer
     */
    async addSeperatePointsAndLinesForShapes(gltfContent:Uint8Array, shapes:ShapeCollection, quality:MeshingQualitySettings):Promise<Uint8Array>
    {
        const io = new WebIO({credentials: 'include'});
        this.doc = await io.readBinary(gltfContent);
        let buffer = this.doc.getRoot().listBuffers()[0];
        
        shapes.forEach(shape =>
        {
            this._addPoints(shape, buffer); // Add Vertices of Shape
            this._addShapeLines(shape, buffer,quality); // Add Edges of Shape to GLTF 
        })

        // export new GLTF binary content
        return await io.writeBinary(this.doc); 
    }

    //// READ-ONLY FUNCTIONS ////

    /** Get ArchiyouData from GLTF binary */
    async readArchiyouData(gltf:Uint8Array):Promise<ArchiyouData>
    {   
        const io = new WebIO();
        const doc = await io.readBinary(gltf);
        return (doc.getRoot().getAsset()?.extras as any)?.archiyou as ArchiyouData; // avoid TS errors
    }

}