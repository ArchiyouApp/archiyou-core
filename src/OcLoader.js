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
    
    if(this._getContext() === 'browser' || this._getContext() === 'webworker')
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

    if(this._getContext() === 'browser' || this._getContext() === 'webworker')
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
    const isBrowser = (typeof globalThis.window !== "undefined");
    const isWebWorker = (typeof self !== 'undefined' && typeof window === 'undefined');
    return isBrowser ? 'browser' : isWebWorker ? 'webworker' : 'node';
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
        //this._getAbsPath('./wasm/archiyou-opencascade.wasm')
        .then(async (wasmPath) =>
        {
            console.log(wasmPath);
            //import(/* webpackIgnore: true */wasmPath) // TODO: Can the right path be resolved here? - 
            import('./wasm/archiyou-opencascade.wasm')
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
  /*
  async _loadOcBrowserAsync()
  {
    console.log(`OcLoader::_loadOcBrowserAsync(): Loading OpenCascade WASM module`);
    // This is a version of synced version but really async
    // We first try with only wasm as dynamic 
    //const wasmPath = await this._getAbsPath(this.ocWasmModulePath);
    const wasmPath = await this._getAbsPath('./wasm/archiyou-opencascade.wasm'); 
    const ocWasm = (await import(wasmPath)).default;
    //const ocJs = ocFullJS; // static import - This works!
    //const ocJs = (await import(await this._getAbsPath(this.ocJsModulePath))).default; // And does this work?
    const ocJs = (await import(await this._getAbsPath('./wasm/archiyou-opencascade.js'))).default; // And does this work?

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
  */


  /** Load OpenCascade in Node context */
  // TMP DISABLED FOR DEBUG IN WEBPACK4
  ///*
  async _loadOcNodeAsync()
  {
      // TODO: Add fast mode to node loading process
      const modulePath = await this._getAbsPath(this.ocJsNodeModulePath);
      const ocInit = (await import(/* webpackIgnore: true */ modulePath)).default;
      const oc = await ocInit();

      return this._onOcLoaded(oc);
      
  }
  //*/

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
    // Browser environment or Webworker
    if (this._getContext() === 'browser') 
    {
      // import.meta.url does not work in webpack < 5
      // also anything with import triggers errors in webpack 4 on build time: so we can't even reference import.meta.url!
      const fileURL = document.currentScript.src; 
      const absPath = new URL(filepath, fileURL).href;
      console.log(`==== ABS PATH BROWSER: ${absPath}`);

      return absPath;
    } 
    else if(this._getContext() === 'webworker')
    {
        // Since in webpack 4 we can't use import.meta.url
        // And document.currentScript.src does not work in webworker
        // We just pass the filepath - which seems to work in webworkers
        // TODO: test in multiple enviroments
        console.warn(`==== ABS PATH WEBWORKER: Can't make absolute path, but that might be fine too in webworkers. Returned original path: "${filepath}"`);
        return filepath;
    }
    else 
    {
      // Node.js environment
      const pathMode = 'url';
      // NOTE: webpackIgnore only works in Webpack 5
      const { fileURLToPath } = await import(/* webpackIgnore: true */ pathMode);
      const path = await import('path');
      const fileURL = typeof document !== 'undefined' ? document.currentScript.src : ''; // import.meta.url does not work in webpack < 5
      //const fileURL = import.meta.url; // Use import.meta.url in Webpack 5
      const curDir = path.dirname(fileURLToPath(fileURL)); // directory of this file
      
      // The '/' is actually needed in windows for normal ES imports 
      // But does not work work wasm files
      /*
      if(filepath.includes('.wasm') && curDir[0] === '/')
      { 
        curDir = curDir.slice(1); 
      } 
      */
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
  
  

  
