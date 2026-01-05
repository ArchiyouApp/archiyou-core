const brep = new Brep(); // get the Brepetry tool out

let box = brep.Box(200,200,200);

for (let c = 0; c < 20; c++)
{
    let x = Math.random()*200-100;
    let y = Math.random()*200-100;
    let z = Math.random()*200-100;
    let size = Math.random()*70;
    let curSphere = brep.Sphere(size).move([x,y,z]);
    box.cut(curSphere.hide());
}

box.move([0,0,100]);
