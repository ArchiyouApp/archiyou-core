const brep = new Brep(); // get the Brepetry tool out

brep.layer("base").color('black');
let base = brep.Box(200,200,10);

brep.layer("tower1").color('red');
let b1 = brep.Box(100,100,100).align(base, 'leftbottomback', 'leftbacktop');
let b2 = brep.Box(30,20,100).align(base, 'rightfrontbottom', 'rightfronttop');
let s1 = brep.Sphere(30).align(b2, 'centerbottom', 'rightfronttop');
let s2 = brep.Sphere(60).align(s1, 'centerbottom', 'centertop');
let cyl = brep.Cylinder(40,50).align(s2, 'centerbottom', 'centertop');

brep.layer("tower2").color('red');      
let prevBox = b1;
const COLORS = ['red', 'blue', 'purple','orange', 'pink', 'yellow', 'green'];
for(let size = 100; size > 0; size -= 10)
{
    let color = COLORS[Math.floor(Math.random()*COLORS.length-1)];
    prevBox = brep.Box(size,size,size/2).align(prevBox, 'rightfrontbottom', 'rightfronttop').color(color);

}

