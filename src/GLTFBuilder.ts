import { Geom, Vector, SceneGraphNode, Gizmo, DimensionLineData, DocData, ArchiyouState, StatementError, ConsoleMessage} from './internal'
import { toRad } from './internal'
import { Document, Accessor, Scene, WebIO, Node, BufferUtils } from '@gltf-transform/core';
import { sequence } from '@gltf-transform/functions';
import * as base64js from 'base64-js'

/* Docs:
    - animation sequence: https://gltf-transform.donmccurdy.com/functions.html 
    - https://github.com/donmccurdy/glTF-Transform/blob/8d1eba3/packages/functions/src/sequence.ts#L27
    - animation sequence options: https://github.com/donmccurdy/glTF-Transform/blob/8d1eba3de55b93e1f3a656f1701c37dea48b3af1/packages/functions/src/sequence.ts#L6

*/

/** Special Archiyou data inserted into asset.archiyou
    TODO: We use ComputeResult internally - which has a lot of overlap with this
    When we start using GLB format internally these types will merge
*/
export interface ArchiyouData
{
    scenegraph: SceneGraphNode
    gizmos: Array<Gizmo>,
    annotations: Array<DimensionLineData>, 
    docs: {[key:string]:DocData} // all documents in data and serialized content
    errors?: Array<StatementError>, // only needed for internal use in the future
    messages?: Array<ConsoleMessage>, // only needed for internal use in the future
}

export class GLTFBuilder
{
    doc:any; // TODO: TS typing
    scene:any;
    buffer:any;

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
    createAnimation(frameGLBs:Array<Uint8Array>):boolean
    {
        this.loadFramesIntoScene(frameGLBs) // load GLB buffers into scene

        // now we got all frames into seperate nodes - we can use the special function sequence to build a animation out of it
        // NOTE: Blender has default FPS on animation of 24 - we want to place one Shape frame into exactly one frame in Blender
        let sequenceOptions = { fps: 24, pattern: /FrameShapes[0-9]+/, animation: 'ParamAnimation', sort: false }; // see: https://github.com/donmccurdy/glTF-Transform/blob/8d1eba3de55b93e1f3a656f1701c37dea48b3af1/packages/functions/src/sequence.ts#L6
        this.doc.transform(sequence(sequenceOptions));
        return true;
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

    loadFramesIntoScene(frameGLBs:Array<Uint8Array>)
    {
        frameGLBs.forEach( (glb,i) => this.frameGLBToNode(glb, `FrameShapes${i}`));
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
    addArchiyouData(gltfContent:ArrayBuffer|string, ay:ArchiyouState):ArrayBuffer
    {
        const io = new WebIO({credentials: 'include'});
        if (typeof gltfContent === 'string')
        {
            // TODO
        }
        else {
            // Open ArrayBuffer and write extra data
            this.doc = io.readBinary(gltfContent);
            let asset = this.doc.getRoot().getAsset();

            asset.generator = 'Archiyou';
            asset.extras = {};
            asset.extras.archiyou = {
                // TODO: basic information like author?
                scenegraph: ay.geom.scene.toGraph(),
                gizmos: ay.gizmos, // TODO: need to create Gizmo in Geom not in the Worker
                annotations: ay.geom._annotator.getAnnotations(),
                // Dont do: messages, errors
            } as ArchiyouData
            
            let buffer = io.writeBinary(this.doc); 
            return buffer; 
        }
    }

}