const geom = new Geom(); // get the Geometry tool out

// units in m

let top = [100,100,200];
let frontLeft = geom.Wire().fromVertices([[0,100,0],[0,0,0],[100,0,0]]);
let right = geom.Wire().fromVertices([[100,0,0],[100,100,0]]);
let back = geom.Wire().fromVertices([[100,100,0],[0,100,0]]);
let sideCurve = geom.Edge().makeSpline([[100,0,0],[100,50,30],top]);

let roofSurface = frontLeft.lofted(sideCurve).addToScene().hide();
let rightSurface = right.lofted(sideCurve).addToScene();
let backSurface = back.lofted(new Vector().fromAll(top).toVertex()).addToScene();
let bottom = geom.Plane(100,100).move([50,50,0]);

let solid = new Solid().fromShells([new Shell().fromFaces([roofSurface,rightSurface,backSurface,bottom])]).addToScene();
let court = geom.Box(70,40,300).move([50,50,0]).hide();
solid.subtract(court);
