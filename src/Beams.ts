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
 *          - alignment: where the base line is within the beam is it base coordinate system of width=X, height=Z
 *          - base line: the line that start from a point set by the alignment, along the axis of the beam along the length of it
 *          - pitch: the angle in degrees from beam axis to the XY plane
 *          - rotation: angle in degrees of beam axis around Z-axis starting from X-axis
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
import { ArchiyouApp, Point, Vector, AnyShape, Vertex, Edge, Face, Solid, Edge, ShapeCollection, AnyShapeCollection } from './internal'
import { Alignment, PointLike } from './internal'
import { checkInput } from './decorators'; // Import directly to avoid error in ts-node

//// SETTINGS ////

const BEAM_SECTION_WIDTH_DEFAULT = 100;
const BEAM_SECTION_HEIGHT_DEFAULT = 100;
const BEAM_SECTION_LENGTH_DEFAULT = 2000;
const BEAM_TYPE_PROPERTIES = {
    beam: { pitch: 0, rotation: 0, alignment: 'centerbottom'},
    post: { pitch: 90, rotation: 0, alignment: 'center', placeOtherAt: 'end' },
    stud: { pitch: 90, rotation: 0, alignment: 'center', placeOtherAt: 'end' },
    brace: { pitch: 45, rotation: 0, alignment: 'centerbottom' },
    rafter : { pitch: 45, rotation: 0, alignment: 'centerbottom' },
    noggin : { pitch: 0, rotation: 90, alignment: 'centerbottom'},
    girt : { pitch: 0, rotation: 0, alignment: 'centerbottom' },
}
const BEAM_PLACE_DEFAULT_ALIGNMENT = 'center'


//// BEAM MODULE ////

export class Beams
{
    _ay:ArchiyouApp; // access to all Archiyou app and modules
    activeSection:BeamSection
    beams: Array<Beam> = [];

    //// SETTINGS ////

    

    //// END SETTINGS ////


    constructor(ay?:ArchiyouApp)
    {
        if(ay)
        {
            this._ay = ay;
            this._ay.beams = this;
        }

        this.activeSection = new BeamSection();
        this.setBeamCreationMethods();
    }

    setArchiyou(ay:ArchiyouApp)
    {
        if(!ay){ throw new Error(`Beams:Please supply a reference to ArchiyouApp when creating Beams module instance!`) }
        this._ay = ay;
    }

    /** Set handy globals on a given context */
    setGlobals(scope:any)
    {
        scope.beam = this.new.bind(this);
    }

    setBeamCreationMethods()
    {
        Object.keys(BEAM_TYPE_PROPERTIES).forEach(bt => {
             this[bt] = (length) => this.new(bt as BeamType, length) 
        });
    }

    //// CREATION METHODS ////

    new(type:BeamType = 'beam', length?:number)
    {
        const b = new Beam(this);

        b.type(type, length); 
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

/**
 *  Beam is fully defined by:
 * 
 *   - base line: start position, length and direction (pitch and rotation) 
 *      This is the diagramatic representation of a Beam and is the most important abstraction
 *   - section (2D section) and its alignment to the line
 *   
 *  Defining a Beam goes step-wise, either by settings primary properties directly
 *  but probably more by defining the type (Beam.post(), Beam.brace()) and relations.
 *  
 *  The input of the user is focused on defining the Beam (type(), length(), at()) and 
 *  its context (place()) and we can determine the most probably solution based on the most practical outcomes.
 *  This operates on the diagramatic (base-line only) representation of a system of beams
 *  
 *  At the last phase of definition the user can tune the details of the Beam, which operates on the real solid
 *  representation of the beams
 * 
 */
class Beam
{
    _type?:BeamType = 'beam';
    _flags?:BeamFlags = {
        autoLength: true,
        autoPitch: true,
        autoRotation: true,
    };
    _section:BeamSection;
    _others:Array<Beam>; // all beams in the scene created with the Beams module (by reference)
    _relations:Array<BeamRelation>; // other beams that are related to this one

    _id:string;
    _length:number; // can be set manually or automatic
    _position:Point; // position of pivot (start of base line) in space of beam 
    _pitch:number = 0;
    _rotation:number = 0; // rotation around z-axis starting from x-axis
    _roll:number = 0; // rotation around internal axis
    _alignment:Alignment = 'centerbottom'; // alignment in section plane string (ie lefttop, rightcenter) or relative coordinates [0-1,0-1] of width and height relatively
    _shape:AnyShape;
    _baseLine:Edge;

    name:string; // easy name to identify later

    constructor(parent:Beams)
    {
        this._section = parent.activeSection.copy(); // deep copy
        this._others = parent.beams; // reference
        this._id = uuidv4().toString();
    }

    //// BASE SHAPE AND POSITIONING ////

    length(l:number)
    {
        if(l){ this._length = l };
    }

    /** Set position of the beam */
    @checkInput(['PointLike'], ['Vector'])
    at(p:PointLike):this
    {
        const pv = (p as Vector); // auto converted
        const mv = pv.subtract(this._position);
        this._shape.move(mv);
        this._position = pv.toPoint();
        this._updateBaseLine()
        
        return this;
    }

    _updateBaseLine()
    {
        this._setBaseLine(false);
    }

    move(p:PointLike, ...args):this
    {
        this._shape.move(p, ...args);
        this._position.move(p, ...args);
        this._updateBaseLine();
        return this;
    }

    /** Get start of base line of Beam 
     *  Start is always the lowest, most left position of the base line
    */
    start():Point
    {
        return this._setBaseLine().start().toPoint();
    }

    /** Get end base line of Beam */
    end():Point
    {
        return this._setBaseLine().end().toPoint();
    }

    /** Make Section Face with correct orientation for the Beam 
     *  NOTE: We anticipate more complex sections, like I-beams, cylinders etc.
    */
    _getOrientatedSectionFace():Face
    {
        // We start in Section plane (XZ) with normal along y-axis
        const sectionFace = new Face().makePlane(this._section.width, this._section.height,[0,0,0], [0,1,0]); // center of plane at origin
        const alignmentPerc:Array<number> = sectionFace._alignPerc(this._alignment); // alignment inside Section from string or [px,py]
        const sectionPivot = sectionFace.bbox().getPositionAtPerc(alignmentPerc);
        const movePivotVec = new Vector().subtracted(sectionPivot.toVector());
        this._position = new Point(0,0,0); // position always start at origin

        sectionFace
            .move(movePivotVec)
            .rotateX(this._pitch,[0,0,0]).rotateZ(this._rotation-90, this._position);

        return sectionFace;
    }

    /** Set Beam solid Shape from base properties or replace if existing */
    _setShape():this
    {
        const sectionFace = this._getOrientatedSectionFace();
        const line = this._setBaseLine();
        const solid = sectionFace.sweeped(line, true, true);
        
        if(!this._shape)
        {
            this._shape = solid;
            this._shape.addToScene();
        }
        else {
            this._shape.replaceShape(solid);
        }
        
        return this;
    }

    _setFromStartEnd():this
    {
        
        return this;
    }

    /** Get line along axis of Beam that starts from the pivot to the end of the Beam */
    _setBaseLine(cached:boolean=true):Edge
    {
        if (cached && this._baseLine)
        { 
                return this._baseLine   
        };

        const dir = new Vector(1,0,0).rotateY(-this._pitch).rotateZ(this._rotation); // NOTE: rotation around -y gives positive rotation from X to Z
        if(dir.z < 0){ dir.reverse() } // make sure the base line always has its start at the lowest Z axis
        // TODO
        //if(dir.x < 0){ dir.reverse() } // make sure the base line start is always most left
        // if length is not set
        if(!this._length)
        {
            this._length = BEAM_SECTION_LENGTH_DEFAULT;
            this._flags.autoLength = true;
        }
        const baseLine = new Edge().makeLine(this._position, this._position.moved(dir.scaled(this._length)))
        
        if(this._baseLine)
        {
            this._baseLine.replaceShape(baseLine);
        }
        else {
            this._baseLine = baseLine;
            this._baseLine.addToScene().color('blue').dashed();
        }

        return baseLine
    }


    //// CREATION AND TYPING ////

    type(t:BeamType, length?:number): this
    {
        if(!BEAM_TYPE_PROPERTIES[t]){ throw new Error(`Beam:type: Unknown type: ${t}. Check config BEAM_TYPE_PROPERTIES.`) }

        this._type = t;

        Object.keys(BEAM_TYPE_PROPERTIES[t]).forEach( 
            prop => {
                const v = BEAM_TYPE_PROPERTIES[t][prop];
                // either prop on main, or flag
                if (this.hasOwnProperty('_'+prop))
                {
                    this['_'+prop] = v; 
                }
                else {
                    this._flags[prop] = v;
                }
            }
        );
        this._length = length;
        this._setShape();

        return this
    }

    //// SET SPECIFIC TYPES ////

    @checkInput([[Number,2000]], ['auto'])
    beam(length?:number)
    {
        return this.type('beam', length);
    }

    @checkInput([[Number,2000]], ['auto'])
    post(length?:number):this
    {
        return this.type('post', length);
    }

    @checkInput([[Number,2000]], ['auto'])
    stud(length?:number):this
    {
        return this.post(length); 
    }

    @checkInput([[Number,1000]], ['auto'])
    brace(length?:number):this
    {
        return this.type('brace', length);
    }

    //// PLACING, RELATIONS AND JOINTS ////
    /**
     *  Position this Beam from the top onto one or more other beams
     *  Relations will be formed, that are resolved into joints
     */
    place(others:BeamOrBeamSequence, at?:BeamBaseLineAlignment):this
    {
        if(others instanceof(Beam)) others = [others]
        else if (!Array.isArray(others)){ throw new Error(`Beam.place({others}): ERROR: Please supply one or more Beams to place this beam on. If you want to set position, use Beam.at() or Beam.move()!`); }
        
        const otherBeams = others.filter(o => o instanceof(Beam))

        if(otherBeams.length === 0){ throw new Error(`Beam.place({others}): ERROR: Please supply one or more Beams to place this beam on`);}
        // Place with one other beam: implicitely means 'on' if no alignment given
        else if (otherBeams.length === 1)
        {
            const otherBeam = otherBeams[0]
            this._placeAt(otherBeam, at ?? 'end');
        }

        return this;
    }

    /** The point on the base line of other beams to place this beam on/between */
    _placeAt(other:Beam, at?:BeamBaseLineAlignment):this
    {
       return this.at(other._pointAtBaseLine(at));
    }

    /** point along base line of Beam
     *  @param at start,end, middle/center or [0-1] or distance from start in model units (like mm)
     */
    _pointAtBaseLine(at?:BeamBaseLineAlignment):Point
    {   
        at = at ?? this._flags?.placeOtherAt ?? BEAM_PLACE_DEFAULT_ALIGNMENT; 
        const baseLine = this._setBaseLine();
        return ((typeof at === 'string') ? 
                baseLine[at]() :  // NOTE: center/middle,start and end are methods of Edge
                (at < 1.0) ? 
                    baseLine.pointAt(at) : 
                    baseLine.pointAtParam(at) // NOTE: for Line Edges U param is length from start
                ) as Point 
    }

    
}


//// TYPES, INTERFACES, TYPEGUARDS AND HELPER CLASSES ////

type BeamType = 'beam'|'post'|'stud'|'rafter'|'brace'|'nogging'|'girt'
type BeamSectionOrientation = 'flat'|'up'|'rect'
type BeamOrBeamSequence = Array<Beam>|Beam
type BeamBaseLineAlignment = 'start'|'end'|'center'|'middle'|number // alignment along base line of Beam
type BeamRelationType = 'placed'|'fitted'; // TODO: more

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

/** Describes a relation between two (or more) Beams */
class BeamRelation
{
    from:Beam
    to:Array<Beam> = [];
    type:BeamRelationType
    // TODO: more

    constructor(from:Beam,to:Array<Beam>|Beam, type?:BeamRelationType)
    {
        this.from = from;
        this.to = (Array.isArray(to) ? to : [to]);
        this.type = type ?? 'placed';
    }
}

/** Flags that keep track of state and behaviour of Beam */
interface BeamFlags
{
    fit?:boolean // if the beam is open to changing its shape to fit
    priority?:number // [TODO] priority of beam compared to relations
    placeOtherAt?:BeamBaseLineAlignment // where to put another Beam
    autoLength?:boolean
    autoRotation?:boolean
    autoPitch?:boolean
    // TODO: joint types
}



