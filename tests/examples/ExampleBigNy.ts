const brep = new Brep(); // get the Brepetry tool out

// units in m

let top = [100,100,200];
let frontLeft = brep.Wire().fromVertices([[0,100,0],[0,0,0],[100,0,0]]);
let right = brep.Wire().fromVertices([[100,0,0],[100,100,0]]);
let back = brep.Wire().fromVertices([[100,100,0],[0,100,0]]);
let sideCurve = brep.Edge().makeSpline([[100,0,0],[100,50,30],top]);

let roofSurface = frontLeft.lofted(sideCurve).addToScene().hide();
let rightSurface = right.lofted(sideCurve).addToScene();
let backSurface = back.lofted(new Vector().fromAll(top).toVertex()).addToScene();
let bottom = brep.Plane(100,100).move([50,50,0]);

let solid = new Solid().fromShells([new Shell().fromFaces([roofSurface,rightSurface,backSurface,bottom])]).addToScene();
let court = brep.Box(70,40,300).move([50,50,0]).hide();
solid.subtract(court);
