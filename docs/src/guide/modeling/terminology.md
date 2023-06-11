# Model terminology

Let's start by defining what we mean by things:

## Axis

There are 3 main axis of the cartesian coordinate system namely x,y,z.
A position in space is defined by a x, y and z coordinate. Archiyou will always use lowercase letters for Axis!

## Sides

Connected to the main axis of the coordinate system are the 6 sides: *top*,*bottom*,*front*,*back*,*left*,*right*.
There are important to orientate yourself and the model in 3D.

## Points

Points are essential in defining something somewhere in space.

``` js
    point(10,0,0); // origin point
    point([10,0,0]); // you can also use a array to make a point
    point(0); // automatic fills y and z coordinate => point(0,0,0)
    point(0).move(10); // moves a point 10 units to the right
```

## Vectors

These are rudimentary mathematical entities, basically points in space and a magnitude. You can think of them as lines of a certain length pointing somewhere. The most easy way to notate vectors or points is in an array of numbers:


``` js
    vec1 = vector(100,0,0); // a vector instance created with an array
    array = [100,0,0]; // just an array
    vec2 = vector(array); // automatically converted
    print (vec1.length()); // console: 100
    print(vec1.equals(vec2)); // console: true
```

::: warning
Because vertex(..) exists as a function you have to avoid creating variables with that exact name:
```js
    // !! Don't do this:
    vertex = vertex(0,0,0);
    // will give error because vertex() method has been overwritten:
    vert = vertex(100,0,0);
    // !! Avoid vertex() as a variable name and keep it simple:
    v1 = vertex(0,0,0);
    v2 = vertex(100,0,0);
```
:::

Because points/vectors are so essential in modeling you see these 3-coordinate arrays a lot in Archiyou code! ⚠️ Note that a vector or point is not yet a shape (Vertex), so you can't see them. Convert to a Vertex:

``` js
    v = vector(100,0,0); // now you see a point in the scene!
    vertex.toVertex().addToScene();  // convert Vector to Vertex and add to Scene
```
::: tip

Since points are so essential in modeling, Archiyou makes a big effort to interpret any inputs if it expects a point-like

``` js
        p0 = point();
        p1 = point(0); // [0,0,0]
        p2 = point(10,10); // z=0 by default
        v = vector(p); // auto converted to Vector
        v.move(100,100,100); // Vector<[100,100,100]>
        // convert Vector to Vertex (which can be added to scene)
        vertex = v.toVertex().addToScene();
        p = point(vertex); // and back again to Point
```
:::


## Shapes

This is the abstract term to cover all topological primitives (*vertices*, *edges*, *wires*, *faces*, *shells* and *solids*).
The most direct way to create them in Archiyou is just to use their specific classes:

``` js
myVertex = vertex(0,0,0); // a vertex at the origin
print(myVertex.type()); // output: 'Vertex'
myEdge = edge([0,0,0],[100,0,0]); // a horizontal line edge
myFace = face([0,0,0],[100,0,0],[100,100,0]); // a triangle face
// some auto conversions and shorthands for coords
myOtherFace = face(myVertex,[100],[100,100]);
print(myOtherFace.type()); // output: 'Face'
```

But Archiyou also offers direct ways of creating all kinds of specific Shapes:
```js
box(100,20,30); // creates a simple box at [0,0,0]
box(100,100,100, [0,0,10]); // create box at [0,0,10]
sphere();
cylinder();
cone(200,10,300);
```

See more about these primitive Shapes in the section [Constructive Solids Modeling](./csg.md).


## ShapeCollection

A collection of multiple shapes. Archiyou makes it easy to work with collections to treat them a lot like individual Shapes. So you can move a collection the same as a Shape:

``` js
vertex1 = vertex(0,0,0);
vertex2 = vertex(10,10,10);
myCollection = collection(vertex1,vertex2);
// move them all together
myCollection.move(100,0,0); // move the collection of two vertices to 100 units to the right
```

All basic operations like *move*, *rotate*, *extrude* etc work equally for individual shapes as a collection. Of course the operation needs to make sense for a specific Shape.

## Scene

Archiyou has a Scene. This is the collection of all visible Shapes. Most of the time the Shapes you create are automatically added to Scene. There might be times where they are not. You can then do it manually:

``` js
v = vertex(100,100,100); // automatically added to Scene
v.hide(); // hide the vertex
point(10,20,30).toVertex().addToScene(); // force add to scene
```

## Obj(ect)

Archiyou is all about making Shapes, these are the most important and visible entities. To have flexibility in the way Shapes are shown they are actually wrapped inside a *Object* (Obj) container.
Within the *Obj* container Shapes (or a ShapeCollection) are added to the scene and given extra properties like *name*, *visibility* (hide/show) and *style*:

```js
// a Vertex instance is automatically created, wrapped in Obj and added to Scene
v1 = vertex(0,0,10);
// Initiate a vertex by using class. It's not added to Scene
v2 = new Vertex(10,10,10);
v2.addToScene().color('purple'); // Wrap in Obj, add to Scene and color
v2.hide(); // hide Vertex #2
// a blue box (by actually styling the Obj container):
box().color('blue');
```

When you are modeling you probably forget the distinction between a Obj and the Shape and that's totally fine!

::: warning
⚠️ Unlike many other CAD programmes Archiyou has no local coordinate systems for Objects, that means you can not move Objects, only Shapes and the coordinates are always world-coordinates.
:::

## Shape properties and printing

In Archiyou Shapes are all javascript instances. If you want to know properties of a certain Shape, just use the right property or method:

``` js
    v = vertex(10,0,0);
    x = v.x; // the x coordinate = 10
    myLine = line([0,0,0],[100,0,0]);
    length = myLine.length(); // method length returns 100
    print(length); // print the length of the line
```

## Shape Operations

If you want to change a Shape you use an operations. Most operations are methods of that Shape instance. Use code hints (CTRL-SPACE) to see the possibilities in the *Code Editor*.

Also notice that every method in a Shape returns that same Shape so you can chain operations.

``` js
    p = plane(10,20);
    b = p.extrude(100); // that plane is now a box
    // or more elegantly chained:
    myBox = plane(10,20).extrude(100).move(100,0,0);

```

### Operations in place or create new Shape

Doing operations might change the current Shape. Archiyou makes it very simple to control if you want to do this or create a new Shape after the operation. The difference is in the name of the operation: *extrude* or *extruded*.

``` js
    p = plane();
    // There is now only a box in the scene, because it replaced the circle
    p.extrude(100);
    myBox = p.extruded(100);
    // ==> a box is created but the plane object/shape remains in the scene

```
::: warning
⚠️ In the above example the variable *p* still refers to the first plane (not the box), although it is not in the scene anymore. This is because of the structure with Obj containing Shapes. Make sure you work with the right variables!
:::

::: tip
⚠️ Archiyou tries to help you generate Shapes quickly. So making a standard Plane Shape with plane() uses default values and is the same as plane(10,10). The same goes for a lot of other Shapes like box(), sphere(), cone() etc. Watch the auto-complete hints in the editor to see what arguments a function can handle!
:::

## Sub Shapes

Every Shape (apart from a Vertex) consists of rudimentary Shapes. So a Edge contains Vertices. A Wire contains Edges (and thus Vertices). It's easy to get them:

```js
    l = line([0,0,0],[100,0,0]);
    vertices = l.vertices();
    print(vertices); // console ==> ShapeCollection<<Vertex[0,0,0]>,<Vertex[100,0,0]>>
    // these are still references to the vertices in the line edge
    vertices[0].move([0,0,100]); // so this does not work to alter the edge
    // you can extract the vertex
    vertices[0].moved(0,0,100); // make a copy and move

    myBox = box();
    print(myBox.vertices().count()); // console: 8
    print(myBox.edges().count()); // console: 12
    print(myBox.faces().count()); // console: 6
    print(myBox.wires().count()); // console: 6 => the closed wires of the faces

```

::: warning
⚠️ It's quite intuitive (especially in a click interface) to go into a Shape and alter for example one Vertex and have it change the entire Shape. But unfortunately this is not (yet) implemented in Archiyou!
:::


## Miscellaneous

These terms are less important for now or have their own reference page.

* Bounding Box - every Shape has a bounding box. Access it by *Shape*.box() or add to the Scene: *Shape*.bbox().box().addToScene();
* Selectors [TODO] - These are short strings to select specific parts of a Shape
* Parameters [TODO] - To make your models customizable use parameters

That's it for the basics. Let's start with modeling.








