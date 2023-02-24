# Advanced Surface modeling

In the section [Modeling with Topology Primitives](./topology.md) we saw that you can easily create curved surfaces with Archiyou. In the future we intend to make this even easier to design beautiful curved shapes.

Here are already some examples showing the strength of BREP modeling in OpenCascade:

![Surface modeling with Shelling](/modeling_adv_surfaces.png)

```js
a1 = arc([0,0,0],[100,0,-50],[200,0,0])
l = line([50,100,0],[150,100,20])
a2 = arc([0,200,0],[100,200,90],[200,200,0])

loft = a1.loft([l,a2]).move(0,0,150);
loft.shelled(5).move(300);
```









