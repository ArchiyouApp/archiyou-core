(window.webpackJsonp=window.webpackJsonp||[]).push([[25],{411:function(t,s,a){"use strict";a.r(s);var n=a(54),e=Object(n.a)({},(function(){var t=this,s=t.$createElement,a=t._self._c||s;return a("ContentSlotsDistributor",{attrs:{"slot-key":t.$parent.slotKey}},[a("h1",{attrs:{id:"cabinetx-a-simple-parametric-cabinet"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#cabinetx-a-simple-parametric-cabinet"}},[t._v("#")]),t._v(" CabinetX: a simple parametric cabinet")]),t._v(" "),a("h2",{attrs:{id:"what-we-ll-make"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#what-we-ll-make"}},[t._v("#")]),t._v(" What we'll make")]),t._v(" "),a("p",[a("img",{attrs:{src:"/quickstart_closetx.webp",alt:"CabinetX quickstart"}})]),t._v(" "),a("p",[t._v("🚧 Making a cabinet is a good way to start modeling with rectangles and boxes and making simple arrangements with them.\nOf course Archiyou offers a lot of ways to make rectangular models: using primitives like "),a("em",[t._v("box()")]),t._v(", "),a("em",[t._v("plane()")]),t._v(" and operations like "),a("em",[t._v("Shape.extrude()")]),t._v(", "),a("em",[t._v("Shape.array()")]),t._v(". There is also a powerful "),a("em",[t._v("Shape.align()")]),t._v(" and "),a("em",[t._v("Shape.select()")]),t._v(" function to arrange shapes in relation to each other.")]),t._v(" "),a("p",[t._v("This example is available as file "),a("em",[t._v("CursusKast")]),t._v(" under "),a("em",[t._v("File -> Open -> Shared Scripts")]),t._v(".")]),t._v(" "),a("h2",{attrs:{id:"step-1-parameters-and-left-side"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#step-1-parameters-and-left-side"}},[t._v("#")]),t._v(" Step 1: Parameters and left side")]),t._v(" "),a("p",[t._v("Start by defining your parameter variables in the Parameter menu. We need at least:")]),t._v(" "),a("ul",[a("li",[a("em",[t._v("WIDTH")]),t._v(" - type: number, start: 30, end: 200 (or something in this range)")]),t._v(" "),a("li",[a("em",[t._v("DEPTH")]),t._v(" - type: number, start: 30, end: 120")]),t._v(" "),a("li",[a("em",[t._v("HEIGHT")]),t._v(" - type: number, start: 40, end: 300")]),t._v(" "),a("li",[a("em",[t._v("NUM_PLANKS")]),t._v(" - type: number, start: 3, end: 10")])]),t._v(" "),a("p",[t._v("Units are centimeters. You can tell Archiyou with _units('cm') and set them in the Parameter definitions.\nThe current values of the parameters can be plugged into the script by refering to their name with a '$'. So "),a("em",[t._v("$WIDTH")]),t._v(", "),a("em",[t._v("$DEPTH")]),t._v(" etc.")]),t._v(" "),a("p",[t._v("Let's make the left side of the cabinet with this code:")]),t._v(" "),a("div",{staticClass:"language-js extra-class"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[t._v("sideLeft "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("box")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("2")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("$"),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("DEPTH")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("$"),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("HEIGHT")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// make a box")]),t._v("\n            "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("align")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("vertex")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("  "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// align it to [0,0,0] - vertex() defaults to [0,0,0]")]),t._v("\n                "),a("span",{pre:!0,attrs:{class:"token string"}},[t._v("'bottomfrontleft'")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" \n                "),a("span",{pre:!0,attrs:{class:"token string"}},[t._v("'center'")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n")])])]),a("p",[t._v("Run it and you should see something like this:")]),t._v(" "),a("p",[a("img",{attrs:{src:"/closetx_step1.png",alt:"CabinetX: parameters and left side"}})]),t._v(" "),a("p",[t._v("The code is pretty simple, but there are some interesting things going on:")]),t._v(" "),a("ul",[a("li",[t._v("box()."),a("em",[t._v("align(other:Shape, pivot:Pivot, alignment:Alignment)")]),t._v(" - This aligns the "),a("em",[t._v("bottomfrontleft")]),t._v(" corner of the box the origin ([0,0,0]) of the scene.")]),t._v(" "),a("li",[a("em",[t._v("vertex()")]),t._v(" in the above command is shorthand. If you don't supply coordinates to this function it will default to [0,0,0]. So this is the same: vertex(0,0,0)")])]),t._v(" "),a("h2",{attrs:{id:"step-2-the-other-side-and-the-first-plank"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#step-2-the-other-side-and-the-first-plank"}},[t._v("#")]),t._v(" Step 2: The other side and the first plank")]),t._v(" "),a("p",[t._v("Since the right side shape is the same as the left we can just copy the latter and move it along the x-axis at a distance of the width of the cabinet ("),a("em",[t._v("$WIDTH")]),t._v("). The command "),a("em",[t._v("Shape.moved()")]),t._v(" does exactly that!")]),t._v(" "),a("div",{staticClass:"language-js extra-class"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[t._v("sideRight "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" sideLeft"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("moved")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("$"),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("WIDTH")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n")])])]),a("div",{staticClass:"custom-block tip"},[a("p",{staticClass:"custom-block-title"},[t._v("TIP")]),t._v(" "),a("p",[t._v("For most operations Archiyou offers two versions: one on the current Shape and the other making a copy and then doing the operation:")]),t._v(" "),a("div",{staticClass:"language-js extra-class"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[a("span",{pre:!0,attrs:{class:"token function"}},[t._v("box")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("move")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("100")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// moves the one box ")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("box")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("moved")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("100")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// copies and then moves the one box: now there are two boxes!")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// other examples:")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("box")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("scale")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("2")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("box")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("scaled")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("2")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// and so on!")]),t._v("\n")])])])]),t._v(" "),a("p",[t._v("So now create the last shape that we need: a simple plank. It's always a good idea to stick to code that corresponds to how you would explain a plank verbally to a person: "),a("em",[t._v("it's between this side and that side")]),t._v(". This is the code:")]),t._v(" "),a("div",{staticClass:"language-js extra-class"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[t._v("plank "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("planebetween")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("\n            sideLeft"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("select")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token string"}},[t._v("'V||frontrightbottom'")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// the front-right-bottom corner of the left side")]),t._v("\n            sideRight"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("select")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token string"}},[t._v("'V||backleftbottom'")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n        "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("extrude")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("2")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n")])])]),a("ul",[a("li",[a("em",[t._v("planebetween()")]),t._v(" makes a plane between two points (or anything that looks like a point: "),a("em",[t._v("Vertex")]),t._v(" )")]),t._v(" "),a("li",[a("em",[t._v("sideLeft.select('V||frontrightbottom')")]),t._v(" and _"),a("em",[t._v("sideLeft.select('V||frontrightbottom')")]),t._v(" supply these points by selecting a specific vertex from the both sides. Read more on "),a("RouterLink",{attrs:{to:"/guide/modeling/model-access.html"}},[t._v("selectors here")])],1),t._v(" "),a("li",[a("em",[t._v("planebetween(..).extrude(2)")]),t._v(" - Lastly we give the plane a thickness of 2cm")])]),t._v(" "),a("p",[t._v("When you run the code now you would something like this:")]),t._v(" "),a("p",[a("img",{attrs:{src:"/closetx_step2.png",alt:"CabinetX: sides and plank"}})]),t._v(" "),a("h2",{attrs:{id:"step-3-all-the-planks"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#step-3-all-the-planks"}},[t._v("#")]),t._v(" Step 3: All the planks")]),t._v(" "),a("p",[t._v("Let's get some storage space 📚 by simply creating the right number of planks ("),a("em",[t._v("$NUM_PLANKS")]),t._v(") with a distance of "),a("em",[t._v("($HEIGHT-2)/($NUM_PLANKS-1)")]),t._v(" between them.")]),t._v(" "),a("div",{staticClass:"language-js extra-class"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[t._v("plank"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("arrayZ")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("$"),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("NUM_PLANKS")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("$"),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("HEIGHT")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("-")]),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("2")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("/")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("$"),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("NUM_PLANKS")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("-")]),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("1")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// -2 = 2 cm of plank thickness")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// There are actually $NUM_PLANKS-1 gaps between the planks")]),t._v("\n")])])]),a("p",[t._v("This is the end result:")]),t._v(" "),a("p",[a("img",{attrs:{src:"/closetx_step3.png",alt:"CabinetX: planks and finished cabinet"}})]),t._v(" "),a("h2",{attrs:{id:"full-code"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#full-code"}},[t._v("#")]),t._v(" Full code")]),t._v(" "),a("div",{staticClass:"language-js extra-class"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[a("span",{pre:!0,attrs:{class:"token function"}},[t._v("units")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token string"}},[t._v("'cm'")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n\nsideLeft "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("box")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("2")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("$"),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("DEPTH")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("$"),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("HEIGHT")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n            "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("align")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("vertex")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" \n            "),a("span",{pre:!0,attrs:{class:"token string"}},[t._v("'bottomfrontleft'")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" \n            "),a("span",{pre:!0,attrs:{class:"token string"}},[t._v("'center'")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n\nsideRight "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" sideLeft"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("moved")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("$"),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("WIDTH")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\nplank "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("planebetween")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("\n            sideLeft"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("select")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token string"}},[t._v("'V||frontrightbottom'")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n            sideRight"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("select")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token string"}},[t._v("'V||backleftbottom'")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n        "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("extrude")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("2")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// X planks means X-1 spaces between ~ offsets")]),t._v("\nplank"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("arrayZ")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("$"),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("NUM_PLANKS")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("$"),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("HEIGHT")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("-")]),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("2")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("/")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("$"),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("NUM_PLANKS")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("-")]),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("1")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n\n"),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("all")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("color")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token string"}},[t._v("'blue'")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// just color everything blue")]),t._v("\n")])])]),a("h2",{attrs:{id:"more"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#more"}},[t._v("#")]),t._v(" More")]),t._v(" "),a("ul",[a("li",[t._v("Try to model a book and place some into the cabinet!")])])])}),[],!1,null,null,null);s.default=e.exports}}]);