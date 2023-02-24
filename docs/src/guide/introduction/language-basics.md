# Archiyou Scripting Basics

## Describing Shapes

In the real world we talk about points (0-dimensional), lines (1-dimensional), surfaces (2-dimensional) and boxes (3-dimensional) to describe shapes or we just point at the object or show a photo. Archiyou aims to enable you to describe a shape with the code. Thus, in the background it is necessary for Archiyou to have a very systematic way of formulating geometry while it is equally essential that we enable an intuitive, almost natural way of doing it. 

## About BREP modeling and Mesh modeling

Archiyou is built on the open source geometry kernel [OpenCascade](https://www.opencascade.com/). And it already has a systematic way to describe the geometry which is called as *Boundary Representations modeling* or BREP modeling. Most CAD software uses BREP because of its precision and advanced shapes. As the name suggests, it uses boundaries to describe shapes. These boundaries take numerous shapes like arcs and bezier curves. In comparison [Blender](https://blender.com) uses only vertices, (straight) edges and planar triangles (or faces) in what is called *mesh modeling*. 
BREP modeling has a lot of ways to directly define geometry (or more accurate topology) before it can be turned into a mesh. This allows more mathematical accuracy and descriptive control where *mesh modeling* is way simpler and easier to manipulate by clicking.

## Introducting Topology versus Geometry

The [OpenCascade](https://www.opencascade.com/) makes a clear distinction between topology and geometry. That makes sense because BREP describes shapes as their boundaries. At that level of abstraction you don't know exactly where everything is. That 'does' *geometry*; literally the measuring of land. 

## Topological Shape primitives

In OpenCascade, the topology is the fundamental level and always consists of the following hierarchical primitives which are generally refered to as *Shapes*:

1. *Vertex*: Point in space with 3 coordinates: (x, y, z).
2. *Edge*: Connection between two or more *vertices* (more in the case of a *spline edge*). Some edge types like an arc can be closed in itself. 
3. *Wire*: Sequence of connected *edges*.
4. *Face*: Collection of closed connected *wires* that span a surface. That surface can be non-planar (unlike with mesh modeling).
5. *Shell*: Collection of connected *faces* to span an elaborate surface. 
6. *Solid* : A *shell* that encloses a space without any gaps.

Archiyou makes the creation of these shapes easier and sometimes abstracts them away. But you can always find them in any part of the model. In general, it is possible to generate invalid shapes in OpenCascade. For example, a Wire with non-connected Edges. Archiyou does its best to avoid any of these, to prevent unexpected results or crashes.

## Shapes hierarchy and geometry

| # | topology primitive | geometry name       | subtype |  important properties                         |
|---|--------------------|----------------------|-------------------|-----------------------------------------------|
| 1  | Vertex             | Vertex               |                  |  center                                       |
| 2  | Edge               | Curve                |                  |                                               |
|    |                    |                      | Line             | start, end, length, center, u coordinate      |                  
|    |                    |                      | Arc              |                                               |
|    |                    |                      | Circle           |                                               |
|    |                    |                      | Spline           |                                               |
| 3  | Wire               | Curve                |                  | start, end, length, center, u coordinate, closed             |
| 4  | Face               | Surface              |                  | area, uv coordinates                          |
| 5  | Shell              |                      |                  | area                                          |
| 6  | Solid              |                      |                  | area, volume                                  |


## Mathematical primitives

* Point: Just a point in space (x, y, z).
* Vector: A point in space (x, y, z) with the magnitude.





