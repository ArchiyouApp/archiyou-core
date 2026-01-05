const brep = new Brep(); // get the Brepetry tool out

//// PARAMS ////
// in mm
const VASE_HEIGHT = $VASE_HEIGHT || 200;
const VASE_NUM_POINTS = 30;
const VASE_TOP_RADIUS = 70; 
const VASE_MIDDLE_RADIUS = $VASE_MIDDLE_RADIUS || 100;
const VASE_MIDDLE_PERC = 0.5;
const VASE_BOTTOM_RADIUS = 120;
const VASE_BOTTOM_PERC = 0.3;
const VASE_BASE_RADIUS = 80;

//// PARAM CHECKS ////
VASE_NUM_POINTS = (VASE_NUM_POINTS %2 == 0) ? VASE_NUM_POINTS+1 : VASE_NUM_POINTS;
 
let topCircle = brep.Circle(VASE_TOP_RADIUS).move([0,0,VASE_HEIGHT]).hide().toWire();
let middleCircle = brep.Circle(VASE_MIDDLE_RADIUS).move([0,0,VASE_HEIGHT*VASE_MIDDLE_PERC]).hide().toWire();
let bottomCircle = brep.Circle(VASE_BOTTOM_RADIUS).move([0,0,VASE_HEIGHT*VASE_BOTTOM_PERC]).hide().toWire();
let baseCircle = brep.Circle(VASE_BASE_RADIUS).move([0,0,0]).toWire();

let topCircleBasePoints = topCircle.populated(VASE_NUM_POINTS).addToScene();

const TOP_OFFSET_RANGE = 40;
const TOP_OFFSET_MIN = 5;
const RANDOM_OFFSET = false;

let topCircleContourPoints = new ShapeCollection();
topCircleBasePoints.toArray().forEach( (vertex,index) =>  
{ // NOTE: now a array, will be shapecollection
    if (index %2 == 1) // uneven
    {   
        let radiusOffsetVec = vertex.toVector().normalize();
        radiusOffsetVec.z = 0;
        
        if (RANDOM_OFFSET){
            let offset = Math.random()*TOP_OFFSET_RANGE+TOP_OFFSET_MIN;
        }
        else {
            let offset = TOP_OFFSET_MIN + TOP_OFFSET_RANGE;
        }
        newVertex = vertex.moved(radiusOffsetVec.scaled(offset));
    }
    else {
        newVertex = vertex;
    }
    topCircleContourPoints.add(newVertex);
})
topCircleContourPoints = new ShapeCollection(topCircleContourPoints);
let topCircleContour = new Wire().fromVertices(topCircleContourPoints).addToScene().color('yellow').close();

let vase = topCircleContour.lofted([middleCircle,bottomCircle, baseCircle], false).addToScene();
//vase.shelled(-5, vase.select('F||top')).addToScene(); // Takes too long and crashes