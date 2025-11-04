/**
 * 
 *  Make.ts
 *     Module that contains functionality to simplify making (CAM)
 * 
 */

import { ConsoleMessage, ArchiyouApp, Point, Vector, AnyShape, Vertex, Edge, Face, Solid, ShapeCollection, LayoutOptions, addResultShapesToScene } from './internal' // classes
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
    grid?:number // snap to a grid in primary axis
    gridOffset?:number // offset the primary grid in direction of primary axis
    secondaryGrid?:number // TODO
    secondaryGridOffset?:number // TODO
    // !!!! TODO: seamsDirection - NOW only vertical
    seamsStartOffset?: number // let seams start later then start of layout
    leftover?:boolean // 
    cutMargin?:number
    stats?: boolean // calculate stats after operation
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
            width: o?.width || 1000,
            height: o?.height || 1000,
            stockWidth: o?.stockWidth || 100,
            stockHeight: o?.stockHeight || 100,
            start: o?.start || 'bottomleft',
            direction: o?.direction || 'horizontal',
            grid: o?.grid,
            gridOffset: o?.gridOffset || 0,
            secondaryGrid: o?.secondaryGrid, // not yet implemented
            secondaryGridOffset: o?.secondaryGridOffset || 0, // not yet implemented
            leftover: o?.leftover || false,
            cutMargin: o?.cutMargin || this.LAYOUT2D_BOX_DEFAULT_FITTING_MARGIN_SIZE,
            stats: o?.stats ?? true
        }
    }

    _layout2DBoxesNewBox(cursor:Point, o:Layout2DOptions, leftOverSize?:number):Face
    {   
        const direction = (o.direction === 'horizontal') ? new Vector(1,0) : new Vector(0,1); // TODO: from right to left
        const secDirection = direction.swappedXY();
        
        const mainAxis =  (o.direction === 'horizontal') ? 'x' : 'y'; // axis of direction
        const secAxis =  (o.direction === 'horizontal') ? 'y' : 'x'; // axis of secondary direction

        const layoutVec = new Vector(o.width, o.height);
        const mainLimit = layoutVec.scaled(direction).length(); // limit of layout in primary direction
        const secLimit = layoutVec.scaled(secDirection).length();

        const origBoxVec = new Vector(o.stockWidth, o.stockHeight);
        const boxVec = origBoxVec.copy();

        if (leftOverSize) // left over from previous box 
        {
            boxVec[mainAxis] = leftOverSize; 
        }

        // check along secondary axis for limit
        if(cursor.moved(boxVec)[secAxis] > secLimit)
        {
            boxVec[secAxis] = secLimit - cursor[secAxis];
        } 

        let boxLimitedPrim = false;
        // check along primary axis if out of limit 

        if(cursor.moved(boxVec)[mainAxis] > mainLimit)
        {
            boxVec[mainAxis] = mainLimit - cursor[mainAxis];
            boxLimitedPrim = true;
        }

        // if not out of primary limit, snap to grid
        if(!boxLimitedPrim && o.grid) // check if box arrives in primary direction at grid as defined in o.grid, with offset o.gridOffset
        { 
            const startGridOffset = (cursor[mainAxis] < o.gridOffset) ? o.gridOffset : 0;
            const sizeAlongGrid = Math.floor((boxVec[mainAxis]-startGridOffset)/o.grid)*o.grid + startGridOffset;
            // can't fit box to grid (not enought size in primary axis available): register wasted Shape
            if(sizeAlongGrid < 0)
            {
                this.stats.waste.addAligned(new Face().makeRectBetween(cursor, cursor.moved(boxVec)))
            }
            // so make the box fit the grid, or start a fresh one (limited to grid or width if needed)
            boxVec[mainAxis] = (sizeAlongGrid > 0) ? sizeAlongGrid : 
                        (cursor.moved(origBoxVec)[mainAxis] > mainLimit) ? 
                            mainLimit - cursor[mainAxis]
                            : Math.floor((origBoxVec[mainAxis]-startGridOffset)/o.grid)*o.grid + startGridOffset // original width snapped to grid

        }
        // now make box
        const boxTo = cursor.moved(boxVec);
        const newBox = new Face().makeRectBetween(cursor, boxTo);

        return newBox;
    }

    _layout2DBoxes(o?:Layout2DOptions):ShapeCollection
    {
        this.resetStats();

        if(!o?.width || !o?.height)
        {
            console.warn(`Make::_layout2DBoxes(Layout2DOptions): Zero or nullish width and height given: Returned empty ShapeCollection`);
            return new ShapeCollection();
        }

        o = this._checkLayoutOptions(o);

        let createdElems = new ShapeCollection().setName('boards'); 
        let cursor = this._alignment2DToPoint(o.start, o.width, o.height);
        
        const mainDirectionVec = (o.direction === 'horizontal') ? new Vector(1,0) : new Vector(0,1);
        const mainDirectionSide = (o.direction === 'horizontal') ? 'width' : 'height';
        const mainDirectionBboxSide = (o.direction === 'horizontal') ? 'width' : 'depth';
        const mainDirectionAxis = (o.direction === 'horizontal') ? 'x' : 'y';

        // Some checks for sanity
        if((o.direction === 'horizontal' && o?.grid > o.stockWidth) || (o.direction === 'vertical' && o?.grid > o.stockHeight) )
        {
            throw new Error(`Make::_layout2DBoxes: Make sure your stock (stockWidth or stockHeight depending on direction) size is bigger then grid!`)
        }

        let leftOverBoxSize; // in main direction
        
        while(true)
        {
            // find next box
            const newBox = this._layout2DBoxesNewBox(cursor, o, leftOverBoxSize); // this method find a next box (where needed cut to seams or end of layout)
            
            if (!newBox)
            { 
                // Can't find a new box anymore
                break; 
            }
    
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
            cursor = cursor.moved(new Vector(newBox.bbox().width(),newBox.bbox().depth()).scaled(mainDirectionVec));

            // check if cursor in main direction filled up and return to next row of boxes in main direction
            if( (cursor[mainDirectionAxis] >= o[mainDirectionSide]))
            {
                cursor = new Vector(cursor.x + newBox.bbox().width(), cursor.y + newBox.bbox().depth()).scaled(mainDirectionVec.swappedXY()).toPoint();
                leftOverBoxSize = (o.leftover) ? new Vector(o.stockWidth, o.stockHeight).scaled(mainDirectionVec).length() - newBox.bbox()[mainDirectionBboxSide]() : null;
            }
          
            // check cursor in secondary direction - and break
            if( (o.direction === 'horizontal' && cursor.y >= o.height) || (o.direction === 'vertical' && cursor.x >= o.width))
            {
                break;
            }

        }

        // calculate stats (default: true)
        if(o.stats)
        {
            this._layout2DBoxesStats(o);
        }

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
            this.stats.fitted = this.stats.cut.pack(
                    { 
                        stockWidth: o.stockWidth, 
                        stockHeight: o.stockHeight, 
                        margin: o.cutMargin,
                        autoRotate: false, 
                     }, true)

            this.stats.numStock += this.stats.fitted.getGroup('bins').length;
            const stockUsedArea = this.stats.numStock * o.stockWidth * o.stockHeight;
            const cutPartsArea = this.stats.fitted.getGroup('cut').reduce( (sum,shape) => sum + shape.area(), 0)
            const fullPartsArea = this.stats.full.length * (this.stats.full?.first()?.area() || 0)
            this.stats.efficiency = Math.round((fullPartsArea + cutPartsArea) / stockUsedArea * 100);
            this.stats.wastedArea = stockUsedArea - fullPartsArea - cutPartsArea;
        }
        
        return this.stats;
    }

    /** Public method to generate rectangular boarding on rectangle plane on XY plane 
     *  Generates statistics on waste, cuts etc at make.stats
    */
    @addResultShapesToScene
    boarding(o?:Layout2DOptions):ShapeCollection
    {
        return this._boarding(o);
    }

    _boarding(o?:Layout2DOptions):ShapeCollection
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
    wallFrame(width:number, height: number, depth: number, studThickness: number, grid:number, openings: Array<WallOpening> = [] ): ShapeCollection
    {
        const DEFAULT_GRID_DISTANCE = 610;
        const DEFAULT_STUD_THICKNESS = 38;
        const ENDING_STUDS_INSIDE = true;
        const OPENING_WIDTH_MIN = 100;
        const OPENING_HEIGHT_MIN = 100;
    
        grid = grid || DEFAULT_GRID_DISTANCE;
        studThickness = studThickness || DEFAULT_STUD_THICKNESS;

        const OPENING_SNAP_POSITION_WITHIN_DISTANCE = studThickness*2; // kingstud + frame

        const wallDiagram = new Face().makePlaneBetween([0,0,0],[width,0,height]);

        const openingDiagrams = new ShapeCollection();
        const openingFlags = []; // flags per opening - register a snap of opening to wall frame (leaving out the window frame)

        // Openings: basic input checks
        // NOTE: We only support one opening now
        openings.forEach( (o,i) => 
            {
                const curOpeningFlags = { snapTop: false, snapBottom: false, snapLeft: false, snapRight: false };
                openingFlags.push(curOpeningFlags);

                if(typeof o.left === 'number' && o.left >= 0 && typeof o.sill === 'number' && typeof o.height === 'number' 
                    && o.height >= OPENING_HEIGHT_MIN && typeof o.width === 'number' && o.width >= OPENING_WIDTH_MIN)
                {
                    // Basic horizontal tests
                    if(o.left < studThickness)
                    {
                        this._ay.console.user(`Opening #${i} snapped left to start stud at ${studThickness}`);
                        // NOTE: keep width the same
                        o.left = studThickness;
                        curOpeningFlags.snapLeft = true;
                    }
                    // total width
                    if( o.left + o.width > width - 2*studThickness)
                    {
                        // First try to decrease left
                        o.left = width - studThickness - o.width;
                        curOpeningFlags.snapRight = true; 
                        if(o.left < studThickness)
                        {
                            o.left = studThickness;
                            curOpeningFlags.snapLeft = true;
                            o.width = width - 2*studThickness;
                            this._ay.console.user(`Opening #${i} width decreased to ${o.width} to fit inside wall`);
                        }
                        else {
                            this._ay.console.user(`Opening #${i} left decreased to ${o.left} to fit width of ${o.width} inside wall`);
                        }
                    }
                    
                    // Basic vertical tests
                    if(o.sill < studThickness)
                    { 
                        o.sill = studThickness; 
                        this._ay.console.user(`Opening #${i} Snapped sill to minimum of ${studThickness}`);
                        curOpeningFlags.snapBottom = true;
                    }
                    // Vertical checks: combined height and sill - try to keep height over sill
                    if(o.sill + o.height > height - 2*studThickness)
                    {
                        let newSill = height - studThickness - o.height; // first lower sill if possible
                        curOpeningFlags.snapTop = true;
                        if (newSill < studThickness )
                        { 
                            curOpeningFlags.snapBottom = true;
                            let newHeight = o.height - newSill + studThickness;
                            if(newHeight >  height - studThickness)
                            { 
                                newHeight = height - studThickness; // height starting from sill
                                this._ay.console.user(`Opening #${i} Snapped height to minimum of ${height - 2*studThickness}`);
                            };
                            o.height = newHeight;
                            newSill = studThickness;
                        }; 

                        o.sill = newSill;
                        this._ay.console.user(`Opening #${i} Snapped sill to ${newSill} to fit opening in height`);
                    }

                    // Now make diagram Shape for opening
                    openingDiagrams.add( 
                        new Face().makePlaneBetween(
                            [o.left, 0, o.sill],
                            [o.left+o.width, 0, o.sill+o.height]))
                    
                }
                else {
                    this._ay.console.user(`Opening #${i} (width=${o.width} height=${o.height} left=${o.left} sill=${o.sill}) is not well defined! Skipped.`);
                }

            }
        )

        // vertical grid
        const gridLines= new ShapeCollection();
        const numGridLines = Math.floor(width/grid) + 1;
        const remainingWallWidth = width - (numGridLines -1) * grid;
        const skipEndStud = (remainingWallWidth < studThickness) ? true : false;

        new Array(numGridLines).fill(null).
            map( (e,i) => gridLines.add(
                                new Edge().makeLine([0,0,0],[0,0,height]).move(grid*i)
                                ))

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
            }
            primaryStuds.add(newStud)
        })

        // Ending stud (see: skipEndStud above)
        if(!skipEndStud)
        {
            // Don't add end stud if there is no space between width and last grid line
            // Meaning the wall needs a filler stud
            const endStud = stud.moved(width, 0, height/2) 
            ENDING_STUDS_INSIDE ? endStud.move(-studThickness/2) : endStud;
            primaryStuds.add(endStud)
        }

        // Insulation
        let insulation = new ShapeCollection();
        primaryStuds.forEach((stud,i) => 
        {
            if(i < primaryStuds.length - 1)
            {
                const nextStud = primaryStuds.at(i+1);
                insulation.add(
                    new Solid().makeBoxBetween(
                        stud.max(),
                        nextStud.min())
                )
            }
        })

        

        // Openings: Validate openings and give feedback for user when needed
        const checkedOpenings = new ShapeCollection();
        const removedStuds = new ShapeCollection(); // primary studs that were removed
        const crippleStudsTop = new ShapeCollection(); // cut studs
        const crippleStudsBottom = new ShapeCollection();
        const openingFramesHorizontals = new ShapeCollection(); // add resulting frames here
        let openingFramesVerticals = new ShapeCollection(); // add resulting frames here
        const openingKingStuds = new ShapeCollection();
        const openingJackStuds = new ShapeCollection();

        openingDiagrams.forEach( (o,i) => 
        {
            // some flags in openingFlags[i]
            const curOpeningFlags = openingFlags[i];
            const openingStart = o.bbox().min()._toVertex();

            // Modify openingDiagrams (flat faces) in place if needed
            let checkedOpening = o;

            // continue if opening is valid
            if(checkedOpening)
            {   
                // Horizontal checks: check position versus studs
                // snap start position to match with nearest stud
                if (curOpeningFlags.snapLeft)
                {
                    // no left frame for opening - keep it like this
                }
                else {
                    const nearestStartGridLine = gridLines.nearest(openingStart);
                    const d1 =  nearestStartGridLine.distance(openingStart)
                    const snapTestWithinDistance = (nearestStartGridLine === gridLines.first()) ? OPENING_SNAP_POSITION_WITHIN_DISTANCE+studThickness : OPENING_SNAP_POSITION_WITHIN_DISTANCE
                    if(d1 < snapTestWithinDistance) // If within distance snap to given offset aligned to primary stud centerline
                    {
                        const xOffset = (nearestStartGridLine === gridLines.first()) ? 2 : 1.5;
                        const moveToX = nearestStartGridLine.center().x + studThickness * xOffset;
                        checkedOpening.moveToX(moveToX, 'left')
                        this._ay.console.user(`Snapped Opening #${i} on a stud at centerline ${nearestStartGridLine.center().x} at distance ${d1}`);
                        // Check if the opening still fits
                        if (checkedOpening.bbox().maxX() > width - studThickness)
                        {
                            // Make it smaller to have it fit and snap to end of wall
                            checkedOpening = new Face().makePlaneBetween(checkedOpening.min(), checkedOpening.max().setX(width - studThickness))
                            curOpeningFlags.snapRight = true;
                            this._ay.console.user(`Opening #${i} was decreased in width to ${checkedOpening.bbox().width()} to fit the end of the wall!`);
                        }   
                    }
                }
                // Snapping the width of an opening to maintain grid and avoid weird positioning
                // But width of opening can not change from specified by parameters
                const nextGridLine = gridLines.find( s => checkedOpening.max().x < s.center().x)

                if(nextGridLine)
                {
                    if(curOpeningFlags.snapRight)
                    {
                        // snapped to right of wall. Do nothing
                    }
                    else
                    {
                        // opening is too close to next primary stud to fit in king stud 
                        // (but is not at same position for king stud to overlap primary one)
                        // we enlarge the opening to have king stud at position of primary stud
                        const distanceToNextStud = checkedOpening.distance(nextGridLine) - 0.5 * studThickness;
                        const checkDistance = (gridLines.last() === nextGridLine) ? 2.5*studThickness : 2*studThickness;
                        if (distanceToNextStud > studThickness && distanceToNextStud < checkDistance )
                        {
                            const newOpeningMax = checkedOpening.max().move(distanceToNextStud-studThickness);
                            if (newOpeningMax.x > width - 2*studThickness) // enlarge is limited to right side of wall
                            {   
                                newOpeningMax.x = width - 2*studThickness;
                                curOpeningFlags.snapRight = true; // right snap mode drops frame
                                this._ay.console.user(`Enlarged opening #${i} to fit to end of wall`);
                            }
                            else {
                                this._ay.console.user(`Enlarged opening #${i} by ${distanceToNextStud-studThickness} units to fit to grid studs!`);
                            }
                            checkedOpening = new Face().makePlaneBetween(checkedOpening.min(), checkedOpening.max().move(distanceToNextStud-studThickness))
                            
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
                                this._ay.console.user(`Enlarged opening #${i} by ${dx} units. Now last cripple aligns with grid`);
                            }
                        }
                    }
                }
                
                checkedOpenings.add(checkedOpening); // keep track of final openings

                // make opening surrounding frame
                const openingTestBuffer = checkedOpening
                                            ._offsetted(studThickness-1) // a bit smaller to avoid accuracy problems
                                            ._thickened(depth*2)

                primaryStuds.forEach( (stud,studIndex) => 
                {
                    // evaluate overlapping studs to make cripples top and bottom
                    // don't cut first or last stud
                    if(studIndex !== 0 && studIndex !== primaryStuds.length - 1 && stud.overlapPerc(openingTestBuffer) > 0.02) // use overlapPerc for robustness
                    {
                        const splitStuds = new ShapeCollection(stud._splitted(openingTestBuffer, true)); // force ShapeCollection
                        if (splitStuds.length >= 1)
                        { 
                            // check if cripples top and bottom are made
                            const bottomCripple = splitStuds.filter(s => s.center().z < checkedOpening.center().z)
                            const topCripple = splitStuds.filter(s => s.center().z > checkedOpening.center().z)
                            
                            if(bottomCripple){ crippleStudsBottom.add(bottomCripple); }
                            if(topCripple){ crippleStudsTop.add(topCripple); }
                            
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
                let openingFrame = this.rectFrame(
                                openingBufferBbox.width(),
                                openingBufferBbox.height(),
                                depth,
                                studThickness,
                                'horizontal'
                            )
                            .moveTo(openingTestBuffer.center());
                
                // Don't add frame left, top and bottom or right if opening was snapped
                const includeFrameParts = [];
                for (const [flag,val] of Object.entries(curOpeningFlags))
                {
                    const FLAG_FALSE_TO_PART = { snapLeft: 'frameLeft', snapRight: 'frameRight', snapBottom: 'frameBottom', snapTop: 'frameTop' }
                    if( FLAG_FALSE_TO_PART[flag] && val === false)
                    {
                        includeFrameParts.push(FLAG_FALSE_TO_PART[flag]);
                    }
                }

                openingFrame = new ShapeCollection(openingFrame.filter(s => includeFrameParts.includes(s.name())));
                
                openingFramesHorizontals.add(openingFrame.filter(s => s.name() === 'frameTop' || s.name() === 'frameBottom'))
                openingFramesVerticals.add(openingFrame.filter(s => s.name() === 'frameLeft' || s.name() === 'frameRight'))
                // NOTE: _subtract does not take over data in original ShapeCollection like groups or names
                openingFramesVerticals = openingFramesVerticals._subtracted(plates); // correct vertical frames by topplates to be sure
                

                // make king and jack studs for current opening
                const openingFrameBbox = openingFrame.bbox(); // avoid recalculating
                const leftSnapOffset = (curOpeningFlags.snapLeft) ? studThickness : 0;
                const rightSnapOffset = (curOpeningFlags.snapRight) ? studThickness : 0;

                if(!curOpeningFlags.snapBottom)
                {
                    const openingJackLeftBottom = new Solid().makeBoxBetween(
                                            openingFrameBbox.min(), 
                                            [openingFrameBbox.min().x + studThickness,depth/2, studThickness]) 
                                            .moveX(leftSnapOffset);

                    const openingJackRightBottom = openingJackLeftBottom._copy().move(
                                    openingBufferBbox.width()-studThickness-leftSnapOffset-rightSnapOffset)
                    openingJackStuds.add(openingJackLeftBottom,openingJackRightBottom)
                }

                if(!curOpeningFlags.snapTop)
                {
                    const openingJackLeftTop = new Solid().makeBoxBetween(openingFrameBbox.min().moveZ(openingFrameBbox.height()), 
                                                [openingFrameBbox.min().x+studThickness,
                                                    depth/2, height - studThickness]) 
                                                .moveX(leftSnapOffset);

                    const openingJackRightTop = openingJackLeftTop._copy()
                                                .move(openingBufferBbox.width()-studThickness-leftSnapOffset-rightSnapOffset)

                    openingJackStuds.add(openingJackLeftTop, openingJackRightTop);
                }

                // King studs left
                if(!curOpeningFlags.snapLeft)
                {
                    const openingKingStudLeft = stud._copy().align(
                                                new Vertex(openingFrameBbox.minX(), 0, studThickness),
                                                'bottomrightcenter',
                                                'center'
                                            )
                     // remove primary stud that overlaps king stud (when snapping is on this is cleanup automatically)
                    const overlappingPrimaryStud = primaryStuds.filter(s => s.overlapPerc(openingKingStudLeft) > 0.02)
                    if(overlappingPrimaryStud){ removedStuds.add(overlappingPrimaryStud); }
                    openingKingStuds.add(openingKingStudLeft);
                }
                else {
                    // subtract horizontals with primary left stud
                    openingFramesHorizontals.forEach(s => s.subtract(primaryStuds.first()))
                }
                
                // King stud right
                if(!curOpeningFlags.snapRight)
                {
                    let openingKingStudRight = stud._copy().align(
                            new Vertex(openingFrameBbox.maxX(), 0, studThickness),
                            'bottomleftcenter',
                            'center'
                        )
                    const overlappingPrimaryStudRight = primaryStuds.filter(s => s.overlapPerc(openingKingStudRight) > 0.02)
                    if(overlappingPrimaryStudRight){ removedStuds.add(overlappingPrimaryStudRight); }

                    openingKingStuds.add(openingKingStudRight);
                }
                else {
                    // subtract horizontals with primary right stud
                    openingFramesHorizontals.forEach(s => s.subtract(primaryStuds.last()))
                }

                // Clean insulation around frame
                insulation = insulation._subtracted(openingTestBuffer);
                const leftSnapOffet = (curOpeningFlags.snapLeft) ? studThickness : 0;
                const rightSnapOffet = (curOpeningFlags.snapRight) ? -studThickness : 0;

                insulation = insulation._subtracted(
                        new ShapeCollection(
                            // king/jack studs combination: left
                            new Solid().makeBoxBetween(
                                [checkedOpening.min().x, depth/2*1.1, 0], // make it bigger along wall frame (there is no insulation there anyway)
                                [checkedOpening.min().x - 2*studThickness, -depth/2*1.1, height]
                                ).moveX(leftSnapOffet),
                            // right
                            new Solid().makeBoxBetween(
                                [checkedOpening.max().x, depth/2*1.1, 0], 
                                [checkedOpening.max().x + 2*studThickness, -depth/2*1.1, height]
                            ).moveX(rightSnapOffet)
                        ))
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
                .addGroup('cripplesTop', crippleStudsTop.color('green'))
                .addGroup('cripplesBottom', crippleStudsBottom.color('green'))
                .addGroup('openingFramesHorizontals', openingFramesHorizontals.color('red'))
                .addGroup('openingFramesVerticals', openingFramesVerticals.color('red'))
                .addGroup('openingKingStuds', openingKingStuds.color('brown'))
                .addGroup('openingJackStuds', openingJackStuds.color('brown'))
                .addGroup('openingDiagrams', checkedOpenings.color('grey'))
                .addGroup('insulation', insulation.color('#222'))
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

        let partRowsAll = [];

        console.info(`Make::partList(shapes, name): Got ${shapes.length} to make a part list with. If you name and group shapes the results will be better.`);

        shapes.forEachGroup((groupName,groupedShapes) =>
        {
            groupedShapes.forEach((shape) => 
            {
                if(shape.beamLike() && shape.visible())
                {
                    // part (0), subpart (1), section (2), length (3), quantity (4)
                    const beamDims = shape.beamDims();
                    // NOTE: round to integer for now
                    partRowsAll.push(
                        [groupName, shape.getName(), `${Math.round(beamDims.small)}x${Math.round(beamDims.mid)}`, Math.round(beamDims.length), 1]
                    )   
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

        // After grouping flatten again into Array
        let groupedRows = Object.values(groupedPartRows) as Array<Array<any>>; // [ [row1], [row2], ...]

        // Now also count the totals per section
        const uniqueSections = Array.from(new Set(partRowsAll.map((row) => row[COLUMNS.indexOf('section') as any])));
        
        const totalRows = uniqueSections.map((section) => 
        {
            const totalSectionLength = groupedRows.reduce(
                (sum,row) => 
                sum + (
                        (row[COLUMNS.indexOf('length')] ?? 0) 
                        * (row[COLUMNS.indexOf('quantity')] ?? 0)
                        * (row[COLUMNS.indexOf('section')] === section ? 1 : 0)
                )
             , 0)
            return ['', 'total per section', section, totalSectionLength, '']  // align to right
        })
        
        groupedRows = groupedRows.concat([
                            ['','','---- +', 'L x Q', ''], 
                            ...totalRows
                        ]);

        // Make Calc table
        return this._ay.calc.table(
            name || shapes.getName() as string || 'parts',
            groupedRows,
            COLUMNS
        ) as Table
        

    }


  

}
