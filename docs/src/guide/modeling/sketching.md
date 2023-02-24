# Sketching

Two dimensions are easier to work with than three; That's why there is *2D Sketching*. This modeling method starts from 2D planes, most of the time base planes like front, top or left and start to draw basic Shapes on it. Either linear Shapes like lines and arcs (or as we like to call them: *Edges*), or closed shapes like rectangles or circles (a.k.a. *Faces*). 

::: warning
Archiyou alpha still needs a lot of improvements to the Sketcher
:::

## A simple example

Let's just jump in with a very simple example:

![A very simple sketch](/modeling_sketching_simple.png)

```js
sketch('front')
    .lineTo(100,0)
    .lineTo('+0','+100')
    .close()
    .moveTo(50,25)
    .circle(10)
    .importSketch();
```

😎 a triangle with a hole! Some things that are happening here:

* sketch(*plane*) - Starting a Sketch on certain plane. For now it's pretty simple. Choose any of these: *front*,*back*,*left*,*right*,*top*,*bottom*.
* .lineTo(100,0) - Draw a line from current cursor (default: [0,0]) to point [100,0]
* .lineTo('+0','+100') - Draw a line from cursor ([100,0]) to Point that +0 units on x and +100 on y-axis further. Relative coordinates!
* .close() - Closes the Shape, thus creating a triangle Face
* .moveTo(50,25) - Move cursor to point [50,25]
* .circle(10) - Draw a little circle which is subtracted from triangle
* .importSketch() - Import Shape from Sketch into Scene (in layer with name '*sketchN*')

Let's zoom out and explain what is really going on behind the Scene when you use the Sketcher:

* 〰⬛*Making Edges or Faces* - You are always either making 2D Edges or closed 2D flat Faces. They sometimes have slightly different *operations*. They can be used together (our triangle became a Face when we used *close()*), but currently these interactions are not fully developed
* 👆 *Cursors*: Most of the time you do that from the previous position of a Shape. This is called the *cursor* (like with a text editor!). The cursor is updated automatically based on the last Shape added. You can also move the cursor manually by using *moveTo(x,y)*
* ⏳ *Speed* : Cursors give you speed: You only have to supply the target point(s)

```js
  // in 3D:
  line([0,0,0],[100,100,0])
  // Sketching in 2D:
  sketch('top')
    .lineTo([100,100]); // with cursor starting at [0,0]
    .importSketch()
```

* 📐 *Points* made easy - So much points in code CAD! 😰 Archiyou tries to make it simple with numerous ways to define Points with coordinates. See below for overview.
* 🔨 *Operations* - The Sketcher can change active Shapes with different operations. Like *mirror*, *thicken*, *chamfer* and *fillet*.

## Overview of Coordinate types

| type coordinate      | format                    | example       | explanation                                       |
|----------------------|---------------------------|---------------|---------------------------------------------------|
| absolute             | [x,y]                     | [100,200]     |                                                   |
| short absolute       | [x]                       | [200]         | equals [200,0]                                    |
| relative (to cursor) | ['+/-x', '+/-y']          | ['+0', '+50'] | offset from current cursor point                  |
| polar (from cursor)  | [{{distance}}<{{angle}}]  | ['100<45']    | offset from cursor by distance and angle          |
| polar relative angle (from cursor) | [{{distance}}<<{{angle}}] | ['200<<90']   | offset from cursor by distance and relative angle |


## Advanced Sketch with *Edges* and different coordinates

![Christmas tree Sketch](/modeling_sketching_christmastree.png)

```js
// A simple 2D christmas tree with all kinds of coordinate types
sketch('left')
    .lineTo(20)
    .lineTo('20<<90')
    .lineTo('+100', '+0')
    .lineTo('100<<135')
    .lineTo('+50','+0')
    .lineTo('80<<135')
    .lineTo('+40','+0')
    .lineTo(0,'+100')
    .mirror() // mirror in line with origin [0,0] and direction [0,1]
    .close()
    .importSketch();
```

::: tip
The above would also be good to make completely algorithmic ! 
:::

## Different Edge types

For simplicity we stuck to straight Line Edges, but let's do something even more festive! 🍷:

```js
profile = sketch('front')
   .lineTo('+50')
   .lineTo('45<<160')
   .splineTo(['+10','+20'],['-10','+20'],['+10','+20'],['-10','+20']) // a Spline
   .arcTo(['+30','+10'],['+50','+40']) // Make an Arc
   .importSketch();

// make the glass by revolving the profile
glass = profile.revolved().move(200).color('red');
```

![Glass Sketch](/sketching_edges_advanced.png)

## Sketching Faces

A lot of the time you are using the Sketcher to accurately create *profiles*, *sections* or *spines* and then using them as input for operations like *extrude*, *loft*, *resolve* or *sweep* to create Solid Shapes (see section [Modeling with Topology Primitives: Operations](./topology.md#operations-extruding-sweeping-lofting) ).
Other times you want to quickly model a machine cover lid or screw plates; Then you'll naturally use the Faces part of the Sketcher, which is involved in creating simple closes shapes and cutting holes in them. 

🔨 Let's do something simple: 

![Sketching some kind of plate with holes](/modeling_sketching_faces_simple.png)

```js
plate = sketch('front') // start on front plane
    .rect(200,100) // make rectangle (width=200,height=100) at current cursor ([0,0,0])
    .circle(30) // make circle (radius=30) - automatically cut
    .moveTo('+100') // move cursor to the right
    .circle(30) // make another circle ...
    // because it not entirely inside the rectangle it's added
    .circle(10) // this circle is cut because it entirely in the active shape
    .importSketch() // import into scene as always
    .color('blue');
```


All the features of the Edges API (*cursors*, *different kind of coordinates*) are here, but there are some differences:

* ◰ ▣ *Automatic cutting or adding* - If the new Shape is entirely inside the previous one it's cut automatically, otherwise it's added to current shape
* 🛠 *More focus on operations afterwards*  - You are using primitive 2D shapes mostly (a bit like in 3D with [Constructive Solid Geometry Modeling](./csg.md)) and then using operations like *move*, *fillet* and *chamfer* (see below)


## Operations

Both the Edges and Faces API have operations that you can apply while making Shapes or after creation. The most important are: *mirror*, *fillet*, *chamfer* and *offset*. More operations are probably coming ⌚.

| operation | description                                             | for edge API | for faces API | example                                                                                                                                             |
|-----------|---------------------------------------------------------|--------------|---------------|-----------------------------------------------------------------------------------------------------------------------------------------------------|
| mirror    | mirror pending shapes in mirror line (start,end)        | yes          | yes           | sketch('front').lineTo(100,100).mirror([0,0],[0,1]).importSketch()                                                                                  |
| fillet    | round (specific or all) corners                         | yes          | yes           | sketch('right').lineTo(100).fillet(20).lineTo('+0','+100').importSketch() sketch('left').rect(20,20).select('V\|\|right').fillet(10).importSketch() |
| chamfer   | add 45 degrees edge at corners                          | yes          | yes           | sketch('left').rect(20,20).select('V\|\|topright').chamfer(5).importSketch()                                                                        |
| offset    | Make pending Shape bigger(+amount) or smaller (-amount) | yes          | yes           | sketch('right').lineTo(20,20).lineTo('100<<90').offsetted(-10).importSketch().color('blue')                                                         |
| offsetted | Make pending Shape bigger  or smaller but make copy     | yes          | yes           |                                                                                                                                                     |
| thicken   | Thicken pending Shape                                   | yes          | not yet       | sketch('right').lineTo(100).fillet(20).lineTo('+0','+100').thickened(5).importSketch().color('blue')                                                |
| thickened | Thicken pending Shape but make copy                     | yes          | not yet       |                                                                                                                                                     |


⚠ Please note that for the Edge API the operations are defined before the last operant. With the Faces API is after a Shape is added.

This is an example for creating Edges and doing operations:

![Operation with Sketch Edge API](/modeling_sketch_operations.png)

```js
sketch('front')
    .lineTo(100)
    .fillet(10) // make fillet between previous and coming line
    .lineTo('+0','+100')
    .fillet(30)
    .lineTo('-100', '-40')
    .mirror() // mirror (by default in line [0,0]-[0,1])
    .close()
    .importSketch()
    .color('blue');
```

Here is an example for the Faces API:

```js
sketch('front')
    .rect(100,50)
    .select('V||lefttop') // select vertex for filleting
    .fillet(10) // do fillet
    .select('V||rightbottom') // same for chamfer
    .chamfer(10)
    .circle(10)
    .importSketch().color('red');
```

![Operation with Sketch Edge API](/modeling_sketch_face_operations.png)

::: warning
Operations in the Sketcher are still somewhat limited. If you need something more we suggest working in 3D for now!
:::

## Advanced: Temporary shapes and multiple cursors

Archiyou is inspired by [CadQuery](https://github.com/CadQuery/) that features a very powerful Sketch API that can do multiple things at the same time, while sometimes loosing some readability. 
We are working on a good balance. 

Here is an example of using vertices of a temporary offsetted shape as cursors so that we can add screw holes on a plate very quickly:

```js
sketch('front')
.rect(100,50)
.fillet(3) // round outside corners
.offsetted(-10) // offset 10 units inside
.isTemp() // make offsetted temporary
.atVertices() // set current vertices as cursors
.circle(5) // draw circle at every cursor
.importSketch()
.color('blue')
```
![Multicursor Sketch](/modeling_sketch_multicursor.png)

## Overview of Sketch methods

See API documentation

























