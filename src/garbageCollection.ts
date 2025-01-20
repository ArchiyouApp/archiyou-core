/*
    Garbage Collection
    Mainly used for cleaning up OpenCascade WASM references
    We use the readily availble Javascript FinalizationRegistry
    See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/FinalizationRegistry
    Approach inspired by Steve Genoud in Replicad: https://github.com/sgenoud/replicad/pull/4

    Usage:
        For every Class that wraps OpenCascade primitives use global method:
        
        targetOcForGarbageCollection(this, ocObj)

        When main class (like Shape, Edge) is garbage collected we call
        ocObj.delete() to free memory 

    NOTES: 
        - Browser/Node garbage collection is not every second. In browser you can trigger it to test if callbacks are working
          For example in Chrome: More Tools -> Development Tools -> Memory > Collect Garbage

        - For temporary OpenCascade instances, directly delete them after use

        - We need to be very carefyl avoiding shared OC instances, because one Class instance might delete it before another is done using it
    
*/

if (!(globalThis as any)?.FinalizationRegistry)
{
    console.error('!!!! **** GARBAGE COLLECTION FAIL: FinalizationRegistry is not present **** !!!!');
    // Some mockup to not break garbage collection methods
    (globalThis as any).FinalizationRegistry = (() => ({
      register: () => console.warn('!!!! Can not register for garbage collection: No Registry active! !!!!'),
      unregister: () => null,
    })) as any;
}

/** Called when a reference is cleaned up by browser
 *  When this happens depends on the browser, and is certainly not every second
 *  In dev tools you can trigger it. For example in Chrome -> More Tools -> Development Tools -> Memory > Collect Garbage
 */
const onGarbageCollect = function(ocObj:Array<any>)
{
    try {
        (ocObj as any)?.delete(); // Delete OC reference - NOTE: This might happen 100k+ for every scene. Don't log for speed!
    }
    catch(e)
    {
        if(e.name === 'BindingError')
        {
            // Most commonly - object is already deleted
            return;
        }
        
        console.error(`GarbageCollection::onGarbageCleanup(): Error: ${e}!`)
    }
};

const garbageCollectionRegistry = new (globalThis as any).FinalizationRegistry(onGarbageCollect);

/** This is the main method to target one or more OC objects for deletion after main class is garbage collected */
export function targetOcForGarbageCollection(obj:any, ocObj:any)
{
    // TODO: some error checking
    garbageCollectionRegistry.register(obj, ocObj, ocObj); // Use object itself as unregister token
}

/** Unregister with token (the Oc instance)  */
export function removeOcTargetForGarbageCollection(ocObj:any)
{
    // TODO: some error checking
    garbageCollectionRegistry.unregister(ocObj);
    return ocObj;
}
