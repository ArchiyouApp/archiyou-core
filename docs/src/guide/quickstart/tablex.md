# TableX: a simple parametric table

## What we'll make

![TableX quickstart](/quickstart_tablex.webp)

In this quickstart example we'll make a simple parametric table. We'll use some geometry primitives (box), operations(move, array), detailed modeling (selectors with fillet/chamfer) and make it all parametric.

## Step 1: Basic setup

Start by defining your parameter variables. They will be static first and later parametric. 

```
// units in cm
WIDTH = 100
DEPTH = 70;
HEIGHT = 70;
LEG_SIZE = 5;
TOP_THICKNESS = 5;
```

## Step 2: A simple leg

![TableX: simple leg](/quickstart_tablex_step_leg.png)

```js
// first we calculate the leg height:
// height of the table minus the thickness of the top
legHeight = HEIGHT-TOP_THICKNESS;
// then we can make a box (width = LEG_SIZE, depth = LEG_SIZE, height=legHeight)
leg = box(LEG_SIZE, LEG_SIZE, legHeight)
     .move(LEG_SIZE/2, LEG_SIZE/2,legHeight/2); // start position of leg
// ... and move it so it is aligned correctly
```

Run the script to see the leg!


## Step 3: All 4 legs

![TableX: All 4 legs](/quickstart_tablex_step_legs.png)

Because the 4 legs of our table are all the same we can quickly make them by making an array of the first leg:

```js
// From the first leg, make an array (or 2 elements in x-axis direction, 2 in y-axis)
// with a distance from the first leg of WIDTH-LEG_SIZE in x-axis, DEPTH-LEG_SIZE in y
legs = leg.array([2,2],[WIDTH-LEG_SIZE,DEPTH-LEG_SIZE])
        .color('green'); // make them green!
```

Run the script to see the 4 legs! Note that the original leg is now part of the array. 

## Step 4: The table top

![TableX: Table Top](/quickstart_tablex_step_top.png)

Well guess what, the top of the table is also just a box. But we'll use the method *boxbetween* instead. This allows us to create a box between two points. 

```js
// table top
top = boxbetween(
    [0,0,legHeight], // start point (on the first leg: leftfronttop)
    [WIDTH, DEPTH, HEIGHT]) // end point (on the rightbacktop)
    .color('green'); // also make it green
```

Run the scripts to see the result. Check out our [Constructive Solid Geometry Modeling guide](../modeling/csg.html) if you want to learn more on primitive shapes like a box. 

## Step 5: Details

![TableX: Table Top](/quickstart_tablex_step_topfillet.png)

Even a simple design like this needs some nice details. Let's make fillet - that is a rounded corner - all along the top of the table:

```js
// make a fillet of radius 1cm along the top of the table
top.fillet(1,'Face||top'); 
// top.fillet(1,'F||top'); // <== this is a shorter version of the above and used more often
```

😎 Smooth! So the first parameter of fillet is pretty clear; it's the radius of the fillet. But what is *'Face||top'*? It's a selector, and it is used to select all kinds of subshapes within a shape (like our table top). As you can see from the *'||'*; this is a side selector. So what it says is: *Select all faces (from our table top box) that are on the top*.  

See the chapter on [Model Access](../modeling/model-access.html#selectors) for more information on Selectors.

## Step 6: Making it parametric

Now let's say you have a beautiful table design (probably nicer than this one!😆) and a new client wants another size. Well this is where the magic of parametric design comes in. 

![TableX: Make parameter](/quickstart_tablex_step_param.png)

Let's make the parameter *WIDTH*:

* Click on the button 'Add Parameter'
* Select Type 'Number'
* Fill in Name: WIDTH
* Set Default Value to 100
* Set 'Range Start' to 50
* Set 'Range End' to 200

Of course you can set other values if you want! While you at it do the same for *DEPTH* (more or less the same values), *LEG_SIZE* (default:5cm, start:3, end:10) and *TOP_THICKNESS* (default:5cm, start:3, end:10). 

Now you have 4 sliders. If you move them nothing really happens yet. You need to plug in the values of the parameters in your script first. Replace the static parameter part of your script with this:

```js
WIDTH = $WIDTH; // import value of WIDTH slider to local variable WIDTH
DEPTH = $DEPTH;
HEIGHT = 70;
LEG_SIZE = $LEG_SIZE;
TOP_THICKNESS = $TOP_THICKNESS;
```

So the $[[param name]] refers to the value of parameter of given name. 
Now if you move the sliders your model changes too! 🚀

:::tip
You can export your parametric models as animated GLTF models! Check it out in *'File'* => *'Export Animation as GLTF'*
:::

## Full code

Underneath is the full code. You can also open this example by going to *'File'* => *'Open'* => *'Shared Scripts'* and select *'ExampleTableX'*.

```js
// Archiyou 0.1
// units in cm

WIDTH = $WIDTH || 100;
DEPTH = $DEPTH || 70;
HEIGHT = 70;
LEG_SIZE = $LEG_SIZE || 5;
TOP_THICKNESS = $TOP_THICKNESS || 5;

// leg
legHeight = HEIGHT-TOP_THICKNESS;
leg = box(LEG_SIZE, LEG_SIZE, legHeight)
     .move(LEG_SIZE/2, LEG_SIZE/2,legHeight/2); // start position of leg
     
// 4 legs
legs = leg.array([2,2],[WIDTH-LEG_SIZE,DEPTH-LEG_SIZE])
.color('green');

// table top
top = boxbetween(
    [0,0,legHeight],
    [WIDTH, DEPTH, HEIGHT])
    .color('green');

// finish table top
top.fillet(1,'Face||top');
```






