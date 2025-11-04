/** 
 *  New taxonomy within Make module that gives structure and meaning to the scripts we create.
 *  Works together with the Calc module to write data accordingly
 *  and some mapping method on Shapes
 * 
 *  Some concepts:
 *      - SHAPE TO TYPE: We make shapes, we want to give them a specific meaning, manually or automatic
 *           => For example we created a board or a beam of a certain material, with a given section and primary size (length or thickness)
 *      - SHAPE OPERATIONS TO MAKE MEANING: Based on shape and their operations we can signify what kind of operations are done to these shapes
 *          => For example: This board is created from a stock one by cutting them to size in two longitudinal sizes
 *                  or: This beam is cut crossways two times with a given cut depth, we can estimate the amount this took (based on some settings)
 *      - SHAPES TO COMPONENTS TO ASSEMBLIES: Based on shapes and their meaning we can group them into components and assemblies
 *         => For example: This set of boards and beams make up a wall frame, or a table. With the operations we can estimate how long it will take to make
 *      - MEANINGFUL DATA BASED ON TAXONOMY: Based on the above we can collect data on prices, time, waste
 *               ==> We can generate Order lists for suppliers, price estimates with various levels of abstraction
 *               ==> We want to guarantee consistency and quality with clear data-schemas
 *      - SPECIALIZED OUTPUTS:
 *              ==> advanced data tables
 *              ==> For example IFC(5) (which needs more taxonomy from components: for example component is a wall, these components are a storey) 
 *              ==> or time-based animations
 *              ==> direct CNC control files (BTLx, GCODE, etc)
 *
 *  
 *  Design principles
 *      - Introduction of Operations that perform parametric modifications on shapes 
 *          using standard Shape methods like booleans but with more context based on what of shape it is (a beam or board for example) 
 *      - Operations are parametric and somewhat inspired by BTLx standards:
 *            - Cut
 *            - LongitudinalCut
 *            - (Drill)Hole
 *            - Aperture
 *            see: https://design2machine.com/btlx/index.html
 * 
 *  
 *  Setup:
 *      - Use Make operation directly: 
 *             ==> make.cut(stud, { x, y, angle, secondaryAngle }) // what reference axis?
 *             ==> make.cutLong(board, { x,y })
 *      - We could automatically map general operations (like booleans) to Make operations based on a history chain
 *
 *  Usage scenario:
 * 
 *   const stud = box(38, 100, 3000).is('beam').product('SLS');
 *   const board = box(1000,500,18).is('board').product('OSB3');
 *   make.cut(stud, { x: 200, y:0 }); 
 *   make.curLong(board, { ... })
 * 
 *  Entities:
 *      - OperationType: cut, cutLong, hole, screw
 *      - OperationShapeType: beam, panel
 *      - OperationRefPlane: { origin:Point, xDir: Vector, yDir: Vector } where x-axis is along the longest side as primary axis
 *      - Operation: parametric modification of shape with meaning
 *          { type: OperationType, shape:AnyShape, shapeType:OperationShapeType, ref: OperationRefPlane, 
 *              params: Operation{{type}}Params, result:AnyShape, artefacts:AnyShapeOrCollection }
 *              ==> placed on Shape._operations = Array<Operation>
 *  
 */

import { Make, Point, Vector, Face } from './internal'
import type { AnyShape, AnyShapeOrCollection } from './internal'

//// LOCAL TYPES ////

type OperationShapeType = 'beam' | 'board' | null;
type OperationType = 'cut' | 'cutLong' | 'hole' | 'screw';
type OperationRefPlane = { origin:Point, xDir: Vector, yDir: Vector, zDir: Vector, face: Face };
interface Operation { 
    type: OperationType, 
    shape:AnyShape, 
    shapeType:OperationShapeType, 
    ref: OperationRefPlane, 
    params: Record<string, any>, // defined inline at operation methods
    result:AnyShape, 
    artefacts:AnyShapeOrCollection
};


export class MakeOperations
{
    _make:Make; // Reference to parent Make module

    constructor(make:Make)
    {
        this._make = make;
    }

    //// MAIN OPERATIONS ////

    /** Operation: Cut 
     *  Cross cut with cutting plane center at (x,y,z) on shape reference plane 
     *  and plane rotation 
    */
    cut(shape:AnyShape, 
            params: { x:number, y:number, z:number, angle?:number, secondaryAngle?:number}): AnyShape
    {

    }

    /** Calculate the base information for a operation
     *  What the ShapeType is and the local reference plane
     */
    _setOperationBase(shape:AnyShape): { type: OperationShapeType, ref:OperationRefPlane } 
    {
        const OBBOX_FIT_PERC = 0.9;
        const IS_BOARD_SM_MD_PERC = 0.2;    

        if(shape.type() !== 'Solid')
        {
            console.warn(`Make::_determineOperationShapeType: Shape type ${shape.type()} is not supported for operation shape type detection!`)
        }
        // Then see if the orientated bounding box fits nicely
        // Use volume for more speed
        if(shape.volume()/shape.obbox().shape().volume() < OBBOX_FIT_PERC)
        {
            console.warn(`Make::_determineOperationShapeType: Could not make a good fit with a orientated bounding box: Probably this Shape to irregular!`);
        }
        else {
            const obbox = shape.obbox();

            const sides = [{ axis: 'x', size: obbox.width()}, 
                { axis: 'y', size: obbox.depth()},
                { axis: 'z', size: obbox.height()}]
                    .sort((a,b) => b.size - a.size ) // sort sides from small to largest 
        
            const [ smallSide, midSide, largeSide ] = sides;

            const shapeType = (smallSide.size/midSide.size < IS_BOARD_SM_MD_PERC) ? 'board' : 'beam';

            /* Define reference plane
             Depending on shapeType (beam or board) we define the reference plane accordingly
              which creates a local coordinate system
             We use the natural placement for operations (like sawing or cutting) which 
             places the piece (either beam or board) with smallest side parallel to z-axis (flat on the workbench)  
             the middle side parallel to x-axis and the largest along the y axis
             
             the origin: (max size along width axis (mid), min of depth and height  
             
             NOTE: We don't actually lay the Shape flat on the XY plane here  
            */
            
            const origin = new Point(obbox.max().x, obbox.min().y, obbox.min().z),
            const xDir = obbox[`${largeSide.axis}Dir`](), // local x axis in world coords is along largest side (~length of piece)
            const yDir = obbox[`${midSide.axis}Dir`]().reversed(), // local y axis is along middle side (~width of piece) parallel to global x, but reversed
            const zDir = obbox[`${smallSide.axis}Dir`]()  // local z axis is along smallest side (~height of piece, or depth of operation)
            const face = new Face().makePlaneBetween(origin, origin.moved(xDir.scaled(largeSide.size, yDir.scaled(midSide.size))))
            

            return { 
                type: shapeType, 
                ref: { origin, xDir, yDir, zDir, face} 
            };

        }

    }


  
}