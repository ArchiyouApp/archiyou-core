# Organize your model

While working with increasingly complex models it becomes important to organize it in different ways. Archiyou offers different methods to do this.

* Components: You can make a model by combining different scripts/models as components. For example a table can consist of a table top component with 4 leg components.
* Layers: You can group different parts of a model
* ShapeCollection: You can put related Shapes in a collection
* Styling and visibility: Visually distinguish between parts of a model or hide/show them
* Variables and naming

## Components

Bricks, tree branches, screws, windows, braquets; Most of the physical world can be intepretated as components, that themselves can consist of other components. Components enable great flexibility while maximizing re-use of smart solutions, especially when they are *parametric*. This is very important for Archiyou (see: [What and why Archiyou](../introduction/why-archiyou.md)).

With Archiyou you can import a (parametric) script/model as a component and use it in another. When you start off in Archiyou code editor this might not be the first thing you do, but if your project grows this might become essential. You can also import shared components by others to quick-start your own modeling.

![Import components](/import_components.png)

## Layers

Like a lot of other CAD application Archiyou offers a (simple) layer system. It works by declaring the layer with a name and optionally some styling (like color):

```js
layer('test').color('blue');
// now the box is placed inside the 'test' layer with color blue
box(100,200,100); 
```

![Modeling Layers](/modeling_layers.png)

## ShapeCollection

Layers are mostly about organizing your shapes in the Scene; combining Shapes into a ShapeCollection will help you operate on them more easily:

```js
col1 = collection(); // empty collection
col2 = collection(box(20).color('blue'),sphere().color('red'));
col1.add(box(30).color('green')); // add box to collection
col1.add(col2); // add two collections together
col1.move(100);
// NOTE: we don't allow nested collections!
```

![Modeling Layers](/modeling_org_collection.png)


Archiyou tries to maintain maximal consistency between Shapes and ShapeCollection so you can treat them more or less the same in simple operations like *move*, *rotate*, *scale*, *extrude* etc.

## Styles

Distinguish parts of models by setting colors or hiding them entirely:

```js
box().color('blue'); // color name
sphere(40,[0,0,80]).color(255,255,0); // (red,green,blue)
cylinder(30,30,[0,0,120]).color('#000033'); // color as hexcode
box(100,100,50,[100,0,0]).hide(); // hide the Shape
```
![Styling](/modeling_org_styling.png)


## Variables and naming

As a scripting language of course Archiyou has variables as an important way to organize a model/script. Here are some tips for using them:

```js
box(); // you can make a Shape without assigning it to a variable
b = box();
b.move(100); // but it is easy to manipulate with variable
// use simple names for variables
pnt = point(0,0,0); 
vec = vector(100,0,0);
// and of course avoid overwriting the creation methods
vector = vector(100,0,0);
v = vector(0,0,0); // Error
```

In the future Archiyou will offer more relations between variables, naming, the scenegraph and the model management.

Let's continue to see how your can access parts of your model.





