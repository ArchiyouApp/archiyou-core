# Access parts of your model

## Shape and ShapeCollections

Accessing Shapes is done mostly by using variables. In the future we might add more easy ways to access certain Shapes in the Scene. 
ShapeCollections already have a variety of ways to select Shapes within:

```js
c = collection(box(),sphere(),vertex(10,10,0));
print(c.count()); // 3
print(c.length); // same as above: 3
print(c[0]); // Solid::Box
print(c.at(1)); // Solid::Sphere
solids = c.getShapesByType('Solid'); // ShapeCollection<[box,sphere]>
```

## Subshapes

There is a huge variety of 3D shapes but in essence all consist of *Vertices*, *Edges*, *Wires*, *Faces*, *Shells* and *Solids*. And even better; an Edge is nothing more than a linear Shape between two Vertices. A Wire a sequence of Edges, a Face the surface bound by a closed Wire and so on. See more on these *Topology* entities in section [Modeling with Topology primivites](../modeling/topology.md).

So any Shape is just some configuration of the Topology primitives and can be accessed as such:

```js
b = box(50); // a box of size 50
print(b.vertices()); // ShapeCollection with 8 Vertices
print(b.edges()); // ShapeCollection with 12 Line Edges
print(b.wires()); // ShapeCollection with 6 Closed Wires
print(b.shells()); // ShapeCollection with 1 Shell
print(b.solids()); // ShapeCollection with 1 Solid
// to copy and move first face from Box (see ShapeCollection above)
b.faces()[0].moved(-200);
// add a sphere to all Vertices of box
// forEach iterates over all Vertices in collection
b.vertices().forEach( v => sphere(5,v)); 
```
![Accessing Subshapes](/modeling_access_subshapes.png)

Accessing all subshapes of a type as a ShapeCollection is one thing, but for a lot of detailed modeling you need to select more specifically. This is where Selectors come in. 

## Selectors

### Basics

With selectors you can select subshapes based on specific conditions. You start a selection on a Shape with the *select('{{SELECTION_STRING}})* method. 
The selection string contains a reference to the type of subshape you are looking for, a operator and a value. For example:

```js
b = box(200,100,20); // just a simple box
b.select('F||top').moved(0,0,10); // select and move top face
b.select('E||leftfront').moved(-10,0,0); // select and move leftfront edge
b.select('V||toprightfront').moved(0,0,20); // select and move vertex on toprightfront
b.select('V||rightfronttop').moved(0,0,30); // order of side combinations does not matter!
// select always returns a ShapeCollection:
print(b.select('V||rightfronttop').type()); // ShapeCollection
// No results: a ShapeCollection with 0 Shapes is returned
print(b.select('E|[1,1,1]').length); // Console: 0
```

If a select(..) does not yield any results a warning is given in the console (under warning tab).

::: tip
Combining selector strings is also possible: 
```js
box(100).shell(-5,'F||top and F||front');
```
:::

### Overview

Archiyou currently offers the following Selectors:

| name | format | examples | notes
| ------ | ------ | ------ | ------ |
| index | `{SHAPE}[{INDEX_OR_RANGE}]` | `box().select('E[1]') or plane().select('V[0,2]') or box().select('V[0-4]')`
| on side | `{SHAPE}||{SIDE}` | `box().select('F||front') or box().select('V||frontrightbottom')`
| parallel to | `{SHAPE}|{AXIS} or {SHAPE}|{POINT}` | `box().select('E|Z') or box().select('E|[0,0,1]')`
| at coord | `{SHAPE}@{AXIS}={COORD} or {SHAPE}@{AXIS}={COORD}~{TOLERANCE}` | `box(100).select('V@X=50') or box(100).select('V@X=45~5')`
| in bbox| `{SHAPE}@B{POINT,POINT}` | `box(100).select('V@B[0,0,0][100,100,100]')` | Shapes need to be fully in bbox 
| ofsubtype | `{SHAPE}:{SUBTYPE}>` | `cylinder(30,80).select('E:Line') or cylinder(30,80).select('E:Circle')`
| closest | `{SHAPE}<<->{POINT}` | `box(100).select('V<<->[500,0,0]')`
| furthest| `{SHAPE}<->>{AXIS}` | `box(100).select('V<->>[500,0,0]')`
| heighest coord along axis | `{SHAPE}>>{AXIS}` | `box(100).select('F>>X')`
| smallest coord along axis | `{SHAPE}<<{AXIS}` | `box(100).select('F<<X')`
| in range | `{SHAPE}<->{POINT}<{RANGE}` | `box(100).select('V<->[50,50,50]<10')`
| positive | `{SHAPE}+{AXIS}` | `box().select('E+X')`
| negative | `{SHAPE-{AXIS}` | `box().select('V-Z')`

More Selectors will probably be added later. 

### Combining Selectors

TODO

## Properties and Conversions

Every Shape comes with its own properties and conversions. See more examples in the API reference.

Here are some examples:

```js
arc([0,0],[100,100],[200,0]).populated(10); // Generate 10 vertices from Arc Edge
line([0,0,0],[100,100,100]).middle(); // Point<50,50,50>
// Get direction/tangent of Arc at [100,100] => [1,0,0]
arc([0,0],[100,100],[200,0]).directionAt([100,100]); 
// Get center of Solid (Point) and make into a Vertex
box().center().toVertex().addToScene().color('red'); 
```

Now that we get a grip on modeling terminology, can manage topology Shapes and access subshapes; Let's jump into real modeling!