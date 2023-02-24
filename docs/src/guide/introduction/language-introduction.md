# Archiyou Scripting Language

Archiyou sets out to create a code language that is both simple, intuitive and powerful. That is essential to bridge the gap between designers and programmers. 

## It's just Javascript!

The scripting language of Archiyou is based on Javascript. If you know it already you can use anything from Javascript inside the Archiyou code editor. But Javascript is also one of the easiest languages to learn. 

We abstracted away some of the tedious parts of Javascript like variable declarations with *let*, *var* or *const* and use *chaining* to have an intuitive and readable way to do stuff with shapes:

```js
// variable declarations
let myBox = box(10,20,30); // this works
myBox = box(10,20,30); // this too and is simpler

// now do something with the box with chaining
myBox.move(100).rotateZ(45).scale(2); 
// you can also write it like this:
myBox.move(100)
    .rotateZ(45)
    .scale(2); 
```

### 🌱 Learning Javascript

There are great courses to learn the basics of Javascript. For example [this course](https://www.freecodecamp.org/news/my-giant-javascript-basics-course-is-now-live-on-youtube-and-its-100-free-9020a21bbc27/) by Beau Carnes of [freeCodeCamp](https://freecodecamp.com) on Youtube. [This one](https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/JavaScript_basics) by Mozilla is also nice! 

We feel that basic Javascript knowledge is enough to start modeling with Javascript. So if you want to start immediately [just jump in](../modeling/index.md).


## Design principles

We want to facilitate making shapes with code easy and fun. That's why we defined some important design principles that are implemented over a wide range of aspects:

1. 🧱 *Object Orientated*: Archiyou defines clear objects which gives readability and clarity to your code. Everything that you do - like moving, extruding, subtracting, selecting - is related to these objects.

2. 🚰 *Design flow*: We know that designing is different from coding. Design is more about flow and iterating. That's why we always try to show results by guessing what you likely meant. Also, we offer multiple (well-known) aliases for operations, so you don't have to consult the API reference all the time. Of course there is an autocomplete and suggest feature.

3. 🏠 *Real context*: Archiyou assumes that you probably want to make something real, that informs it's guesses of what you meant. Probably you want to place that block on the other and not slightly through it. 😉

4. 🛠️ *Different ways of modeling* : We want to offer an unified intuitive system of multiple well-known modeling approaches. *BREP topology*, *mesh modeling*, *Constructive solid geometry*, *2D Sketching* and *surface modeling*. It should be so intuitive that you don't care what method it is. 

5. 🧫 *Multiple levels of abstraction*. Archiyou will offer multiple levels of abstraction: from raw topology, geometry primitives and advanced systems like frameworks (*coming*).

6. 🔌 *Made to connect*: Archiyou and it's language needs to be the spider in the web. It's easy to bring things together in it, but also easy to get it out into other tools.

## Beyond programmers

Although we believe in the power of code for designing, we also know that most (current) designers will not pick it up naturally. We intend to make more tools specifically for designers in a later phase of Archiyou. 


Continue to learn about the basic of the [Archiyou scripting language](./language-basics.html)
