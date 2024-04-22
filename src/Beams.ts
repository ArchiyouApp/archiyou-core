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
import { ArchiyouApp, Point, Vector, Shape, AnyShape, Vertex, Edge, Wire, Face, Shell, Solid, ShapeCollection, AnyShapeCollection, isBeamBaseLineAlignment } from './internal'
import { Alignment, PointLike, isPointLike } from './internal'
import { isNumeric, toRad }  from './internal'
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
    _operations:Array<BeamOperation> = []; // operations on original shape of a Beam

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

    /** Set length from internal Beam Shape
     *  If cut at an angle we take the largest length 
     */
    _setLengthFromShape():this
    {
        // Because a Beam is box-like we can simply use a orientated bounding box
        const {width, depth, height} = this._shape._getOBbox();
        const l = [width,depth,height].sort((a,b) => b - a)[0];
        this._length = l;
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

    /** Get Section face align to center of Beam */
    _getOrientatedSectionFaceCentered():Face
    {
        const mv = this.center().toVector().subtract(this.start())
        return this._getOrientatedSectionFace().move(mv)
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

    /** Get center line of Beam */
    _getSectionCenterToPivot():Vector
    {
        return this.start().toVector().subtracted(this._getOrientatedSectionFace().center());
    }

    _getCenterLine():Edge
    {
        const ov = this._getSectionCenterToPivot().reverse();
        return new Edge().makeLine(this.start().add(ov), this.end().add(ov));
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


    //// OPERATIONS ////

    /** Apply an operation to this Beam */
    apply(op:BeamOperation)
    {
        this.checkDuplicateOperation(op);
        this._operations.push(op);
        op.apply(this);
    }

    checkDuplicateOperation(op:BeamOperation):this
    {
        if(this._operations.find(o => o.id === op.id))
        {
            throw new Error(`Beam.apply(): Duplicate operation: ${op} on this Beam!`);
        }
        return this;
    }

    /** Add parametric Cut operation to Beam and update its Shape */
    cut(start:number, angle:number=90, inclination:number=0)
    {
        const sawOp = new BeamSawCut(start, angle, inclination);
        this.apply(sawOp);
    }

    /** cut Shape of Beam at given Face */
    _cutShape(at:Face):this
    {
        const r = this._shape._splitted(at._scaled(10))
        if(Shape.isShape(r))
        { 
            return this; // nothing cut
        }
        else {
            const cuttedBeamShape = (r as ShapeCollection).sort((a,b) => a.distance(this.center()) - b.distance(this.center())).first();
            this._shape.replaceShape(cuttedBeamShape);
            this._shape = cuttedBeamShape; 
        }
        return this;
    }

    extend(to:number|PointLike|Wire|Face, at?:Point|BeamBaseLineAlignment):this
    {
        const [extendedShape] = this._getExtendedShapeAndDir(to, at)
        this.setShape(extendedShape);
        this._setLengthFromShape();
        return this
    }

    

    setShape(s:AnyShape):this
    {
        this._shape.replaceShape(s);
        this._shape = s;

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
    join(type:BeamJointType='butt', options:BeamJointOptions)
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
                this._resolveRelationToJoint(r, type, options)
            })
        })
    }

    _resolveRelationToJoint(r:BeamRelation, type:BeamJointType, options:BeamJointOptions): any
    {
        const EXTEND_BEAM_AMOUNT = 2000; // TODO: how much?
        const [ curExt, curExtDir ] = r.from._getExtendedShapeAndDir(EXTEND_BEAM_AMOUNT, r.at);
        const [ otherExt, otherExtDir ] = r.to._getExtendedShapeAndDir(EXTEND_BEAM_AMOUNT, r.at);
        
        /*
        const fromProjections = r.from._getProjectedSections(otherExt, curExtDir);
        const toProjections = r.to._getProjectedSections(curExt, otherExtDir);

        // Make shell from projections
        const fromProjShells = this._makeShellsFromProjections(fromProjections, otherExt);
        const toProjShells = this._makeShellsFromProjections(toProjections, curExt);
        */

        //// DEBUG
        //fromProjShells.addToScene().color('red').moveZ(100);
        //fromProjections.addToScene().color('blue').moveZ(200);
        //toProjections.addToScene().color('red').moveZ(100);
        //toProjShells.addToScene().color('red').moveZ(100);

        // gather data around relation
        const jointInp = {
            relation: r,
            fromExtended: curExt,
            toExtended: otherExt,
            intersection: r.from._getExtendedIntersection(curExt, otherExt),
            //fromProjIn: fromProjections.group('front').first(),
            //fromProjOut: fromProjections.group('back').first(),
            //fromProjInShell: fromProjShells.group('front').first(),
            //fromProjOutShell: fromProjShells.group('back').first(),
            //toProjIn: toProjections.group('front').first(),
            //toProjOut: toProjections.group('back').first(),
            //toProjInShell: toProjShells.group('front').first(),
            //toProjOutShell: toProjShells.group('back').first(),
        } as BeamJointResolveInput

                
  
        // call specific function
        const BEAM_JOINT_TYPE_TO_FUNC = {
            'butt' : this._resolveJointButt,
            'miter' : this._resolveJointMiter,
        } as Record<BeamJointType, (i:BeamJointResolveInput, o:BeamJointOptions) => BeamJointResult> 

        const fn = BEAM_JOINT_TYPE_TO_FUNC[type];

        if(!fn){ throw new Error(`Beam._resolveRelationToJoin(): Unknown joint type: "${type}. Please use any of these ${Object.keys(BEAM_JOINT_TYPE_TO_FUNC).join(',')}`)}
        return fn(jointInp, options)
          
    }


    /** Make Shells from Wire projections
     *  Uses the powerful Shell.fromWireframe algorithm
     */
    _makeShellsFromProjections(projections:ShapeCollection, on:AnyShape):ShapeCollection
    {
        const inProjWire = projections.group('front').first() as Wire;
        const outProjWire = projections.group('back').first() as Wire;

        const shells = new ShapeCollection();
        shells.addGroup('front', this._makeShellFromProjection(inProjWire, on))
        shells.addGroup('back', this._makeShellFromProjection(outProjWire, on))

        return shells;
    }

    _makeShellFromProjection(proj:Wire, on:AnyShape):Shell
    {
        // planar projection: skip wireframe algorithm
        if(proj.planar())
        {
            proj.toFace().toShell();   
        }
        
        const wireframeEdges = new ShapeCollection(proj.edges())
            
        on.edges().forEach(e => {
            const intVerts = e.intersections(proj)
            if(intVerts && intVerts.length >= 2)
            {
                wireframeEdges.add(new Edge().makeLine(intVerts[0],intVerts[1]))
            }
        })

        return new Shell().fromWireFrame(wireframeEdges)
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
     * Extend current Beam a given amount or to a given Point, Wire or Face and return Shape
     *  NOTE: The direction of the Beam stays the same
     *  NOTE: Depending on the to input this returns a butt or cutted Beam - TODO: Make this more transparent
     */
    _getExtendedShapeAndDir(to:number|PointLike|Wire|Face, at?:Point|BeamBaseLineAlignment):[Solid,Vector]
    {
        const TEST_EXT_SHAPE = 2000; // TODO: Make more robust?
        const TO_FACE_SCALE = 1000; // TODO: Make more robust?

        at = at || 
                    ((Shape.isShape(to)) ? (to as Shape).center() 
                        : (isPointLike(to)) ? new Point(to) : null); // if given a Shape as extend target, use its center as target if not set

        const dirPoint = (isBeamBaseLineAlignment(at)) 
                            ? this._pointAtBaseLine(at) :  
                            ( new Vertex(at as PointLike).distance(this.start()._toVertex()) < new Vertex(at as PointLike).distance(this.end()._toVertex())) 
                            ? this.start() : this.end();
        
        const extDir = dirPoint.toVector().subtracted(this.center().toVector()).normalize();

        const sectionFace =  this._getOrientatedSectionFace();
        if(!this.direction().equals(extDir)) // extend not from end => start
        { 
            sectionFace.move(this.direction().scaled(this._length)); // place Face at start/end that remains same 
        };

        if(isNumeric(to))
        {
            const extShape = sectionFace._extruded(this._length + (to as number), extDir)
            return [extShape, extDir]
        }
        else {
            // given to is a PointLike or Shape that we use as boundary
            const extTestShape = sectionFace._extruded(this._length + TEST_EXT_SHAPE, extDir)
            let toFace:Face;

            if (isPointLike(to))
            {
                toFace = sectionFace._copy().moveTo(new Point(to))
            }
            else {
                toFace = ((to as AnyShape).type() === 'Face') ? to as Face : (to as Wire)._toFace();
            }

            const intersection = extTestShape.intersection(toFace._scaled(TO_FACE_SCALE)); // Make toFace very big, so we can get the intersection with extended Beam

            if(!intersection)
            {
                throw new Error(`Beam::_getExtendedShapeAndDir: Can not extend Beam Shape to given Shape`);
            }
            else {
                const extShape = sectionFace._lofted(intersection, true) as Solid
                return [
                    extShape,
                    extDir,
                ]
            }            
        }

    }

    /** Get the project Section of this Beam onto another Solid 
     *  IMPORTANT: Results might be inaccurate when difference between projections are minor!
    */
    _getProjectedSections(other:Solid, dir:Vector):ShapeCollection
    {
        // !!!! IMPORTANT: Projection might not always fit the other
        // What is a robust calculation and use of projections?
        return this._getOrientatedSectionFaceCentered()
                    ._toWire() // TODO: Face._projectTo is not there yet!
                    ._scaled(0.99) // Make slightly smaller to avoid edge-cases
                    ._projectTo(other, dir); 
                    
    }

    /** Get a extended Line Edge in direction of Beam along baseline */
    _getTestBaseLine():Edge
    {
        const EXTEND = 2000; // on both sides
        return new Edge().makeLine(this.start().toVector().subtracted(this.direction().scaled(EXTEND)), this.end().added(this.direction().scaled(EXTEND)) )
    }

    //// JOINT RESOLVE ////

    
    /** A butt joint is the most simple joint with one mutual touching line or face
     *  either by combining two orthogonal Beams without any angled cuts, one beam has priority over the other
     *  Or cutting one Beam at an angle to place at the other
     *  
     *  Options (TODO):
     *      strategy: butt-only, cutone
     *      auto priority: top, horizontal
     *      location: outside, baseline    
     */
    _resolveJointButt(inp:BeamJointResolveInput, options?:BeamJointOptions): BeamJointResult
    {
        const DEFAULT_OPTIONS = {
            strategy: 'butt-only',
            at: 'outside'
         } as BeamJointOptions

        options = { ...DEFAULT_OPTIONS, ...(options || {}) } as BeamJointOptions

        const primaryBeam = inp.relation.from; // TODO: auto priority
        const secondaryBeam = inp.relation.to; 

        const intersection = inp.intersection; // for convenience
        const numIntFaces = intersection.faces().length;
        const primaryOuterFace = intersection.faces().sort((a,b) => b.distance(primaryBeam.center()) - a.distance(primaryBeam.center())).first() as Face;

        // simple orthogonal intersection
        if (numIntFaces === 6)
        {
            // Primary Beam
            const intFaceBaseline = primaryOuterFace._scaled(10).intersection(primaryBeam._getTestBaseLine())
            if (!intFaceBaseline){ throw new Error(`Beam::_resolveJointButt: Error finding a intersection between primary outher Face and baseline.`) }
            primaryBeam.extend(intFaceBaseline as Vertex); 
            // Secondary
            const secondaryInnerFace = inp.intersection.faces().sort((a,b) => a.distance(secondaryBeam.center()) - b.distance(secondaryBeam.center())).first() as Face;
            
            console.log('==== HIERO ====');
            secondaryInnerFace.addToScene().color('red');

            if(options.strategy === 'butt-only')
            {
                const mostInnerVert = secondaryInnerFace.vertices().sort((v1,v2) => v1.distance(secondaryBeam.center()) - v2.distance(secondaryBeam.center())).first();
                secondaryBeam.extend(mostInnerVert as Vertex);
            }
            else
            {
                // cutone
                secondaryBeam.extend(secondaryInnerFace);
            }

            return {
                input: inp,
                output: null, // TODO
            } 
        }


    }

    /** A miter joint is characterized by clean outside angles (see for example too SVG stroke style)
     *  that can be achieved by either a symmetrical cut on both Beams
     *  or assymmetrically extending and cutting with one Beam that has priority
     *  For pitch=0 an assymmetrical Miter joint is the same as a butt joint
    */
    _resolveJointMiter(inp:BeamJointResolveInput, options?:BeamJointOptions): BeamJointResult
    {
        const primaryBeam = inp.relation.from;
        const secondaryBeam = inp.relation.to; 

        const primaryOuterFace = inp.intersection.faces().sort((a,b) => b.distance(primaryBeam.center()) - a.distance(primaryBeam.center())).first() as Face;
        const primaryInnerFace = inp.intersection.faces().sort((a,b) => a.distance(primaryBeam.center()) - b.distance(primaryBeam.center())).first() as Face;
        primaryBeam
            .setShape(primaryBeam._getExtendedShapeAndDir(primaryOuterFace as Face, inp.relation.at)[0]);

        const secondaryInnerFace = inp.intersection.faces().sort((a,b) => a.distance(secondaryBeam.center()) - b.distance(secondaryBeam.center())).first() as Face;
        const extSecondaryBeam = secondaryBeam._getExtendedShapeAndDir(secondaryInnerFace as Face, inp.relation.at)[0];
        secondaryBeam
            .setShape(extSecondaryBeam);

        return {
            input: inp,
            output: null, // TODO
        } 

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

    constructor(width:number=BEAM_SECTION_WIDTH_DEFAULT, height:number=BEAM_SECTION_HEIGHT_DEFAULT)
    {
        this._width = width;
        this._height = height;
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
        return new BeamSection(this._width, this._height)
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

    constructor(from:Beam,to:Beam,type?:BeamRelationType, at?:Point)
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
    relation:BeamRelation // { from:Beam, to:Beam, at:Point etc }
    fromExtended:AnyShape // Extended Beam Shape
    toExtended:AnyShape
    intersection:AnyShape // full (mostly) Solid intersection
    fromProjIn?:Wire
    fromProjOut:Wire
    fromProjInShell?:Shell // with one or more faces
    fromProjOutShell?:Shell // with one or more faces
    toProjIn?:Wire
    toProjOut:Wire
    toProjInShell?:Shell
    toProjOutShell?:Shell
    flags?:BeamJointResolveFlags
}

interface BeamJointResolveFlags 
{
    fullIntersection:boolean // if (extended) Beams intersect each other fully
    largestBeamIntersection:Beam // What beam has the largest section
    orthogonal:boolean // TODO
}

/** Specific options to solve a joint */

type BeamJointOptionsButt = 'butt-only'|'cutone'

interface BeamJointOptions
{
    strategy?: BeamJointOptionsButt
    at?: 'outside'|'baseline'
}

interface BeamJointResult 
{
    input: BeamJointResolveInput
    output: any // TODO
}


//// OPERATIONS ////

class BeamOperation
{
    id:string // automatic hash to identify duplicates
    type:string

    constructor(type)
    {
        this.type = type;
    }

    hash():string
    {
        return this.type;
    }

    apply(to:Beam):this
    {
        // Implemented by subclasses
        return this;
    }
}

/** Parametric representation of a SawCut
 *  
 *  TODO: Protect agains very unpractical Sharp cut angles
 *  
 *  NOTE: somewhat inspired by simplified BTLX. See: https://design2machine.com/btlx/BTLx_2_2_0.pdf
 */
class BeamSawCut extends BeamOperation
{
    start: number // start of cut along Beam from start
    angle: number // angle of cut in degrees relative to Beam axis on width Face, straight cut is 90 degrees
    inclination: number // angle of cut at side Face, relative to top Face on inside of Beam (0 is along Face and does nothing, 90 is straight cut)
    depth?: number // depth of cut, null for full width of Beam
    length?: number // length of cut from start. null for full height of Beam 
    offsetX?: number // not used yet
    offsetY?: number // not used yet
    toolPosition?:'left'|'right'|'center' // left=inner, right=outer

    constructor(start:number, angle:number=90, inclination:number=90)
    {
        super('SawCut');
        this.start = start;
        this.angle = angle;
        this.inclination = inclination;
        this.id = this.hash();
    }

    hash():string
    {
        return `${this.type}${this.start}${this.angle}${this.inclination}`; // WIP
    }
    
    /** Apply SawCut operation to a Beam */
    apply(to:Beam):this
    {
        if(this.start < 0 || this.start > to._length){ throw new Error(`BeamSawCut::apply(): Can't apply Saw Cut because start is not along Beam! start > 0 && start < beam length`)}
        if(this.angle === 0){ throw new Error(`BeamSawCyt::apply(). Cutting at zero angle (parallel to direction of Beam) does not make sense. Straight cut is 90 degrees!`); }
        if(this.inclination === 0){ throw new Error(`BeamSawCyt::apply(). Cutting at zero inclination (parallel to top face of Beam) does not make sense. Straight cut is 90 degrees!`); }

        let startLengthOffset = (this.angle !== 90) ? to._section.width/Math.tan(toRad(this.angle))*0.5 : 0;
        if(this.angle < 90){ startLengthOffset *= -1 }

        // DEBUG START
        new Edge().makeLine([this.start,0,0], [this.start, -100,0]).addToScene().color('red');

        const cutFace = to._getOrientatedSectionFace()
                            .move(to.direction().scaled(this.start+startLengthOffset))
        const cutFaceAxis = new Vector(0,-1,0).crossed(cutFace.normal())

        cutFace.rotateAround(this.angle-90, cutFaceAxis) // pivot = center
        
        

        const cutEdge = cutFace.edges().sort((a,b) => b.center().z - a.center().z)[0] as Edge; // NOTE: .select('E||top') not robust! TODO
        const inclinationAxis = cutEdge.direction();
        // We want incline towards start of Beam when incl < 90
        const testInclFace = cutFace._copy();
        const distanceBeforeIncl = to.start().toVertex().distance(testInclFace);
        testInclFace.rotateAround(45-90, inclinationAxis, cutEdge.center() );  // Use 45 as test which is always inside
        if( distanceBeforeIncl < to.start().toVertex().distance(testInclFace))
        {
            inclinationAxis.reverse(); // simply reverse the inclination axis to rotate the other way
        }
        cutFace.rotateAround(this.inclination-90, inclinationAxis, cutEdge.center())
        // Need to offset inside above 90 degrees to keep length the same
        if(this.inclination > 90)
        {
            const inclOffset = Math.tan(toRad(this.inclination-90)) * to._section.height;
            cutFace.move(to.direction().reversed().scale(inclOffset))
        }

        cutFace.addToScene().color('red');

        to._cutShape(cutFace)
        return this;
    }

    toString():string
    {
        return `<BeamSawCut start="${this.start}" angle="${this.angle}" inclination="${this.inclination}"`;
    }

}



