const geom = new Geom(); // get the Geometry tool out

const WIDTH = $WIDTH || 300;
const DEPTH = $DEPTH || 500;
const WALL_HEIGHT = 250;
const ROOF_HEIGHT = $ROOF_HEIGHT || 100;
const SEGMENT_SIZE = $SEGMENT_SIZE || 60;

//// DIAGRAM ////

geom.layer("diagram").color('red');

let segmentVec = new Vector(1,1,0).normalize().scale(SEGMENT_SIZE);
let closeVec = segmentVec.normalized().scale(WIDTH/2*Math.sqrt(2));
let numSegmentsInDepth = Math.floor( (DEPTH - closeVec.y)/segmentVec.y);
if(numSegmentsInDepth % 2 != 0) // need to be even
{
    numSegmentsInDepth--;
}
// generate zigzagLeft
let prevPoint = new Vector(0,0,0);
let points = [prevPoint ];
for(let s = 0; s < numSegmentsInDepth; s++)
{
    let v = segmentVec.copy();
    if (s%2 != 0)
    {
         v.x*= -1;    
    }
    let curPoint = prevPoint.added(v);
    points.push(curPoint);  
    prevPoint = curPoint;
}
let leftZigZag = geom.Wire().fromVertices(points);
let rightZigZag = leftZigZag.mirrored('y', [WIDTH/2,0,0]).addToScene();
let back = new Wire().fromVertices([leftZigZag.end(), [WIDTH/2,leftZigZag.end().toVector().y + closeVec.y,0], rightZigZag.end()]).addToScene();

// TODO: make something elegant combining those existing wires
let edges = leftZigZag.edges().all().concat(back.edges().all())
edges = edges.concat(rightZigZag.edges().all().reverse()); // TODO: make order of Edges irrelevant in fromEdges
let contour = new Wire().fromEdges(edges).addToScene();
// let contourLeftSide = contour.select('E<X=200').moved([0,0,400]).addToScene(); // NOT WORKING
let contourLeftSide = new Wire().fromEdges(contour.edges().slice(0,numSegmentsInDepth+1)).addToScene();
let floorContour = contour.copy().close().addToScene();

let frontContourLeft = new Wire().fromVertices([
    [0,0,0],
    [0,0,WALL_HEIGHT],
    [WIDTH/2,0,WALL_HEIGHT+ROOF_HEIGHT],
]).addToScene().hide();
let frontContourRight = frontContourLeft.mirrored('y', [WIDTH/2,0,0]).addToScene().hide();
let frontEdges = frontContourLeft.edges().all().concat(frontContourRight.edges().all().reverse()); // TODO: ShapeCollection.concat (like Array)
let frontContour = new Wire().fromEdges(frontEdges).addToScene();  // TODO: check working with ShapeCollection

//// SOLIDS ////

geom.layer("solids").color('red');
let floor = floorContour.toFace().extrude(20);

let wallFaceLeft = contourLeftSide.thickened(10, [WIDTH/2,0,0]).addToScene().color('yellow');

// SWEEP BUG: SYMMETRIE GIVES ARTEFACT:
//let frontContourLeftTest = new Wire().fromVertices(frontContourLeft.vertices().add([new Vertex(WIDTH,0,WALL_HEIGHT)])).addToScene(); // ==> MESSED UP!
//let frontContourLeftTest = new Wire().fromVertices(frontContourLeft.vertices().add([new Vertex(WIDTH,0,WALL_HEIGHT+10)])).addToScene(); // ==> OK (but only > 10)

let roofLineVec = new Vector(WIDTH/2,0,ROOF_HEIGHT).normalize();
frontContourLeftExt = new Wire().fromVertices(frontContourLeft.vertices().slice(0,2).add( // TODO: BETTER - S
    frontContourLeft.end().toVector().add(roofLineVec.scale(20)).toVertex())).addToScene().color('purple').hide();

let wallsSolidsLeft = wallFaceLeft.outerWire().sweeped(frontContourLeftExt, true, true, null).addToScene(); 
let subBox = geom.BoxBetween([WIDTH/2,-100,0],[WIDTH,DEPTH,WALL_HEIGHT+ROOF_HEIGHT+100]);
wallsSolidsLeft.subtract(subBox.hide());
let wallsSolidsRight = wallsSolidsLeft.mirrored('y', [WIDTH/2,0,0]).addToScene();

//// OPENINGS/WINDOWS

geom.layer('openings').color('blue');

// use Bbox selector to select this line
let entranceLineLeft = wallsSolidsLeft.select(`E@B[${segmentVec.x+5},0,0][${WIDTH/2+5},100,2000]`);
let entranceLineRight = entranceLineLeft.mirrored('y', [WIDTH/2,0,0]);

let entranceLine = new Wire().fromEdges(entranceLineLeft).combined(new Wire().fromEdges(entranceLineRight));
entranceLine.addToScene().color('black');

let entranceProfile = geom.Rect(10,10).hide();

let entranceFrame = entranceProfile.sweeped(entranceLine, true, true, 'right').addToScene();

let wallInsideHeight = entranceLineLeft.select(`E@B[${segmentVec.x+5},0,0][${WIDTH/2-20},100,2000]`).first().end();
let entranceFrameH = geom.BoxBetween(
    wallInsideHeight.toVector().add([0,10/2,0]),  // NOT WORKING WITH Vertex.move
    wallInsideHeight.toVector().add([entranceLine.bbox().width(), -10/2, -10])).color('blue');
let entranceFrameH2 = entranceFrameH.moved([0,0,-wallInsideHeight.z+10]).addToScene().color('blue');
entranceFrame.union(entranceFrameH).union(entranceFrameH2);

function window(w,h)
{
    const FRAME_SIZE = 10;
    let frame = geom.Box(w,FRAME_SIZE, h).subtract(geom.Box(w-2*FRAME_SIZE, FRAME_SIZE, h-2*FRAME_SIZE).hide());
    return frame;
}

let segmentIndex = (rightZigZag.edges().length > 3) ? 3 : 1;
let segment = rightZigZag.edges()[segmentIndex];
let w1 = window(SEGMENT_SIZE-20,WALL_HEIGHT-70).move(segment.center())
.rotateZ(45).move([0,0,WALL_HEIGHT/2]);
let sbox = geom.Box(SEGMENT_SIZE-20, 30, WALL_HEIGHT-70)
    .move([segment.center().x, segment.center().y, WALL_HEIGHT/2]).rotateZ(45).hide();
wallsSolidsRight.subtract(sbox);

