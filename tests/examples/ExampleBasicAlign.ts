const geom = new Geom(); // get the Geometry tool out

geom.layer("base").color('black');
let base = geom.Box(200,200,10);

geom.layer("tower1").color('red');
let b1 = geom.Box(100,100,100).align(base, 'leftbottomback', 'leftbacktop');
let b2 = geom.Box(30,20,100).align(base, 'rightfrontbottom', 'rightfronttop');
let s1 = geom.Sphere(30).align(b2, 'centerbottom', 'rightfronttop');
let s2 = geom.Sphere(60).align(s1, 'centerbottom', 'centertop');
let cyl = geom.Cylinder(40,50).align(s2, 'centerbottom', 'centertop');

geom.layer("tower2").color('red');      
let prevBox = b1;
const COLORS = ['red', 'blue', 'purple','orange', 'pink', 'yellow', 'green'];
for(let size = 100; size > 0; size -= 10)
{
    let color = COLORS[Math.floor(Math.random()*COLORS.length-1)];
    prevBox = geom.Box(size,size,size/2).align(prevBox, 'rightfrontbottom', 'rightfronttop').color(color);

}

