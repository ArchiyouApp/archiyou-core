import { Vector } from './internal'
import { MeshShape } from './internal' // ExportModels
import { toRad } from './internal'
import { Document, Accessor, Scene, WebIO, Node } from '@gltf-transform/core';
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

    constructor()
    {
        this.doc = new Document(); // Start new GLTF document
        this.scene = this.doc.createScene('scene');
        //this.buffer = this.doc.createBuffer('buffer'); //.setURI('buffer.bin');
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

    _quaternionFromAxisAngle(axis:Vector, angleDeg:number):Array<number> // TODO: TS type 
    {
        // see: https://en.wikipedia.org/wiki/Quaternions_and_spatial_rotation
        let angleRad = toRad(angleDeg);
        
        let c = Math.cos(angleRad/2);
        let s = Math.sin(angleRad/2);
        let rotationQuaternion = [ axis.x*s, axis.y*s, axis.z*s, c ]; // [X, Y, Z, W] in GLTF

        return rotationQuaternion;
    }

    /** To binary GLTF buffer */
    async toGLTFBuffer():Promise<Uint8Array>
    {
        const io = new WebIO({credentials: 'include'});
        let arrayBuffer = await io.writeBinary(this.doc); 
        return arrayBuffer as any; // avoid TS errors
    }
}