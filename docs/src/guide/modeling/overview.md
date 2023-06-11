# Modeling techniques

There are a lot of common approaches to modeling and Archiyou offers many of them. Because we categorize them here doesn't mean they are separated in the practice of modeling. Most of the time you are combining these techniques.

Here are the modeling techniques we distinguish:

* ✒️ [Topological modeling](./topology.md): This is modeling on the most rudimentary level. You are creating a model from the Topological primitives *vertices*, *edges*, *wires*, *faces* ( and less so with *shells* and *solids*). However complex a model becomes; it will always consist of these primitives and be changed as such.

* 🍱 [Constructive Solid Geometry modeling (CSG)](/guide/modeling/csg.md): This is a very intuitive way to model that serves very well as a introduction to 3D modeling (see for example TinkerCAD). You start by creating geometric *primitives* like planes, spheres, boxes and cones, then move or rotate them into a configuration and then use one of the *operations* like *union*, *intersection* , *subtract* or *cut* to combine or shape them.

* ✏️ [Sketching](./sketching.md): Most big CAD programs offer this type of modeling technique. It uses the fact that is so much easier to describe something in 2D than directly in 3D. So *Sketching* starts with defining a plane to work on (like the standard *XY plane* or a *face* of a existing model) and create different kind of 2D *edges* (lines, arc, splines) or *faces* (rectangles,circles) on it. These sketched 2D shapes serve as contours,  profiles or *spines* for 3D creating objects with operations like *lofts*, *extrude* or *revolve/lathe*.
⚠️ Most desktop CAD software offer ways to create parametric Sketches by using constraints (*parallel*, *symmetrical*) on parts (*vertices*, *edges) of the sketch. Archiyou does not yet offer this!

* 📐 [TODO] [Advanced surface modeling](./surface.md): Surface modeling is used to create complex and smooth surfaces and solids mostly by combining or changing *spline edges*.

* 💣 [TODO] [Miscellaneous operations and plugins](./misc.md): Of course the possibilities of modeling are endless, especially if you can code it and share it. A plugin system for these would be great, but is still very much in the planning stages.

* 🛌 [TODO] [Specialized Systems](./systems.md): In the future Archiyou will offer easy ways to create specific things like framework constructions, a bit like the workbenches of [FreeCad](https://freecad.com).

So let's continue and start with [Topological modeling](./topology.md). Because it might be a bit technical starting with [Constructive Solid Geometry modeling](./csg.md) could also be a good idea for some users!