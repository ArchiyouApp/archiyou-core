const brep = new Brep(); // get the Brepetry tool out


Gizmo({ name: 'size', 
axis: 'xy',
position: [50,50,0], 
domains: [0,100], 
toParams: { x : 'width', y : 'depth'}
});


Gizmo({ name: 'giz', 
axis: 'z',
position: [50,50,50], 
domains: [0,100], 
toParams: 'height' });


brep.RectBetween([0,0,0], [1+$width,1+$depth,0]).extrude($height+1);
