/**
 *  Archiyou Beams.ts module
 *      
 *      Tooling to make working with beams easy    
 *      It follows the explicit and implicit rules of practical building with beams,
 *      with a slight focus on wood construction
 *      
 *      Basic structure of a beam:
 * 
 *          - section: rectangular section of width along x-axis and height along z-axis. 
 *                      We anticipate other section than just rectangular ones, like I-profiles etc.
 *                      Because most construction is done with the same sections the section is saved in the module and re-used if not redefined
 *          - length: can be set by the user or automatically (based on context)
 *          - alignment: where the control line is within the beam is it base coordinate system of width=X, height=Z
 *          - control line: the line that start from a point set by the alignment, along the axis of the beam along the length of it
 *          - pitch: the angle in degrees from beam axis to the XY plane
 *          - yaw: angle in degrees of beam axis around Z-axis starting from X-axis
 *          - roll: [TODO] the angle around the internal axis of the beam
 *          - context: all other beams that might be related to this beam. Used in placing or creating joints etc.
 *          - relations: relationships with other beams
 *          - type: specific type of beam - post/stud, brace, rafter,girt/noggin  that set its core parameters 
 * 
 *      Creation
 *             TODO
 *      
 *      Context and joints
 *             TODO
 */

import { v4 as uuidv4 } from 'uuid'
import { ArchiyouApp, Vector, Vertex, Face, Solid } from './internal'
import { Alignment } from './internal'

//// SETTINGS ////

const BEAM_SECTION_WIDTH_DEFAULT = 100;
const BEAM_SECTION_HEIGHT_DEFAULT = 100;
const BEAM_TYPE_PROPERTIES = {
    beam: { angle: 0, yaw: 90, alignment: 'centerbottom' },
    post: { angle: 90, yaw: 0, alignment: 'center' },
    stud: { angle: 90, yaw: 0, alignment: 'center' },
    brace: { angle: 45, yaw: 0, alignment: 'centerbottom' },
    rafter : { angle: 45, yaw: 0, alignment: 'centerbottom' },
    noggin : { angle: 0, yaw: 90, alignment: 'centerbottom' },
    girt : { angle: 0, yaw: 0, alignment: 'centerbottom' },
}


//// BEAM MODULE ////

class Beams
{
    _ay:ArchiyouApp; // access to all Archiyou app and modules
    activeSection:BeamSection
    beams: Array<Beam> = [];


    constructor(ay:ArchiyouApp)
    {
        if(!ay){ throw new Error(`Beams:Please supply a reference to ArchiyouApp when creating Beams module instance!`) }

        this._ay = ay;
        this.activeSection = new BeamSection();

        this._ay.beams = this;
    }

    /** Set handy globals on a given context */
    setGlobals(context:any)
    {
        context.beam = this.beam;
    }

    //// CREATION METHODS ////

    beam():Beam
    {
        const b = new Beam(this);
        this.beams.push(b);
        return b
    }
    
    //// MANAGING BEAMS ////

    getLastBeam():Beam|null
    {
        return (this.beams.length === 0) ? null : this.beams[this.beams.length -1]
    }

    getPrevBeam(b:Beam):Beam
    {
        const i = this.beams.indexOf(b)
        return (i <= 0) ? null : this.beams[i]
    }

}

//// MAIN BEAM CLASS ////

class Beam
{
    type?:BeamType
    section:BeamSection
    length:number // can be set manually or automatic
    angle:number = 0 // angle to XY plane in degrees
    position:Vector // position of pivot (start of controle line) in space of beam 
    pitch:number = 0
    yaw:number = 0 // rotation around internal axis
    alignment:Alignment = 'centerbottom' // alignment in section plane string (ie lefttop, rightcenter) or relative coordinates [0-1,0-1] of width and height relatively
    others:Array<Beam> // all beams in the scene created with the Beams module
    relations:Array<Beam> // other beams that are related to this one

    _id:string
    _shape:Solid
    name:string // easy name to identify later

    constructor(parent:Beams)
    {
        this.section = parent.activeSection.copy(); // deep copy
        this.others = parent.beams; // reference
        this._id = uuidv4().toString();
    }

    //// BASE SHAPEING AND POSITIONING ////

    _getOrientatedSectionFace():Face
    {
        // We start in Section plane (XZ) with normal along y-axis
        const sectionFace = new Face().makePlane(this.section.width, this.section.height, [0,1,0]);
        const alignmentPerc:Array<number> = sectionFace._alignPerc(this.alignment); // alignment inside Section from string or [px,py]
        const pivot = sectionFace.bbox().getPositionAtPerc(alignmentPerc).toVertex();
        const rotAx = pivot.toVector().crossed([0,0,1]);
        pivot.rotateAround(this.pitch, rotAx, [0,0,0]);
        sectionFace.rotateAround(this.pitch, rotAx, [0,0,0]).align(new Vertex(), pivot, 'center');
        return sectionFace;
    }


    //// CREATION AND TYPING ////

    _setType(t:BeamType): this
    {
        if(!BEAM_TYPE_PROPERTIES[t]){ throw new Error(`Beam::_setType: Unknown type: ${t}. Check config BEAM_TYPE_PROPERTIES.`) }
        Object.keys(BEAM_TYPE_PROPERTIES[t]).forEach( prop => this[prop] = BEAM_TYPE_PROPERTIES[t][prop]);
        return this
    }

    post(length:number):this
    {
        this._setType('post');

    }
    
}


//// TYPES, INTERFACES, TYPEGUARDS AND HELPER CLASSES ////

type BeamType = 'beam'|'post'|'stud'|'rafter'|'brace'|'nogging'|'girt'
type BeamSectionOrientation = 'flat'|'up'|'rect'

class BeamSection
{
    _width: number
    _height: number
    _orientation?: BeamSectionOrientation

    constructor(width?:number, height?:number)
    {
        width = width ?? BEAM_SECTION_WIDTH_DEFAULT;
        height = height ?? BEAM_SECTION_HEIGHT_DEFAULT;
    }

    set width(w:number)
    {
        this._width = w;
    }

    set height(h:number)
    {
        this._height = h;
    }

    get height():number
    {
        return this._height;
    }

    get width():number
    {
        return this._height;
    }
    
    _setOrientation():BeamSectionOrientation
    {
        this._orientation = (this.width < this.height) ? 'up' : (this.width > this.height) ? 'flat' : 'rect'
        return this._orientation
    }

    copy():BeamSection
    {
        return new BeamSection(this.width, this.height)
    }
}



