/**
 * 
 *  Make.ts
 *     Module that contains functionality to simplify making (CAM)
 * 
 */

import { ConsoleMessage, ArchiyouApp, Point, Vector, Vertex, Edge, Face, Solid, ShapeCollection, LayoutOptions } from './internal' // classes
import { Table } from './internal'; 
import { PointLike } from './internal' // types

//// TYPES, TYPEGUARDS AND INTERFACES ////

export type Alignment2D = 'topleft'|'topright'|'bottomleft'|'bottomright'


/** Statistics on last make operation, including error messages and important metrics
 *  stats can be accessed after the operation at make.stats
 *  this mechanism avoids any complex return values
*/
export interface MakeStats 
{
    messages:Array<ConsoleMessage> // TODO: not yet implemented really
    efficiency:number // [0-100]
    wastedArea:number
    wastedVolume:number
    numStock:number // total number of stock used
    full?:ShapeCollection // full stock Shapes used
    cut?:ShapeCollection // operations must to order them
    fitted?:ShapeCollection // fitted cut Shapes inside stock
    extra?:ShapeCollection // extra stock for fitted
    waste?:ShapeCollection // Shapes that are not used but are left over
}

export interface Layout2DOptions
{
    start:Alignment2D
    direction:'horizontal'|'vertical' // direction of sequential elements (stacking direction)
    width:number, // total width of layout in model units
    height:number, // total height of layout in model units
    stockWidth?:number // the boxes that need to fit
    stockHeight?:number
    seams?:number // make sure the boxes are the right size to have their seams on given grid lines
    // !!!! TODO: seamsDirection - NOW only vertical
    seamsStartOffset?: number // let seams start later then start of layout
    leftover?:boolean
    cutMargin?:number
}

export function Layout2DOptions(o:any): o is Layout2DOptions
{
    return typeof(o) === 'object' && o?.start && o?.direction && o?.width && o?.height && o?.stockWidth && o?.stockHeight
}

export interface PartListOptions
{
    sortBy: 'part'|'section'|'length'|'quantity' // TODO
}

export interface WallOpening
{
    left: number
    sill: number
    width: number
    height: number
}


//// MAIN MODULE ////

export class Make
{
    //// SETTINGS ////
    LAYOUT2D_BOX_DEFAULT_FITTING_MARGIN_SIZE = 5

    _ay:ArchiyouApp; // contains all modules
    stats:MakeStats; // stats on last operation

    constructor(ay?:ArchiyouApp)
    {
        this.setArchiyou(ay)
    }

    //// MAIN FUNCTIONS ////

    setArchiyou(ay:ArchiyouApp)
    {
        if(ay)
        {
            this._ay = ay;
        }
    }

    //// STATS HANDLING ////

    resetStats():MakeStats
    {
        this.stats = {
            messages: [],
            efficiency : null,
            wastedArea: null,
            wastedVolume: null,
            full: new ShapeCollection(),
            cut: new ShapeCollection(),
            fitted: new ShapeCollection(),
            waste: new ShapeCollection(),   
            numStock: 0,         
        }

        return this.stats;
    }

    //// 2D LAYOUTS ////

    _alignment2DToPoint(a:Alignment2D, width:number, height:number):Point
    {
        const p = new Point(0,0);
        p.x = (a.includes('right')) ? width : 0;
        p.y = (a.includes('top')) ? height : 0;
        return p;
    }

    _checkLayoutOptions(o:Layout2DOptions):Layout2DOptions
    {
        return {
            width: o?.width || 500,
            height: o?.height || 200,
            stockWidth: o?.stockWidth || 20,
            stockHeight: o?.stockHeight || 20,
            start: o?.start || 'bottomleft',
            direction: o?.direction || 'horizontal',
            seams: o?.seams,
            leftover: o?.leftover || false,
            cutMargin: o?.cutMargin || this.LAYOUT2D_BOX_DEFAULT_FITTING_MARGIN_SIZE,
        }
    }

    _layout2DBoxesNewBox(cursor:Point, o:Layout2DOptions, leftOverSize?:number):Face
    {   
        const direction = (o.direction === 'horizontal') ? new Vector(1,0) : new Vector(0,1); // TODO: from right to left
        
        const mainAxis =  (o.direction === 'horizontal') ? 'x' : 'y'; // axis of direction
        const secAxis =  (o.direction === 'horizontal') ? 'y' : 'x'; // axis of secondary direction

        const secDirection = direction.swappedXY();
        const layoutVec = new Vector(o.width, o.height);
        const mainLimit = layoutVec.scaled(direction).length(); // limit of layout in primary direction
        const secLimit = layoutVec.scaled(secDirection).length();

        const origBoxVec = new Vector(o.stockWidth, o.stockHeight);
        let boxVec = origBoxVec.copy();

        if (leftOverSize) // left over from previous box 
        {
            boxVec[mainAxis] = leftOverSize; 
        }

        // check along secondary axis for limit
        if(cursor.moved(boxVec)[secAxis] > secLimit)
        {
            boxVec[secAxis] = secLimit - cursor[secAxis];
        }
        // check along primary axis if out of limit 
        if(cursor.moved(boxVec)[mainAxis] > mainLimit)
        {
            boxVec[mainAxis] = mainLimit - cursor[mainAxis];
        } 
        else if(o.seams) // check if box arrives in primary direction at seams as defined in o.seams
        { 
            let sizeWithSeams = Math.floor(boxVec[mainAxis]/o.seams)*o.seams;
            // can't fit box to seams (not enought size in primary axis available): register wasted Shape
            this.stats.waste.addAligned(new Face().makeRectBetween(cursor, cursor.moved(boxVec)))
            boxVec[mainAxis] = (sizeWithSeams !== 0) ? sizeWithSeams : origBoxVec[mainAxis];
        }
        // now make box
        const boxTo = cursor.moved(boxVec);
        const newBox = new Face().makeRectBetween(cursor, boxTo);

        return newBox;
    }

    _layout2DBoxes(o?:Layout2DOptions):ShapeCollection
    {
        this.resetStats();
        o = this._checkLayoutOptions(o);


        let createdElems = new ShapeCollection().setName('boards'); 
        let cursor = this._alignment2DToPoint(o.start, o.width, o.height);
        
        const mainDirectionVec = (o.direction === 'horizontal') ? new Vector(1,0) : new Vector(0,1);
        const mainDirectionSide = (o.direction === 'horizontal') ? 'width' : 'height';
        const mainDirectionBboxSide = (o.direction === 'horizontal') ? 'width' : 'depth';
        const mainDirectionAxis = (o.direction === 'horizontal') ? 'x' : 'y';

        let leftOverBoxSize; // in main direction
        
        while(true)
        {
            // find next box
            const newBox = this._layout2DBoxesNewBox(cursor, o, leftOverBoxSize); // this method find a next box (where needed cut to seams or end of layout)
            leftOverBoxSize = null; // reset left over
            createdElems.add(newBox);
            
            // keep track of stats
            if (Math.round(newBox.bbox().width()) !== o.stockWidth || Math.round(newBox.bbox().depth()) !== o.stockHeight )
            {
                this.stats.cut.add(newBox); // register cut shapes, keep position
            }
            else {
                this.stats.full.add(newBox); // register full shapes, keep position
            }

            
            // move cursor
            cursor = cursor.moved(new Vector(newBox.bbox().width(),newBox.bbox().depth()).scaled(mainDirectionVec))

            // check if cursor in main direction filled up and return to next row of boxes in main direction
            if( (cursor[mainDirectionAxis] >= o[mainDirectionSide]))
            {
                cursor = new Vector(cursor.x + newBox.bbox().width(), cursor.y + newBox.bbox().depth()).scaled(mainDirectionVec.swappedXY()).toPoint();
                leftOverBoxSize = (o.leftover) ? new Vector(o.stockWidth, o.stockHeight).scaled(mainDirectionVec).length() - newBox.bbox()[mainDirectionBboxSide]() : null;
            }
          
            // check cursor in secondary direction - and break
            if( (o.direction === 'horizontal' && cursor.y >= o.height) || (o.direction === 'vertical' && cursor.x >= o.width))
            {
                break
            }
        }
        
        this._layout2DBoxesStats(o);

        return createdElems.length ? createdElems : null; 
    }

    /** Calculate stats of layout2DBoxes operation */
    _layout2DBoxesStats(o?:Layout2DOptions):MakeStats
    {
        // find number of stock to make cut shapes
        this.stats.numStock = this.stats.full.length;
        this.stats.efficiency = 100;

        if (this.stats.cut.length > 0)
        {
            this.stats.fitted = this.stats.cut.pack({ stockWidth: o.stockWidth, stockHeight: o.stockHeight, margin: o.cutMargin }, true)
            this.stats.fitted?.removeFromScene(); // don't add automatically to Scene
            this.stats.numStock += this.stats.fitted.getGroup('bins').length;
            const stockUsedArea = this.stats.numStock * o.stockWidth * o.stockHeight;
            const cutPartsArea = this.stats.fitted.getGroup('cut').reduce( (sum,shape) => sum + shape.area(), 0)
            const fullPartsArea = this.stats.full.length * (this.stats.full?.first()?.area() || 0)
            this.stats.efficiency = Math.round((fullPartsArea + cutPartsArea) / stockUsedArea * 100);
        }
        
        return this.stats;
    }

    /** Public method to generate rectangular boarding on rectangle plane on XY plane */
    boarding(o?:Layout2DOptions):ShapeCollection
    {
        return this._layout2DBoxes(o);
    }

    //// SPECIALS WITH STRUTS AND FRAMEWORKS ////
    // work in progress

    /** Find a 2D strut length and angle that exactly fits diagonally in given space 
     *   NOTE: It's easy to see how it works if you consider the special circumstances 
     *   of width=spaceWidth, width=spaceHeight and angle(spaceWidth,spaceHeight) = 45 deg
    */
    fitRectStrut(width:number, space:Array<number|number>, withSpace:boolean=false):Face|ShapeCollection
    {
        const spaceAngle = Math.atan((space[1]-width)/(space[0]-width));
        const diagAlignHeight = Math.cos(spaceAngle) * width;
        const diagAlignWidth = Math.sin(spaceAngle) * width;
        
        const strut = new Edge().makeLine([diagAlignWidth,0], [space[0], space[1]-diagAlignHeight]).extrude(width) as Face;
        
        return (!withSpace) ? 
                    strut : 
                    new ShapeCollection(strut, new Face().makeRectBetween([0,0],space).toWire().addToScene().color('blue'));
    }

    /** Make simple rectangular frame of width, height, depth and thickness at origin position
     *  prio sets what members have priority (default: horizontal)
     *  Frame is parallel to the front side
    */   
    rectFrame(width:number,height:number,depth:number,thickness:number,prio:'horizontal'|'vertical'='horizontal'):ShapeCollection
    {
        // very basic input tests
        if(isNaN(width) || isNaN(height) || isNaN(depth) || isNaN(thickness))
        {
            throw new Error(`Make.rectFrame(w,h,d,t,p): Please supply numbers for width, height, depth and thickness!`)
        }
        if(typeof prio !== 'string'){ prio = 'horizontal' }

        const horMemOffset = (prio === 'horizontal') ? [[0,0,0],[0,0,0]] : [[thickness,0,0],[-thickness,0,0]]; // [start,end], [start,end]
        const vertMemOffset = (prio === 'horizontal') ? [[0,0,thickness],[0,0,-thickness]] : [[0,0,0],[0,0,0]]; 

        const bottomMem = new Solid().makeBoxBetween(
                                    new Point(0,0,0).move(horMemOffset[0]), 
                                    new Point(0,0,0).move(width,depth,thickness).move(horMemOffset[1]))
                                    .setName('frameBottom')

        const topMem = bottomMem._copy().move(0,0,height-thickness).setName('frameTop');
        const leftMem = new Solid().makeBoxBetween(
                            new Point(0,0,0).move(vertMemOffset[0]),
                            new Point(0,0,0).move(thickness, depth, height).move(vertMemOffset[1])
                        ).setName('frameLeft')

        const rightMem = leftMem._copy().move(width-thickness,0,0).setName('frameRight');
        
        return new ShapeCollection(bottomMem,topMem,leftMem, rightMem).setName('Frame')
    }

    /** Make an advanced wood frame for a wall 
     *  starting from origin with centerline along x-axis
     *  returns ShapeCollection and puts messages inside console
    */
    wallFrame(width:number, height: number, depth: number, studThickness: number, grid:number, openings: Array<WallOpening> ): ShapeCollection
    {
        const DEFAULT_GRID_DISTANCE = 610;
        const DEFAULT_STUD_THICKNESS = 38;
        const ENDING_STUDS_INSIDE = true;
    
        grid = grid || DEFAULT_GRID_DISTANCE;
        studThickness = studThickness || DEFAULT_STUD_THICKNESS;
        openings = openings || new Array();

        const OPENING_SNAP_POSITION_DISTANCE = studThickness*2;

        const wallDiagram = new Face().makePlaneBetween([0,0,0],[width,0,height]);

        const openingDiagrams = new ShapeCollection();
        
        openings.forEach( o => {
            openingDiagrams.add( new Face().makePlaneBetween(
                                    [o.left, 0, o.sill],
                                    [o.left+o.width, 0, o.sill+o.height]))
        })

        // vertical grid

        const gridLines= new ShapeCollection();
        const numGridLines = Math.round(width/grid);
        new Array(numGridLines).fill(null).
            map( (e,i) => gridLines.add(
                                new Edge().makeLine([0,0,0],[0,0,height]).move(grid*i)
                                ))
        gridLines.add(new Edge().makeLine([width,0,0], [width,0,height]));

        const studHeight = height - studThickness*2;

        // top and bottom-plates
        
        const bottomPlate = new Solid().makeBoxBetween([0,0,0],[width, depth, studThickness])
                                .moveY(-depth/2)
        
        const topPlate = bottomPlate._copy().move(0,0,studHeight+studThickness)
        const plates = new ShapeCollection(bottomPlate, topPlate);

        // primary studs
        const primaryStuds = new ShapeCollection();

        const stud = new Solid().makeBox(studThickness, depth, studHeight );

        gridLines.forEach((l,i,arr) => 
        {    
            const newStud = stud._copy()
                .align(l.start(), 'bottom', 'center')
                .moveZ(studThickness)

            if(ENDING_STUDS_INSIDE)
            {
                if(i === 0){ newStud.move(studThickness/2) }
                if(i === arr.length - 1){ newStud.move(-studThickness/2) }
            }
            primaryStuds.add(newStud)
        })

        // Openings: Validate openings and give feedback for user when needed
        const checkedOpenings = new ShapeCollection();
        const removedStuds = new ShapeCollection(); // primary studs that were removed
        const crippleStuds = new ShapeCollection(); // cut studs
        const openingFrames = new ShapeCollection(); // add resulting frames here
        const openingKingStuds = new ShapeCollection();
        const openingJackStuds = new ShapeCollection();

        openingDiagrams.forEach( (o,i) => 
        {
            
            let checkedOpening = null;
            const openingStart = o.bbox().min()._toVertex();

            if(wallDiagram.contains(o)) // validate opening first
            {
                checkedOpening = o;
            }
            else {
                this._ay.console.user(`Opening #${i} is not within the wall: Skipped!`);
            }

            // continue if opening is valid
            if(checkedOpening)
            {
                // openings need to fit in basic outer frame
                if(checkedOpening.min().z < studThickness)
                { 
                    checkedOpening.subtract(
                            new Solid().makeBox(width*2, width*2, studThickness, 
                                    [width/2, 0, studThickness/2]).hide())
                }

                // snap start position to match with nearest stud
                const nearestStartGridLine = gridLines.nearest(openingStart);
                const d1 =  nearestStartGridLine.distance(openingStart)
                if(d1 < OPENING_SNAP_POSITION_DISTANCE)
                {
                    this._ay.console.user(`Snapped Opening #${i} on a stud at distance ${d1}`);
                    checkedOpening.moveToX(nearestStartGridLine.center().x, 'left')
                        .move(studThickness * 1.5); // margin for opening specific frame
                }
                // Snapping the width of an opening to maintain grid and avoid weird positioning
                // But width of opening can not change from specified by parameters
                const nextGridLine = gridLines.find( s => checkedOpening.max().x < s.center().x)

                if(nextGridLine)
                {
                    // opening is too close to next primary stud to fit in king stud 
                    // (but is not at same position for king stud to overlap primary one)
                    // we enlarge the opening to have king stud at position of primary stud
                    const distanceToNextStud = checkedOpening.distance(nextGridLine) - 0.5 * studThickness
                    if (distanceToNextStud > studThickness && distanceToNextStud < 2*studThickness  )
                    {
                        checkedOpening = new Face().makePlaneBetween(checkedOpening.min(), checkedOpening.max().move(distanceToNextStud-studThickness))
                        this._ay.console.user(`Enlarged opening #${i} by ${distanceToNextStud-studThickness}mm to fit to grid studs!`);
                    }
                    // opening is too close to next primary stud to fit jack and king stud in
                    // enlarge opening so jack studs align to grid line of next primary stud
                    // king stud of opening is then placed off-grid
                    else if (distanceToNextStud > 0 && distanceToNextStud < studThickness  )
                    {
                        checkedOpening = new Face().makePlaneBetween(
                                        checkedOpening.min(), 
                                        checkedOpening.max().move(distanceToNextStud))
                        this._ay.console.user(`Enlarged opening #${i} by ${distanceToNextStud}mm. Now end jack stud aligns to grid`);
                    }
                    else {
                        // when opening is overlapping with primary stud (so no space for jack stud)
                        // enlarge opening so last cripple can be fitted in and aligns with grid
                        const closeGridLine = gridLines.find( l => Math.abs(l.center().x - checkedOpening.max().x) < studThickness*0.5);
                        //closeGridLine.moved(0,0,100).color('red')
                        if(closeGridLine)
                        {
                            const dx = Math.abs((closeGridLine.center().x + studThickness * 0.5) - checkedOpening.max().x);
                            checkedOpening = new Face().makePlaneBetween(checkedOpening.min(), checkedOpening.max().move(dx))
                            this._ay.console.user(`Enlarged opening #${i} by ${dx}mm. Now last cripple aligns with grid`);
                        }
                    }
                }
    
                checkedOpenings.add(checkedOpening); // keep track of final openings

                // make opening surrounding frame
                const openingTestBuffer = checkedOpening
                                            ._offsetted(studThickness-1) // a bit smaller to avoid accuracy problems
                                            ._thickened(depth*2)

                primaryStuds.forEach( (stud,s) => {
                    // evaluate overlapping studs to make cripples top and bottom
                    if(stud.overlapPerc(openingTestBuffer) > 0.02) // use overlapPerc for robustness
                    {
                        const splitStuds = new ShapeCollection(stud._splitted(openingTestBuffer, true)); // force ShapeCollection
                        if (splitStuds.length >= 1)
                        { 
                            crippleStuds.add(splitStuds);
                            removedStuds.add(stud);
                        }
                        else {
                            // remove primary stud that touches (but is not entirely cut to become cripples)
                            removedStuds.add(stud) 
                        }
                    }
                });

                // make frame around opening
                const openingBufferBbox = openingTestBuffer.bbox();
                const openingFrame = this.rectFrame(
                                openingBufferBbox.width(),
                                openingBufferBbox.height(),
                                depth,
                                studThickness,
                                'horizontal'
                            )
                            .moveTo(openingTestBuffer.center())

                openingFrames.add(openingFrame)

                // make king and jack studs for current opening
                const openingFrameBbox = openingFrame.bbox(); // avoid recalculating

                const openingJackLeftBottom = new Solid().makeBoxBetween(
                                            openingFrameBbox.min(), 
                                            [openingFrameBbox.min().x + studThickness,depth/2, studThickness]) 
                const openingJackRightBottom = openingJackLeftBottom._copy().move(
                                            openingBufferBbox.width()-studThickness)
                const openingJackLeftTop = new Solid().makeBoxBetween(openingFrameBbox.min().moveZ(openingFrameBbox.height()), 
                                            [openingFrameBbox.min().x+studThickness,
                                                depth/2, height - studThickness]) 
                const openingJackRightTop = openingJackLeftTop._copy().move(
                                            openingBufferBbox.width()-studThickness)
                const openingKingStudLeft = stud._copy().align(
                                            openingJackLeftTop,
                                            'toprightfront',
                                            'topleftfront'
                                        )
                // remove primary stud that overlaps king stud (when snapping is on this is cleanup automatically)
                const overlappingPrimaryStud = primaryStuds.filter(s => s.overlapPerc(openingKingStudLeft) > 0.02)
                if(overlappingPrimaryStud){ removedStuds.add(overlappingPrimaryStud); }

                const openingKingStudRight = openingKingStudLeft._copy().move(openingBufferBbox.width()+studThickness);
                const overlappingPrimaryStudRight = primaryStuds.filter(s => s.overlapPerc(openingKingStudRight) > 0.02)
                if(overlappingPrimaryStudRight){ removedStuds.add(overlappingPrimaryStudRight); }

                openingKingStuds.add(openingKingStudLeft, openingKingStudRight);
                openingJackStuds.add(openingJackLeftBottom,openingJackRightBottom, openingJackLeftTop, openingJackRightTop );
                    
            }
            
        })

        // organize and output 
        primaryStuds.remove(removedStuds.hide())

        let wall = new ShapeCollection()
                    .setName(this._ay.geom.getNextObjName('Wall'))
        
        // TODO: with addGroup organize scene tree too!
        return wall
                .addGroup('grid', gridLines.color('blue').dashed())
                .addGroup('studs', primaryStuds.color('green'))
                .addGroup('plates', plates.color('green'))
                .addGroup('cripples', crippleStuds.color('green'))
                .addGroup('openingFrames', openingFrames.color('red'))
                .addGroup('openingKingStuds', openingKingStuds.color('brown'))
                .addGroup('openingJackStuds', openingJackStuds.color('brown'))
                .addToScene(); // NOTE: add to scene by default? 
                // Shall we introduce some kind of reasoning here (for example makeFrame is not added)
    }


    //// DATA GATHERING

    /** Generate part list Calc table from ShapeCollection for beam-like shapes 
     *  For optimal information gathering:
     *   - Beam-like shapes only
     *   - group shapes into groups (will be used for part names)
     *   - name individual shapes (will be used as subpart name) 
    */
    partList(shapes:ShapeCollection, name?:string):Table
    {
        const COLUMNS = ['part', 'subpart', 'section', 'length', 'quantity',]; // TODO: label system, materials

        if(!ShapeCollection.isShapeCollection(shapes) || shapes.length === 0)
        {
            throw new Error(`Make::partList: Please supply valid ShapeCollection of beam-like shapes to generate a partlist!`)
        }

        const partRowsAll = [];

        shapes.forEachGroup((groupName,groupedShapes) =>
        {
            groupedShapes.forEach((shape) => 
            {
                if(shape.beamLike())
                {
                    // part (0), subpart (1), section (2), length (3), quantity (4)
                    const beamDims = shape.beamDims();
                    // NOTE: round to integer for now
                    partRowsAll.push([groupName, shape.getName(), `${Math.round(beamDims.small)}x${Math.round(beamDims.mid)}`, Math.round(beamDims.length), 1])   
                }
            })
        });

        const groupedPartRows = {};
        const genId = (row) => `${row[0]}-x${row[2]}-${row[3]}`; // group by main part, section dims and length
        
        partRowsAll.forEach(row => {
            const id = genId(row);
            if(!groupedPartRows[id])
            {
                groupedPartRows[id] = row;
            }
            else {
                if(row[1] && groupedPartRows[id][1].indexOf(row[1]) === -1 ) // avoid repeating names
                { 
                    groupedPartRows[id][1] += `,${row[1]}` 
                } // add subpart names together
                groupedPartRows[id][4] += 1;
            }
        })

        // make Calc table
        return this._ay.calc.table(
            name || shapes.getName() as string || 'parts',
            Object.values(groupedPartRows),
            COLUMNS
        ) as Table
        

    }
}
