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
import { ArchiyouApp, Point, Vector, AnyShape, Vertex, Edge, Face, Solid, Edge, ShapeCollection, AnyShapeCollection, isBeamBaseLineAlignment } from './internal'
import { Alignment, PointLike, isPointLike } from './internal'
import { checkInput } from './decorators'; // Import directly to avoid error in ts-node

//// SETTINGS ////

const BEAM_SECTION_WIDTH_DEFAULT = 100;
const BEAM_SECTION_HEIGHT_DEFAULT = 100;
const BEAM_SECTION_LENGTH_DEFAULT = 2000;
const BEAM_TYPE_PROPERTIES = {
    beam: { pitch: 0, rotation: 0, alignment: 'centerbottom', autoLength:true, autoPitch: false},
    post: { pitch: 90, rotation: 0, alignment: 'center', placeOtherAt: 'end', autoLength: false },
    stud: { pitch: 90, rotation: 0, alignment: 'center', placeOtherAt: 'end', autoLength: false },
    diagonal: { pitch: 45, alignment: 'center', autoPitch: true  }, // stabilizing diagonal between two Beam members, mostly posts. Pitch/rotation is set from parents
    brace: { pitch: 45, rotation: 0, alignment: 'centerbottom', autoPitch: false }, // stabilizing diagonal between a post and beam
    rafter : { pitch: 45, rotation: 0, alignment: 'centerbottom', autoPitch: true },
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

    reset()
    {
        this.beams = [];
        this.activeSection = new BeamSection();
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

    /** TODO: Resolve all joints of Beam system */
    join()
    {
        console.log('==== BEAMS JOIN ====');

        this.beams.forEach((b,i) => 
            {
                console.log(`--- BEAM ${b._type} serial=${b._serial} with ${b._relations.length} relations`);
                b._relations.forEach((r,i) => {
                    console.log(`RELATION: ${r.type}`)
                })
            }        
        )
    }

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
export class Beam
{
    _type?:BeamType = 'beam';
    // Default flags. NOTE: overwriting on creation by BEAM_TYPE_PROPERTIES
    _flags?:BeamFlags = {
        autoLength: true,
        autoPitch: true,
        autoRotation: true,
        placeOtherAt: 'center',
    };

    _id:string;
    _serial:number; // 0..N based on creation order
    _parent:Beams;
    _length:number; // can be set manually or automatic
    _position:Point; // position of pivot (start of base line) in space of beam 
    _pitch:number = 0;
    _rotation:number = 0; // rotation around z-axis starting from x-axis
    _roll:number = 0; // rotation around internal axis
    _alignment:Alignment = 'centerbottom'; // alignment in section plane string (ie lefttop, rightcenter) or relative coordinates [0-1,0-1] of width and height relatively
    _shape:AnyShape;
    _baseLine:Edge;

    _section:BeamSection;
    _others:Array<Beam>; // all beams in the scene created with the Beams module (by reference)
    _relations:Array<BeamRelation> = []; // other beams that are related to this one

    name:string; // easy name to identify later [TODO]

    constructor(parent:Beams)
    {
        this._parent = parent; 
        this._section = this._parent.activeSection.copy(); // deep copy
        this._others = this._parent.beams; // reference
        this._id = uuidv4().toString();
        this._serial = (this._others ?? []).length;
    }

    //// BASE PROPERTIES ////

    @checkInput('Number','auto')
    length(l:number, updateShape:boolean=true):this
    {
        if(l){ 
            this._length = l;
            if(updateShape){ this._setShape() }; // regenerate shape with new length
        }
        return this;
    }

    direction():Vector
    {
        return this.end().toVector().subtracted(this.start().toVector()).normalize();
    }

    center():Point|null
    {
        return (this._length)
            ? this.start().moved(this.direction().scale(this._length/2))
            : null
    }

    @checkInput(['PointLike','PointLike'],['Point','Point'])
    _setLengthFrom(start:PointLike, end:PointLike):this
    {
        const l = (start as Point).distance(end); // Point autoconverted
        this.length(l);

        return this;
    }

    /** Set position of the beam */
    @checkInput(['PointLike'], ['Vector'])
    at(p:PointLike):this
    {
        const pv = (p as Vector); // auto converted
        const mv = pv.subtract(this._position);

        this._shape.move(mv);
        this._position = pv.toPoint();
        
        this._updateBaseLine();
        
        return this;
    }

    /** Place this Beam along a Line given by start and end position */
    @checkInput(['PointLike','PointLike'], ['Vector','Vector'])
    along(start:PointLike, end:PointLike, autoLength:boolean=false):this
    {
        const [s,e]  = this._checkStartEnd(start,end);

        const dir = e.toVector().subtract(s.toVector())

        this.at(s); // place at position

        this.pitch(dir.angle(dir.copy().setZ(0))); // pitch is angle between along direction and a copy projected on XY plane (z = 0) - NOTE: don't update shape just yet!
        this.rotation(dir.angle2D()); // rotate to become parallel to rotation of line

        if(autoLength)
        { 
            this._setLengthFrom(s,e)
        }

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

    /** Set absolute pitch angle in degrees of this Beam */
    pitch(angle:number):this
    {
        this._pitch = angle;
        this._setShape();
        return this;
    }   

    /** Set absolute rotation to given angle */
    rotation(angle:number):this
    {
        if(!this._shape){ this._setShape() };
        this.rotate(angle - this._rotation);
        return this;
    }

    /** Rotate around Z-axis in degrees */
    rotate(d:number):this
    {
        this._rotation += d;
        this._shape.rotateZ(d, this._position);
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

    /** Make sure of the given two Points start is the most bottom and left */
    @checkInput(['PointLike','PointLike'],['Vector','Vector'])
    _checkStartEnd(start:PointLike, end:PointLike):[Point,Point]
    {
        const line = new Edge().makeLine(start,end);

        if (line.start().x > line.end().x)
        {
            line.reverse();
        }
        if(line.start().z > line.end().z) // lowest has priority as start
        {
            line.reverse();
        }

        return [line.start().toPoint(),line.end().toPoint()]
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

    //// SHAPING ////

    /** Make Section Face at start position with correct orientation for the Beam 
     *  NOTE: With sweep() we anticipate more complex sections, like I-beams, cylinders etc.
    */
    _getOrientatedSectionFace():Face
    {
        // We start in Section plane (XZ) with normal along y-axis
        const sectionFace = new Face().makePlane(this._section.width, this._section.height,[0,0,0], [0,1,0]); // center of plane at origin
        const alignmentPerc:Array<number> = sectionFace._alignPerc(this._alignment); // alignment inside Section from string or [px,py]
        const sectionPivot = sectionFace.bbox().getPositionAtPerc(alignmentPerc);
        const movePivotVec = new Vector().subtracted(sectionPivot.toVector()); // offset Solid from base line according to alignment
        
        if(!this._position){ this._position = new Point(0,0,0); } // position always start at origin

        sectionFace
            .move(movePivotVec)
            .rotateX(this._pitch,[0,0,0])
            .rotateZ(this._rotation-90, [0,0,0])
            .moveTo(this._position.moved(this._getBaseLineToSectionCenterVec())) // move to start of baseline
            

        return sectionFace;
    }

    /** Get offset Vector from baseline to center of Beam section */
    _getBaseLineToSectionCenterVec():Vector
    {
        const sectionFace = new Face().makePlane(this._section.width, this._section.height,[0,0,0], [0,1,0]); // center of plane at origin
        const alignmentPerc:Array<number> = sectionFace._alignPerc(this._alignment); // alignment inside Section from string or [px,py]
        return sectionFace.bbox().getPositionAtPerc(alignmentPerc)
                    .toVector()
                    .rotateX(this._pitch)
                    .rotateZ(this._rotation-90)
                    .reverse()

    }

    /** Set Beam solid Shape from base properties or replace if existing 
     *  NOTE: base line has priority over the solid Shape!
    */
    _setShape():this
    {
        const sectionFace = this._getOrientatedSectionFace(); // orientated Face at start of baseline
        const line = this._setBaseLine(false); // update baseline first
        const solid = sectionFace._sweeped(line, true, false) // Created Solid from Section

        if(!this._shape)
        {
            solid.addToScene();
            this._shape = solid;
        }
        else {
            this._shape.replaceShape(solid); // replace in Scene
            this._shape = solid; // Need to update reference too!
        }
        
        return this;
    }

    /** Remove any shape from inner Shape
     *  TODO: Invent something with operation stack to make this parametric
     */
    _subtract(other:AnyShape):this
    {
        if(this._shape)
        {
            // NOTE: we still need to update the reference (why?)
            const subtract = this._shape.subtract(other);
            this._shape = ( ShapeCollection.isShapeCollection(subtract) ) ? (subtract as ShapeCollection).first() : subtract as AnyShape;
        }
        return this;
    }

    _union(other:AnyShape):this
    {
        if(this._shape)
        {
            // NOTE: we still need to update the reference (why?)
            const union = this._shape.union(other);
            this._shape = ( ShapeCollection.isShapeCollection(union) ) ? (union as ShapeCollection).first() : union as AnyShape;
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

        // if length is not set
        if(!this._length)
        {
            this._length = BEAM_SECTION_LENGTH_DEFAULT;
            this._flags.autoLength = true;
        }
        const baseLine = new Edge().makeLine(this._position, this._position.moved(dir.scaled(this._length)))

        if(baseLine.start().x > baseLine.end().x){ baseLine.reverse() } // make sure the base line start is always most left
        if(baseLine.start().z > baseLine.end().z ){ baseLine.reverse() } // make sure the base line always has its start at the lowest Z axis

        if(this._baseLine)
        {
            this._baseLine.replaceShape(baseLine);
            this._baseLine = baseLine; // Need to update reference too!
        }
        else {
            this._baseLine = baseLine;
            this._baseLine.addToScene().color('blue').dashed();
        }

        return this._baseLine
    }


    //// TYPING AND POSITIONING IN CONTEXT ////

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

    //// PLACING AND RELATIONS ////
    /**
     *  Position this Beam from the top onto one or more other beams
     *  Relations will be formed, that are resolved into joints
     */
    place(others:BeamOrBeamSequence, at?:BeamBaseLineAlignment):this
    {
        if(others instanceof Beam) others = [others]
        else if (!Array.isArray(others)){ throw new Error(`Beam.place({others}): ERROR: Please supply one or more Beams to place this beam on. If you want to set position, use Beam.at() or Beam.move()!`); }
        
        const otherBeams = others.filter(o => o instanceof Beam)

        if(otherBeams.length === 0)
        { 
            throw new Error(`Beam.place({others}): ERROR: Please supply one or more Beams to place this beam on`);
        }
        else if (otherBeams.length === 1)
        {
            // Place with one other beam: implicitely means 'on' if no alignment given
            const otherBeam = otherBeams[0]
            at = at ?? otherBeam._flags.placeOtherAt ?? 'end'
            const relationAt = this._placeAt(otherBeam, at);
            this.rotation(otherBeam._rotation); // Take over rotation of parent
            this._addRelation(otherBeam, relationAt);
        }
        else if (otherBeams.length === 2)
        {
            // Place a beam on/between two others
            at = at ?? 'end';
            const placedAtPoints = this._placeAtOthers(otherBeams, at, this._flags?.autoLength ?? true); 
            const relation = (this._getBeamRelationBaseLocation(at) === 'along') ? 'between' : 'on'
            this._addRelation(otherBeams[0], placedAtPoints[0], relation);
            this._addRelation(otherBeams[1], placedAtPoints[1], relation);
        }

        return this;
    }

    /** Add Relation from current Beam to others at a given location
     *  Based on the other Beams and location a BeamRelationType is determined (or manually set)
     */
    _addRelation(other:Beam, at:Point, type?:BeamRelationType)
    {
        const REVERSED_RELATIONS = {
            on: 'support',
        }
        this._relations.push( new BeamRelation(this, other, type, at)); 
        other._relations.push( new BeamRelation(other, this, REVERSED_RELATIONS[type] ?? type, at )); // on both Beams 
    }

    /** Relations can be either along a Beam (including start) or at the end ('on') 
     *  which defines together with number of Beams the exact Relation type
    */
    _getBeamRelationBaseLocation(location:BeamBaseLineAlignment):'along'|'on'
    {
        if((typeof location === 'string') ? 
                            ['start','center','middle'].includes(location) 
                            : (location >= 0 && location < 1.0))
                {
                    return 'along'; 
                }
                else {
                    return 'on';
                }
    }
    

    /** The point on the base line of other beams to place this beam on 
     *  @return Point where this Beam is placed at
    */
    _placeAt(other:Beam, atOther?:BeamBaseLineAlignment):Point
    {
        const atPoint = other._pointAtBaseLine(atOther);
        this.at(atPoint);
        return this.start();
    }

    /** Place this Beam in relation to two or more others 
     *  @param others the other Beams to place the current at
        @param atOther alignment where to place. Use 1 if same (like with posts) or multiple to define for all other Beams
    */  
    _placeAtOthers(others:Array<Beam>, atOther?:BeamBaseLineAlignment|Array<BeamBaseLineAlignment>, autoLength:boolean=false):[Point,Point]
    {
        const atOthers = (Array.isArray(atOther)) ? atOther : new Array(others.length).fill(null).map(v => atOther);
        if(others.length === 2)
        {
            const otherStart = others[0]._pointAtBaseLine(atOthers[0]);
            const otherEnd = others[1]._pointAtBaseLine(atOthers[1]);
            this.along(otherStart, otherEnd, autoLength);
        }
        else {
            console.warn(`Beam::_placeAtOthers(): More than two others: Not yet implemented!`)
        }

        return [this.start(),this.end()]
    }

    /** Create Diagonal between current and other beam
     *  @param endBeam 
     */
    @checkInput(['Beam', ['BeamBaseLineAlignment','start']], ['auto', 'auto'])
    diagonal(endBeam:Beam, startAt:BeamBaseLineAlignment='start'):this
    {
        const start = this._pointAtBaseLine(startAt);
        const end = endBeam.end();
        this._parent.new('diagonal').along(start,end,true); 
        this._addRelation(this, start, 'diagonal');
        this._addRelation(endBeam, end, 'diagonal');

        return this;
    }

    // TODO: Brace between current Beam and other

    /** point along base line of Beam
     *  @param at start,end, middle/center or [0-1] or distance from start in model units (like mm)
     */
    _pointAtBaseLine(at?:BeamBaseLineAlignment):Point
    {   
        at = at ?? this._flags?.placeOtherAt ?? BEAM_PLACE_DEFAULT_ALIGNMENT; 
        const baseLine = this._setBaseLine(false);
        return ((typeof at === 'string') ? 
                baseLine[at]() :  // NOTE: center/middle,start and end are methods of Edge
                (at < 1.0) ? 
                    baseLine.pointAt(at) : 
                    baseLine.pointAtParam(at) // NOTE: for Line Edges U param is length from start
                ) as Point 
    }

    //// JOINTS ////

    /** Resolve (unresolved) relations to joints */
    join(type:BeamJointType='butt')
    {
        const relationsByPoint = this._relations.reduce((acc,cv) => {
            const rel = cv as BeamRelation
            const relId = `[${rel.at.x},${rel.at.y},${rel.at.z}]`;
            if(!acc[relId]){ acc[relId] = [] };
            acc[relId].push(rel)
            return acc
        }, {})

        Object.keys(relationsByPoint).forEach(pnt => 
        {
            const rels = relationsByPoint[pnt]
            rels.forEach(r => 
            {
                this._resolveRelationToJoint(r, type)
            })
        })
    }

    _resolveRelationToJoint(r:BeamRelation, type:BeamJointType): any
    {
        const EXTEND_BEAM_AMOUNT = 500; // TODO: how much?
        const [ curExt, curExtDir ] = r.from._getExtendedShape(EXTEND_BEAM_AMOUNT, r.at);
        const [ otherExt, otherExtDir ] = r.to._getExtendedShape(EXTEND_BEAM_AMOUNT, r.at);

        // gather data around relation
        const jointInp = {
            relation: r,
            intersection: r.from._getExtendedIntersection(curExt, otherExt),
            extended1: curExt,
            extended2: otherExt,
            projSections1: r.from._getProjectedSections(otherExt, curExtDir),
            projSections2: r.to._getProjectedSections(curExt, otherExtDir),
        } as BeamJointResolveInput

        // call specific function
        const BEAM_JOINT_TYPE_TO_FUNC = {
            'butt' : this._resolveJointButt,
        } as Record<BeamJointType, (i:BeamJointResolveInput) => any> 

        const fn = BEAM_JOINT_TYPE_TO_FUNC[type];

        if(!fn){ throw new Error(`Beam._resolveRelationToJoin(): Unknown joint type: "${type}. Please use any of these ${Object.keys(BEAM_JOINT_TYPE_TO_FUNC).join(',')}`)}
        return fn(jointInp)
    }

    /** Get the intersection Shape of  (extended) current and other beams 
     * 
    */
    _getExtendedIntersection(curExt:AnyShape, otherExt:AnyShape):AnyShape
    {
        const intersection = curExt._intersections(otherExt)?.first();
        // TODO: check
        return intersection;
    }

    /**
     * 
     * @returns Resulting Solid and normalized extend direction
     */
    _getExtendedShape(amount:number, at:Point|BeamBaseLineAlignment):[Solid,Vector]
    {
        const dirPoint = (isBeamBaseLineAlignment(at)) ? this._pointAtBaseLine(at) : isPointLike(at) ? new Point(at) : this.end();
        const extDir = dirPoint.toVector().subtracted(this.center().toVector()).normalize();

        const sectionFace =  this._getOrientatedSectionFace();
        if(!this.direction().equals(extDir)) // extend not from end => start
        { 
            sectionFace.move(this.direction().scaled(this._length)); // place Face at start/end that remains same 
        };

        return [
            sectionFace._extruded(this._length + amount, extDir),
            extDir,
        ]

    }

    _getProjectedSections(other:Solid, dir:Vector):ShapeCollection
    {
        const moveToCenter = this.center().toVector().subtract(this.start());
        return this._getOrientatedSectionFace()
                    .move(moveToCenter)
                    ._toWire()
                    ._projectTo(other, dir); // TODO: Face._projectTo is not there yet!
    }

    //// JOINT RESOLVE ////

    _resolveJointButt(inp:BeamJointResolveInput)
    {
        console.log('====_resolveJointButt');
        console.log(inp)

        const primaryBeam = inp.relation.from;
        const secondaryBeam = inp.relation.to; 
        
        
        primaryBeam
            ._subtract(inp.intersection) // first clean
            ._union(inp.intersection) // than simply add
        
        // first extend, then cut off secondary
        const extLength = inp.relation.at._toVertex().distance(inp.intersection.center()); // TODO
        const [extendedShape] = inp.relation.to._getExtendedShape(extLength, inp.relation.at);
        secondaryBeam
            ._union(extendedShape)
            ._subtract(inp.intersection);
        
    }
    
}


//// TYPES, INTERFACES, TYPEGUARDS AND HELPER CLASSES ////

export type BeamType = 'beam'|'post'|'stud'|'rafter'|'diagonal'|'brace'|'nogging'|'girt'
export type BeamSectionOrientation = 'flat'|'up'|'rect'
export type BeamOrBeamSequence = Array<Beam>|Beam
export type BeamBaseLineAlignment = 'start'|'end'|'center'|'middle'|number // alignment along base line of Beam
export type BeamRelationType = 'support'|'on'|'along'|'between'|'brace'|'diagonal'; // Main relations between Beams
export type BeamJointType = 'butt'|'miter'|'lap'

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

/** Describes a relation between two Beams at one Location 
 *  Most relations already make the number of Beams implicit
 *  Like: 
 *      - on: 1 other Beam
 *      - between: 2 other Beams
 * 
 *  Different Relations can be combined by location into Joints and resolved into fitting Shapes
*/
class BeamRelation
{
    from:Beam
    to:Beam;
    at: Point;
    type:BeamRelationType
    resolved:boolean
    // TODO: order?

    constructor(from:Beam,to:Beam,type?:BeamRelationType, at:Point)
    {
        this.from = from;
        this.to = to;
        this.type = type ?? 'on';
        this.at = at;
        this.resolved = false;
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
    ortho?:boolean // TODO
    // TODO: joint types
}

interface BeamJointResolveInput
{
    relation:BeamRelation
    extended1:AnyShape
    extended2:AnyShape
    projSections1?:ShapeCollection // TODO
    projSections2?:ShapeCollection // TODO
    intersection:AnyShape
}



