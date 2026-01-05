const brep = new Brep(); // get the Brepetry tool out

let WALL_WIDTH = 40;

brep.layer("walls").color('black'); 
let wallLeft = brep.RectBetween([0,0,0],[-WALL_WIDTH,$WALL_HEIGHT, 0]);
let wallRight = brep.RectBetween([$HOUSE_WIDTH,0,0],[$HOUSE_WIDTH+WALL_WIDTH,$WALL_HEIGHT, 0]);

brep.layer("constructionlines").color('red'); //.dashed();
let top = new Vector($HOUSE_WIDTH/2,$WALL_HEIGHT+$ROOF_HEIGHT,0);

// roof construction lines
let roofLineLeft = brep.Line([0,$WALL_HEIGHT,0], top); // left roof
let roofLineRight = brep.Line([$HOUSE_WIDTH,$WALL_HEIGHT,0], top); // right roof

let portalRoofSupportLeftPnt = roofLineLeft.populated(4).at(1).addToScene();
let portalRoofSupportRightPnt = roofLineRight.populated(4).at(1).addToScene();
let portalRoofSupportTopLeftPnt = roofLineLeft.populated(4).at(2).addToScene();
let portalRoofSupportTopRightPnt = roofLineRight.populated(4).at(2).addToScene();

// support construction lines 
let portalRoofSupportLeft = brep.Line([-30,$WALL_HEIGHT/3, 0], portalRoofSupportLeftPnt);
let portalRoofSupportRight = brep.Line([$HOUSE_WIDTH+30,$WALL_HEIGHT/3, 0], portalRoofSupportRightPnt);

// horizontal support from walls
let portalLeftFromWallPnt = new Edge().makeLine([0,$WALL_HEIGHT,0], [$HOUSE_WIDTH,$WALL_HEIGHT,0])
        .intersection(portalRoofSupportLeft).addToScene();
let portalLeftFromWall = brep.Line([0,$WALL_HEIGHT,0],portalLeftFromWallPnt);
let portalRightFromWallPnt = new Edge().makeLine([$HOUSE_WIDTH,$WALL_HEIGHT,0], [0,$WALL_HEIGHT,0])
        .intersection(portalRoofSupportRight).addToScene();
let portalRightFromWall = brep.Line([$HOUSE_WIDTH, $WALL_HEIGHT, 0],portalRightFromWallPnt);

// top support
let portalSpan = brep.Line(portalRoofSupportLeftPnt, portalRoofSupportRightPnt);
let centerBeamLine = brep.Line(top,portalSpan.center());
let portalRoofSupportTopLeft = brep.Line(portalRoofSupportTopLeftPnt, portalSpan.center().move([0,40,0]) );
let portalRoofSupportTopRight = brep.Line(portalRoofSupportTopRightPnt, portalSpan.center().move([0,40,0]) );

// make beams
brep.layer("portalbeams").color('blue');

let portalLateralLeft = portalLeftFromWall.extend(30).thickened(40, 'front').addToScene();
let portalLateralRight = portalRightFromWall.extend(30).thickened(40, 'front').addToScene();

let centerBeam = centerBeamLine.extended(20).thickened(20).addToScene();

// portal roof beams
let portalRoofLeft = roofLineLeft.thickened(30,'front')
    .capped([portalLateralLeft, centerBeam]).addToScene();
let portalRoofRight = roofLineRight.thickened(30,'front')
    .capped([portalLateralRight, centerBeam]).addToScene();
// diagonal supports from wall
let portalSupportLeft = portalRoofSupportLeft.thickened(30, 'right')
    .capped([portalRoofLeft,wallLeft]).addToScene();
let portalSupportRight = portalRoofSupportRight.thickened(30, 'left')
    .capped([portalRoofRight, wallRight]).addToScene();

let portalHorizontalBeam = portalSpan.thickened(30).capped([roofLineLeft, roofLineRight]).addToScene();

let topSupportLeft = portalRoofSupportTopLeft.thickened(15)
.capped([portalRoofLeft, centerBeam]).addToScene();
let topSupportRight = portalRoofSupportTopRight.thickened(15)
.capped([portalRoofRight, centerBeam]).addToScene();

// roof purlins
const PURLIN_WIDTH = 25;
const PURLIN_HEIGHT = 25;
let purlinLeft1 = brep.Plane(PURLIN_WIDTH, PURLIN_HEIGHT);
purlinLeft1.alignByPoints(['front','frontright'],
        [portalRoofSupportLeftPnt, roofLineLeft.end()]);
let purlinLeft2 = brep.Plane(PURLIN_WIDTH, PURLIN_HEIGHT)
    .alignByPoints(['front','frontright'],
        [portalRoofSupportTopLeftPnt, roofLineLeft.end()]).addToScene();

let purlinRight1 = brep.Plane(PURLIN_WIDTH, PURLIN_HEIGHT);
purlinRight1.alignByPoints(['front','frontleft'],
        [portalRoofSupportRightPnt, roofLineRight.end()]);
        
let purlinRight2 = brep.Plane(PURLIN_WIDTH, PURLIN_HEIGHT)
    .alignByPoints(['front','frontleft'],
        [portalRoofSupportTopRightPnt, roofLineRight.end()]).addToScene();

