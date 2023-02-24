const geom = new Geom(); // get the Geometry tool out

let box = geom.Box(200,200,200);

for (let c = 0; c < 20; c++)
{
    let x = Math.random()*200-100;
    let y = Math.random()*200-100;
    let z = Math.random()*200-100;
    let size = Math.random()*70;
    let curSphere = geom.Sphere(size).move([x,y,z]);
    box.cut(curSphere.hide());
}

box.move([0,0,100]);
