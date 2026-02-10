// used with Runner.components.test.ts
export default {
    id : "Frame",
    name: "Frame",
    author: "test",
    params: {
        width: {
            type: "number",
            default: 1000,
            min: 300,
            max: 2000
        },
        height: {
            type: "number",
            default: 1000,
            min: 300,
            max: 2000
        },
        depth: {
            type: "number",
            default: 200,
            min: 100,
            max: 500
        }
    },
    code: `
        // Create the simple frame
        frameOuter = line([0,0,0],[$WIDTH,0,0])
                .hide()
                .extruded($HEIGHT, [0,0,1])
                .hide();
         
        frameInner = frameOuter.offsetted(-50).name('h');
        frame =  frameOuter
                    .subtract(frameInner.hide())
                    .extruded($DEPTH)
                    .color('blue')
        
    `,
    published: {
        version: "0.1",
    }

}
