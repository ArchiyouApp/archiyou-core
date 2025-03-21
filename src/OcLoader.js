/** OcLoader.js
 * 
 *  This helper class contains some black magic to have a custom build from OC.js working accross environments and modes:
 * 
 *    - Synchronous (with callback) or as async function: load(), loadAsync()
 *    - In a browser or node (that includes jest testing) - The context is detected automatically
 *  
 *    NOTES: 
 *      - For some reason dynamic imports don't work well in Webpack DEV server. It looks like something to do with setting up the wasm serving (Wrong MIME type). 
 *      - Please make sure you enable modern ES versions (es2017+) to enable dynamic imports
 *      - We have this as JS, not TS to avoid any issues with the dynamic imports
 *      - If using relative path in dynamic imports we need to make resolve them to absolute paths (otherwise they are resolved relative to the file that imports this module)
*/

import { Geom } from './Geom'

// For browser we refer to the module 
// For node we just add /src/wasm folder
import ocFullJS from "./wasm/archiyou-opencascade.js";
//import ocFullJSFast from "../wasm/archiyou-opencascade.js"; 
//import ocFullWasm from "./wasm/archiyou-opencascade.wasm?url"; // DEBUG


export class OcLoader
{
  //// SETTINGS ////
  USE_FAST = false; // Fast is not really a big difference!
  SHAPE_TOLERANCE = 0.001;
  RUN_TEST = false;

  //// IMPORTANT PATHS ////
  /* We copy wasm and Emscripten glue files directly from src/wasm to dist/wasm 
     Relative paths remain to same
  */

  ocJsModulePath = `./wasm/archiyou-opencascade${(this.USE_FAST) ? '-fast' : ''}.js`;
  ocJsNodeModulePath = `./wasm/node.js`;
  ocWasmModulePath = `./wasm/archiyou-opencascade${(this.USE_FAST) ? '-fast' : ''}.wasm`; // ?url let vite load a wasm without affecting other contexts (TODO TEST!)

  //// PROPERTIES ////

  _oc;
  loaded;
  startLoadAt;

  constructor()
  {
    this.loaded = false;
    this._oc = null; // will be set by _onOcInit
    // use load or loadSync to start loading Opencascade
  }

  //// PUBLIC METHODS ////


  /** Load synchronous */
  load(onLoaded)
  {
    console.log(`OcLoader::load()[context: ${this._getContext()}]: Loading Opencascade WASM module`);
      
    this.startLoadAt = performance.now();
    
    if(this._getContext() === 'browser')
    {
      this._loadOcBrowser(onLoaded);
    }
    else {
      this._loadOcNode(onLoaded);
    }
  }

  /** Load async */
  async loadAsync()
  {
    console.log(`OcLoader::loadAsync()[context: ${this._getContext()}]: Loading Opencascade WASM module`);
    this.startLoadAt = performance.now();

    if(this._getContext() === 'browser')
    {
      return await this._loadOcBrowserAsync();
    }
    else {
      return await this._loadOcNodeAsync();
    }
  }

  //// PRIVATE

  // Test function for loading wasm directly
  // Does not really work due to WASI problems - OCjs uses this
  /*
  async _loadWasm(urlOrPath)
  {
    const imports = {
      env: {
        memory: new WebAssembly.Memory({ initial: 256, maximum: 512 }),
        abort: () => console.error("WASM aborted!"),
      },
    };
  
    let wasmModule;
    
    if (typeof window !== "undefined") 
    {
      // Browser: Use fetch + instantiateStreaming (faster)
      wasmModule = await WebAssembly.instantiateStreaming(fetch(urlOrPath), imports);
    } 
    else 
    {
      // Node.js: Use fs + instantiate (no fetch)
      const fs = (await import("fs")).default;
      const wasmBuffer = await fs.promises.readFile(urlOrPath);
      // [TypeError: WebAssembly.instantiate(): Import #12 module="wasi_snapshot_preview1" error: module is not an object or function]
      wasmModule = await WebAssembly.instantiate(wasmBuffer, imports);
    }
  
    return wasmModule.instance.exports;
  }
  */

  _getContext()
  {
    // NOTE: some problems with process in Jest
    const isBrowser = (typeof globalThis.window !== "undefined")
    return isBrowser ? 'browser' : 'node'
  }
  

  /** Load OpenCascade module synchronous and run function when loading is done 
   *  This still uses the standard OC.js method, because alternatives with dynamic imports are not working well in browser
  */
  _loadOcBrowser(onLoaded)
  {
    /*
    this._loadOcBrowserAsync()
      .then(oc => {
        if(typeof onLoaded === 'function'){ onLoaded(oc) }
        else { console.warn('**** OcLoader.load() - No onLoaded function provided! Beware that load takes a while, so you have to wait for it!') };
    });
    */

   
    // taken from official OC.js approach and added dynamic wasm loading to keep Node happy
    const initOpenCascade = () => 
    {
      return new Promise((resolve, reject) => 
      {
        this._getAbsPath(this.ocWasmModulePath)
        .then(async (wasmPath) =>
        {
            import(wasmPath) // TODO: Can the right path be resolved here?
            .then( async wasmModule => 
            {
              const mainWasm = wasmModule.default;
              new ocFullJS({
                locateFile(path) { // Module.locateFile: https://emscripten.org/docs/api_reference/module.html#Module.locateFile

                  console.log(`**** Emscripten module.locateFile: ${path}`);

                  if (path.endsWith('.wasm')) {
                    return mainWasm;
                  }
                  if (path.endsWith('.worker.js') && !!worker) {
                    return worker;
                  }
                  return path;
                },
              }).then(async oc => { resolve(oc); });
            })
          });
        });
    };

    this.startLoadAt = performance.now();
    
    initOpenCascade({}).then(oc => this._onOcLoaded(oc, onLoaded));     
    
  
  }


  /** Load OpenCascade module async */
  async _loadOcBrowserAsync()
  {
    // This is a version of synced version but really async
    // We first try with only wasm as dynamic 
    
    const ocWasm = (await import(await this._getAbsPath(this.ocWasmModulePath))).default;
    //const ocJs = ocFullJS; // static import - This works!
    const ocJs = (await import(await this._getAbsPath(this.ocJsModulePath))).default; // And does this work?

    // https://emscripten.org/docs/api_reference/module.html#Module.locateFile
    const oc = await ocJs({ 
        locateFile(path)
        {
          if (path.endsWith('.wasm')) { return ocWasm; }
          if (path.endsWith('.worker.js') && !!worker) { return worker; }
          return path;
        }
    });
    return this._onOcLoaded(oc);
  }


  /** Load OpenCascade in Node context
   *  We use the examples from the Opencascade.js 
   */
  async _loadOcNodeAsync()
  {
      // TODO: Add fast mode to node loading process
      const ocInit = (await import(await this._getAbsPath(this.ocJsNodeModulePath))).default;
      const oc = await ocInit();
      
      // Test loading wasm directly
      // Not yet working due to WASI problems
      /*
      const oc = await this._loadWasm(await this._getAbsPath(this.ocWasmModulePath));
      console.log(oc);
      */
      
      return this._onOcLoaded(oc);
  }

  _loadOcNode(onLoaded)
  {
    this._loadOcNodeAsync().then(oc => onLoaded(oc));
  }
  
  /** When OC is loaded, we set a couple of things */
  _onOcLoaded(oc, onLoaded)
  {
    console.log(`**** OC: CAD library loaded with ${Object.keys(oc).length} functions! Took: ${ Math.round((performance.now() - this.startLoadAt) )} ms`);

    this._oc = oc;
    this._oc.SHAPE_TOLERANCE = this.SHAPE_TOLERANCE; // set tolerance
    Geom.prototype._oc = this._oc; // Geom sets it for all other OC based Classes!

    if (this.RUN_TEST){ this.runTest();}

    if (onLoaded)
    {
      onLoaded(oc);
    }
    return this._oc;
  }


  //// UTILS 

  async _getAbsPath(filepath)
  {
    if (typeof window !== 'undefined')
    {
      // Browser environment
      const absPath = new URL(filepath, import.meta.url).href;
      console.log(`==== ABS PATH BROWSER: ${absPath}`);

      return absPath;
    } 
    else 
    {
      // Node.js environment
      const { fileURLToPath } = await import('url');
      const path = await import('path');
      let curDir = path.dirname(fileURLToPath(import.meta.url)); // directory of this file
      
      // The '/' is actually needed in windows for normal ES imports 
      // But does not work work wasm files
      if(file.includes('.wasm') && curDir[0] === '/')
      { 
        curDir = curDir.slice(1); 
      } 
      const absPath = path.join(curDir, filepath);
      console.log(`==== ABS PATH NODE: ${absPath}`);

      return absPath;
    }
  }

  runTest()
  {
    console.log('---- OC Loader Test ----')
    console.log(new this._oc.gp_Vec_4(10,10,10));
  }

  searchMethod(s)
  {
    return Object.keys(this._oc).filter(k => k.indexOf(s) != -1);
  }


}
  
  

  
