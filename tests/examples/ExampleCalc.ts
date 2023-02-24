const geom = new Geom(); // get the Geometry tool out

geom.layer("lines").color('red');

let lastPosition = new Vector(0,0,0);
let totalLength = 0;

for ( let l = 0; l < 20; l++)
{
    let isHorizonalRandom = Math.round(Math.random());
    let randomLineLength = Math.round(Math.random()*500);

    totalLength += randomLineLength; // to check
    
    // now make the line
    let newLine = (isHorizonalRandom > 0.5) 
        ? geom.Line(lastPosition, 
            lastPosition.added([randomLineLength,0,0])
            ).color('blue') 
        : 
        newLine = geom.Line(lastPosition, 
            lastPosition.added([0,randomLineLength,0])
        );

    lastPosition = newLine.end().toVector();
};

print(`Length: ${totalLength}`); // Output total length in the console. Check in the table "group_edge_length" that it's the same!

calc.init(); // needed to gather data
calc.db.shapes.filter('length > 5').save("filter_test");
calc.db.shapes.groupBy("type", ["sum"], ["length"]).save("group_edge_length");
calc.metrics('group_edge_length', { length_sum : { label: 'Total Length', 'unit' : 'cm' }})