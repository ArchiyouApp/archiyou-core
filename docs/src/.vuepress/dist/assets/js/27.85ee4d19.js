(window.webpackJsonp=window.webpackJsonp||[]).push([[27],{413:function(t,s,a){"use strict";a.r(s);var e=a(54),n=Object(e.a)({},(function(){var t=this,s=t.$createElement,a=t._self._c||s;return a("ContentSlotsDistributor",{attrs:{"slot-key":t.$parent.slotKey}},[a("h1",{attrs:{id:"tablex-a-simple-parametric-table"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#tablex-a-simple-parametric-table"}},[t._v("#")]),t._v(" TableX: a simple parametric table")]),t._v(" "),a("h2",{attrs:{id:"what-we-ll-make"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#what-we-ll-make"}},[t._v("#")]),t._v(" What we'll make")]),t._v(" "),a("p",[a("img",{attrs:{src:"/quickstart_tablex.webp",alt:"TableX quickstart"}})]),t._v(" "),a("p",[t._v("In this quickstart example we'll make a simple parametric table. We'll use some geometry primitives (box), operations(move, array), detailed modeling (selectors with fillet/chamfer) and make it all parametric.")]),t._v(" "),a("h2",{attrs:{id:"step-1-basic-setup"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#step-1-basic-setup"}},[t._v("#")]),t._v(" Step 1: Basic setup")]),t._v(" "),a("p",[t._v("Start by defining your parameter variables. They will be static first and later parametric.")]),t._v(" "),a("div",{staticClass:"language- extra-class"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[t._v("// units in cm\nWIDTH = 100\nDEPTH = 70;\nHEIGHT = 70;\nLEG_SIZE = 5;\nTOP_THICKNESS = 5;\n")])])]),a("h2",{attrs:{id:"step-2-a-simple-leg"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#step-2-a-simple-leg"}},[t._v("#")]),t._v(" Step 2: A simple leg")]),t._v(" "),a("p",[a("img",{attrs:{src:"/quickstart_tablex_step_leg.png",alt:"TableX: simple leg"}})]),t._v(" "),a("div",{staticClass:"language-js extra-class"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// first we calculate the leg height:")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// height of the table minus the thickness of the top")]),t._v("\nlegHeight "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("HEIGHT")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("-")]),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("TOP_THICKNESS")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// then we can make a box (width = LEG_SIZE, depth = LEG_SIZE, height=legHeight)")]),t._v("\nleg "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("box")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("LEG_SIZE")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("LEG_SIZE")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" legHeight"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n     "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("move")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("LEG_SIZE")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("/")]),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("2")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("LEG_SIZE")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("/")]),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("2")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("legHeight"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("/")]),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("2")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// start position of leg")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// ... and move it so it is aligned correctly")]),t._v("\n")])])]),a("p",[t._v("Run the script to see the leg!")]),t._v(" "),a("h2",{attrs:{id:"step-3-all-4-legs"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#step-3-all-4-legs"}},[t._v("#")]),t._v(" Step 3: All 4 legs")]),t._v(" "),a("p",[a("img",{attrs:{src:"/quickstart_tablex_step_legs.png",alt:"TableX: All 4 legs"}})]),t._v(" "),a("p",[t._v("Because the 4 legs of our table are all the same we can quickly make them by making an array of the first leg:")]),t._v(" "),a("div",{staticClass:"language-js extra-class"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// From the first leg, make an array (or 2 elements in x-axis direction, 2 in y-axis)")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// with a distance from the first leg of WIDTH-LEG_SIZE in x-axis, DEPTH-LEG_SIZE in y")]),t._v("\nlegs "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" leg"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("array")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("[")]),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("2")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("2")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("]")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("[")]),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("WIDTH")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("-")]),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("LEG_SIZE")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("DEPTH")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("-")]),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("LEG_SIZE")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("]")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n        "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("color")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token string"}},[t._v("'green'")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// make them green!")]),t._v("\n")])])]),a("p",[t._v("Run the script to see the 4 legs! Note that the original leg is now part of the array.")]),t._v(" "),a("h2",{attrs:{id:"step-4-the-table-top"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#step-4-the-table-top"}},[t._v("#")]),t._v(" Step 4: The table top")]),t._v(" "),a("p",[a("img",{attrs:{src:"/quickstart_tablex_step_top.png",alt:"TableX: Table Top"}})]),t._v(" "),a("p",[t._v("Well guess what, the top of the table is also just a box. But we'll use the method "),a("em",[t._v("boxbetween")]),t._v(" instead. This allows us to create a box between two points.")]),t._v(" "),a("div",{staticClass:"language-js extra-class"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// table top")]),t._v("\ntop "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("boxbetween")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("[")]),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("0")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("0")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("legHeight"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("]")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// start point (on the first leg: leftfronttop)")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("[")]),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("WIDTH")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("DEPTH")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("HEIGHT")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("]")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// end point (on the rightbacktop)")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("color")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token string"}},[t._v("'green'")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// also make it green")]),t._v("\n")])])]),a("p",[t._v("Run the scripts to see the result. Check out our "),a("RouterLink",{attrs:{to:"/guide/modeling/csg.html"}},[t._v("Constructive Solid Geometry Modeling guide")]),t._v(" if you want to learn more on primitive shapes like a box.")],1),t._v(" "),a("h2",{attrs:{id:"step-5-details"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#step-5-details"}},[t._v("#")]),t._v(" Step 5: Details")]),t._v(" "),a("p",[a("img",{attrs:{src:"/quickstart_tablex_step_topfillet.png",alt:"TableX: Table Top"}})]),t._v(" "),a("p",[t._v("Even a simple design like this needs some nice details. Let's make fillet - that is a rounded corner - all along the top of the table:")]),t._v(" "),a("div",{staticClass:"language-js extra-class"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// make a fillet of radius 1cm along the top of the table")]),t._v("\ntop"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("fillet")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("1")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),a("span",{pre:!0,attrs:{class:"token string"}},[t._v("'Face||top'")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v(" \n"),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// top.fillet(1,'F||top'); // <== this is a shorter version of the above and used more often")]),t._v("\n")])])]),a("p",[t._v("😎 Smooth! So the first parameter of fillet is pretty clear; it's the radius of the fillet. But what is "),a("em",[t._v("'Face||top'")]),t._v("? It's a selector, and it is used to select all kinds of subshapes within a shape (like our table top). As you can see from the "),a("em",[t._v("'||'")]),t._v("; this is a side selector. So what it says is: "),a("em",[t._v("Select all faces (from our table top box) that are on the top")]),t._v(".")]),t._v(" "),a("p",[t._v("See the chapter on "),a("RouterLink",{attrs:{to:"/guide/modeling/model-access.html#selectors"}},[t._v("Model Access")]),t._v(" for more information on Selectors.")],1),t._v(" "),a("h2",{attrs:{id:"step-6-making-it-parametric"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#step-6-making-it-parametric"}},[t._v("#")]),t._v(" Step 6: Making it parametric")]),t._v(" "),a("p",[t._v("Now let's say you have a beautiful table design (probably nicer than this one!😆) and a new client wants another size. Well this is where the magic of parametric design comes in.")]),t._v(" "),a("p",[a("img",{attrs:{src:"/quickstart_tablex_step_param.png",alt:"TableX: Make parameter"}})]),t._v(" "),a("p",[t._v("Let's make the parameter "),a("em",[t._v("WIDTH")]),t._v(":")]),t._v(" "),a("ul",[a("li",[t._v("Click on the button 'Add Parameter'")]),t._v(" "),a("li",[t._v("Select Type 'Number'")]),t._v(" "),a("li",[t._v("Fill in Name: WIDTH")]),t._v(" "),a("li",[t._v("Set Default Value to 100")]),t._v(" "),a("li",[t._v("Set 'Range Start' to 50")]),t._v(" "),a("li",[t._v("Set 'Range End' to 200")])]),t._v(" "),a("p",[t._v("Of course you can set other values if you want! While you at it do the same for "),a("em",[t._v("DEPTH")]),t._v(" (more or less the same values), "),a("em",[t._v("LEG_SIZE")]),t._v(" (default:5cm, start:3, end:10) and "),a("em",[t._v("TOP_THICKNESS")]),t._v(" (default:5cm, start:3, end:10).")]),t._v(" "),a("p",[t._v("Now you have 4 sliders. If you move them nothing really happens yet. You need to plug in the values of the parameters in your script first. Replace the static parameter part of your script with this:")]),t._v(" "),a("div",{staticClass:"language-js extra-class"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("WIDTH")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" $"),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("WIDTH")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// import value of WIDTH slider to local variable WIDTH")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("DEPTH")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" $"),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("DEPTH")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("HEIGHT")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("70")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("LEG_SIZE")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" $"),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("LEG_SIZE")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("TOP_THICKNESS")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" $"),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("TOP_THICKNESS")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n")])])]),a("p",[t._v("So the $[[param name]] refers to the value of parameter of given name.\nNow if you move the sliders your model changes too! 🚀")]),t._v(" "),a("div",{staticClass:"custom-block tip"},[a("p",{staticClass:"custom-block-title"},[t._v("TIP")]),t._v(" "),a("p",[t._v("You can export your parametric models as animated GLTF models! Check it out in "),a("em",[t._v("'File'")]),t._v(" => "),a("em",[t._v("'Export Animation as GLTF'")])])]),t._v(" "),a("h2",{attrs:{id:"full-code"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#full-code"}},[t._v("#")]),t._v(" Full code")]),t._v(" "),a("p",[t._v("Underneath is the full code. You can also open this example by going to "),a("em",[t._v("'File'")]),t._v(" => "),a("em",[t._v("'Open'")]),t._v(" => "),a("em",[t._v("'Shared Scripts'")]),t._v(" and select "),a("em",[t._v("'ExampleTableX'")]),t._v(".")]),t._v(" "),a("div",{staticClass:"language-js extra-class"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// Archiyou 0.1")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// units in cm")]),t._v("\n\n"),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("WIDTH")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" $"),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("WIDTH")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("||")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("100")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("DEPTH")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" $"),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("DEPTH")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("||")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("70")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("HEIGHT")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("70")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("LEG_SIZE")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" $"),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("LEG_SIZE")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("||")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("5")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("TOP_THICKNESS")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" $"),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("TOP_THICKNESS")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("||")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("5")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// leg")]),t._v("\nlegHeight "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("HEIGHT")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("-")]),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("TOP_THICKNESS")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\nleg "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("box")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("LEG_SIZE")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("LEG_SIZE")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" legHeight"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n     "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("move")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("LEG_SIZE")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("/")]),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("2")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("LEG_SIZE")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("/")]),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("2")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("legHeight"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("/")]),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("2")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// start position of leg")]),t._v("\n     \n"),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 4 legs")]),t._v("\nlegs "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" leg"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("array")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("[")]),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("2")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("2")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("]")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("[")]),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("WIDTH")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("-")]),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("LEG_SIZE")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("DEPTH")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("-")]),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("LEG_SIZE")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("]")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("color")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token string"}},[t._v("'green'")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// table top")]),t._v("\ntop "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("boxbetween")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("[")]),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("0")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("0")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("legHeight"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("]")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("[")]),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("WIDTH")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("DEPTH")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("HEIGHT")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("]")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("color")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token string"}},[t._v("'green'")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// finish table top")]),t._v("\ntop"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("fillet")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("1")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),a("span",{pre:!0,attrs:{class:"token string"}},[t._v("'Face||top'")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n")])])])])}),[],!1,null,null,null);s.default=n.exports}}]);