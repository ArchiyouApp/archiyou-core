# Constructive Solid Geometry Modeling

Constructuve Solid Geometry Modeling (CSG) is probably the most intuitive way of modeling. You start with primitive 3D shapes like a box, cylinder, sphere, cone and just place and then add them together in some ways to create more complex shapes.

## Making primitive shapes and position them

Archiyou offers some basic 3D shapes. Here are some examples:

![Constructive Solid Modeling Primities](/modeling_csg_primitives.png)
cd do
```js
plane();
box(100,50,120,[150,0,0]);
sphere(50, [300,0,0]);
cylinder(50, 100).move(450);
cone(50,20,100).move(600);
circle(50).moveTo(800).move(-50); // absolute and relative coords
```

As you notice in the code are multiple ways to create and position them:

* The simplest is just calling their methods without any parameters: *box()*, *sphere()*. This is inspired by [Blender](https://blender.org) and is handy to quickly get some shapes.
* All Shapes can by moved by using *Shape*.move(). You can use absolute coordinates (numbers) or relative ones ('+100','-50)
* Define your shapes directly by adding parameters. Every method first has its basic parameters (like *width* and *depth* for a Plane) and its starting position

## Basic transformations

After you got your primitive shapes into the Scene, let's do some transformations:

![Constructive Solid Modeling Transformations](/modeling_csg_transformations.png)

Here is the code without the styling. See if you can connect the statements with the above shown shape. 

```js
b1 = box(100,50,120);
// move 100 units on x-axis
b2 = b.copy().move('+200'); 
// rotate 45 deg around local z-axis
b3 = b2.copy().rotateZ(45);
// rotate back 45 deg and rotate around z-axis
b4 = b3.copy().rotateZ(-45).rotateZ(90, [0,0,0]);
```

An overview of basic transformations:

| transformation | arguments                     | description                                                                     | example                                          |
|----------------|-------------------------------|---------------------------------------------------------------------------------|--------------------------------------------------|
| move()         | x,y,z                         | move shape a given vector                                                                   | myBox.move(100,0,0)                              |
| moved()        | x,y,z                         | copy and move                                                                   | myBox.moved('+100','+50',200)                    |
| moveTo()       | x,y,z                         | move to point in absolute coordinates                                           |                                                  | 
| copy()         |                               | copy                                                                            |                                                  |
| rotateX()      | degrees, [pivot]              | rotate shape around X axis with pivot in the center of the Shape or given pivot | myBox.rotateX(45) or myBox.rotateX(45,[100,0,0]) |
| rotateY()      | degrees, [pivot]              | same but around Y axis                                                          |                                                  |
| rotateZ()      | degrees, [pivot]              | same but around Z axis                                                          |                                                  |
| scale()        | factor                        | Scale shape by a given factor (< 1 is smaller, > 1 is bigger )                  | myBox.scale(2) or myBox.scale(0.5)               |
| scaled()       | factor                        | Copy and Scale                                                                  |                                                  |

## Combining Shapes: Union, Subtract and Intersection

Once you have created primitive Shapes (*box()*, *sphere()*, *place()*) and position them correctly (*move()*,*rotate*,*scale*) it time to start combining them.
These *Boolean* operations are simple:

* *Shape.add(other*) - Add Shape and *other* together
* *Shape.subtract(other)* - Subtract *other* from Shape
* *Shape.intersect(other)* - Make new Shapes from the intersections of *Shape* and *other* shape

As always the *-ed* versions of the operations create a new Shape without touching the previous one: *added()*, *subtracted()*, *intersected()*. 
See this overview:

![Constructive Solid Geometry Modeling](/modeling_csg_booleans.png)

```js
// Making Boolean Shapes
b = box();
s = sphere(30).move(30,-30,30);

b.added(s).move(100,0,100); // Add
b.subtracted(s).move(100); // Subtract
b.intersection(s).move(100,0,-100); // Intersection
```

### Boolean operations overview

Here is a overview of current boolean operations:

| boolean operation | alias                         | notes                                      |
|-------------------|-------------------------------|--------------------------------------------|
| add               | fuse union combine merged     | replaces Shape                             |
| added             | fused unioned combined merged | creates new Shape                          |
| subtract          |                               | replaces Shape                             |
| subtracted        |                               | creates new Shape                          |
| intersect         |                               | first Shape of possible more intersections |
| intersected       |                               |                                            |
| intersections     |                               | Get all intersections as ShapeCollection   |
| split             |                               | Split Shape by other and replace current   |
| splitted          |                               | Split Shape by other and make copy         |

## Finishes: Fillet and chamfer

After you created a nice combined shape out of multiple shapes and boolean operations you are ready for the last part of CSG: Finishing with fillet and chamfers. These are rounded or straight Edge details and are used both for esthetical and functional purposes. While using fillet and chamfer operations it's essential to be able to select the right part of the Shape by using *Selectors*. So check out the section [Accessing parts of your model](./model-access.md).

### Fillets

Fillets are rounded corners of specified Edges:

![Examples of a simple filleted box](/modeling_csg_finishes_fillets.png)

```js
// Filleting example
b = box().color('blue');

b.filleted(10).move(70); // by default fillet all edges
b.filleted(10, 'E||top').move(140); // use a selection string to select top edges
b.filleted(10, 'V||top').move(210); // although filleting works with Edges ...
// you can select Vertices too, then related Edges will be selected automatically 
```

### Chamfers 

Chamfers are extra surfaces that are added at Edges - mostly at a angle of 45 degrees - so that edges and corners become less sharp and nicely accentuated.

![Examples of a simple filleted box](/modeling_csg_finishes_chamfers.png)

```js
// Chamfer example
b = box(50).color('blue');

b.chamfered(10).move(70); // by default chamfer all edges
b.chamfered(20, b.edges().first()).move(140); // you can supply some edge too!
b.chamfered(5, 'V||toprightfront').move(210); // supply a Vertex Selector String
```

## Alignments

When dealing with multiple Shapes - which is quite ofter in CSG - alignments are handy to position shapes in relation to each other! An example:

![Constructive Solid Modeling Transformations](/modeling_csg_alignments.png)

```js
// Let's stack some solids:
b = box();
c = cylinder(25,50);
s = sphere(25);
sb = box(10);

// you can use any combinations of sides:
// left/right, top/bottom, front/back and center
c.align(b, 'bottom', 'top'); // is basically topcentercenter
s.align(c, 'bottom', 'topfront');
sb.align(s, 'bottomfrontleft', 'top' );
```

Because we are aligning by using the bounding box anyways you can also align by giving an array of percentage coordinates. [0,0,0] is a point most left back and bottom. [1.0,1.0,1.0] is the maximum point of the bounding box.
Here we align a Vertex at 80% of the height of a box:

![Constructive Solid Modeling Transformations](/modeling_csg_alignment_perc.png)

```js
b1 = box(100);
v = vertex(0,0,0).color('red');
v.align(b1,'center', [0.5,0.5,0.8])
```

There is also *Shape*.alignByPoints(). Have a look at the API reference for more handy alignment methods!

## Making shapes hollow: Shell

When you want to create a hollow shape, for example for 3d printing boxes and vases: Shape.*shell()* is very important. 
Here is an example:

![Shelling](/modeling_csg_shelling.png)

```js
// Shelling Example
// make a box hollow
box(100).shell(5).move(0,0,100);
// hollow box with open top
box(100).shell(5, 'F||top').move(150,0,100);
// hollow box with open front and straight edges
// NOTE: straight edge shell() is ofter less robust
box(100).shell(5, 'F||front', 'intersection').move(300,0,100);
```


## More

More documentation is coming up on the following features:

* Shape.*offset()*
* Shape.*thicken()*
* Shape.*split()*

## Advanced example

![Constructive Solid Geometry Modeling Bracket Example](/modeling_csg_bracket.png)

```js
// Constructive Solid Geometry Modeling Example
// Make primitive Shapes and position them
bv = box(100,30).move(0,0,50);
bh = box(20,150, 50).move(0,0,50);
c = cylinder(10,50).rotateY(90).move(0,-50,-25).move(0,0,50);
// Do boolean operations
bracket = bv.added(bh).subtract(c).move(150);
// Make finishes
bracket.chamfer(2, 'E:circle' ); // Subshape type selector (Circle Edge)
bracket.fillet(20, 'E[4,18,32,34]'); // click on edge in viewer to get index

```



















