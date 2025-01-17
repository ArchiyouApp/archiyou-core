/* 
    Garbage Collection
    Mainly used for cleaning up OpenCascade WASM references
 *  Somewhat inspired on: https://github.com/sgenoud/replicad/blob/2780baf3479210f08137dcbf177d15e3c8a2401e/packages/replicad/src/register.ts#L61
 */

if (!(globalThis as any)?.FinalizationRegistry)
{   
    console.error('!!!! **** GARBAGE COLLECTION NOT INITED: FinalizationRegistry is not present **** !!!!');
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
const onGarbageCleanup = function(onDeleted:() => any)
{   
    try {
        onDeleted()
    }
    catch(e)
    {
        console.error('GarbageCollection::onGarbageCleanup(): Incoming held value is not a function!')
    }
};
    
const garbageCollectionRegistry = new (globalThis as any).FinalizationRegistry(onGarbageCleanup);


export function useGarbageCollection(obj:any)
{
    const callback = () => {
        if(obj?.onDeleted)
        {
            obj.onDeleted();
        }
        else {
            console.warn(`GarbageCollection: Obj of type ${typeof obj} has no onDeleted method. Check if nothing needs cleaning!`)
        }
    }

    garbageCollectionRegistry.register(obj, callback)
}