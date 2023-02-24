const geom = new Geom(); // get the Geometry tool out

geom.layer("original").color('blue');
let box = geom.Box(30,20,10);
let rect = geom.Rect([0,0,0],[30,10,0]);

geom.layer("align geometry").color('orange');

let face = geom.Face().fromVertices(
    [[0,0,0],[100,0,100],[100,100,200]])
    .rotateZ($ANGLE, [0,0,0]);

let line = geom.Line([0,0,0],[100,100,0]).rotateZ($ANGLE, [0,0,0]);

geom.layer("aligned").color('red');

box.copy().color('red').addToScene().alignByPoints(
    ['leftbottomfront', 'rightbottomfront', 'rightbottomback'],
    [ face.vertices()[1],face.vertices()[2], face.vertices()[0] ]
    ); 
    
rect.copy().addToScene()
    .alignByPoints(
        ['leftfrontbottom', 'rightfrontbottom'],
        [line.end(), line.end().toVector().add(line.direction())]);
