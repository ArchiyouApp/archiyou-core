/** OcLoader.js
 * 
 *  This helper class contains some black magic to have a custom build from OC.js working accross environments and modes:
 * 
 *    - Synchronous (with callback) or as async function: load(), loadAsync()
 *    - In a browser or node - The context is detected automatically
 *  
 *    NOTES: 
 *      - Please make sure you enable modern ES versions (es2017+) to enable dynamic imports
 *      - We have this as JS, not TS to avoid any issues with the dynamic imports
 *      - If using relative path in dynamic imports we need to make resolve them to absolute paths (otherwise they are resolved relative to the file that imports this module)
 *  
 *    TESTED RUNTIMES:
 *      - Browser: in main or web worker
 *      - Node v18lts
 *     
 *    TESTED BUILD TOOLS:
 *      - Vite / Vitest (Nuxt3+)
 *      - Webpack 4 (Nuxt2)
 *   
*/

import { Brep } from './Brep'

// For browser we refer to the module 
// For node we just add /src/wasm folder
import ocFullJS from "./wasm/archiyou-opencascade.js";
//import ocFullJSFast from "../wasm/archiyou-opencascade.js"; 
//import ocFullWasm from "./wasm/archiyou-opencascade.wasm?url"; // DEBUG


export class OcLoader
{
  //// SETTINGS ////
  SHAPE_TOLERANCE = 0.001;
  RUN_TEST = false;

  //// IMPORTANT PATHS ////
  /* We copy wasm and Emscripten glue files directly from src/wasm to dist/wasm 
     Relative paths remain to same
  */

  ocJsModulePath = `./wasm/archiyou-opencascade.js`;
  ocJsNodeModulePath = `./wasm/node.js`;
  ocWasmModulePath = `./wasm/archiyou-opencascade.wasm`;

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
    /** Taken from OC.js with some small changes
     *  This uses a static import for the JS module - which still seems to be the most robust
     *  Use this method is everything else fails
     */
    const initOpenCascade = () => 
    {
      return new Promise((resolve, reject) => 
      {
        this._getAbsPath(this.ocWasmModulePath)
        .then(async (wasmPath) =>
        {
            //import(/* webpackIgnore: true */ wasmPath) // webpackIgnore works for webpack 5, not 4 
            // Webpack 4 needs real paths in the import statement on build time 
            // [Not working] Replace import(wasmPath) with import('./wasm/archiyou-opencascade.wasm') to make it work in webpack 4
            import('./wasm/archiyou-opencascade.wasm?url') // Webpack 4 needs this to be able to serve the wasm file, ?url is to avoid errors in Vite
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


  /** Load OpenCascade module async 
   *  Uses static import for maximum compatibility
   *  This can work in Webpack 4 and above, Vite and Node environments
  */
  async _loadOcBrowserAsync()
  {
    console.log(`OcLoader::_loadOcBrowserAsync(): Loading OpenCascade WASM module`);
    // We first try with only wasm as dynamic 
    const wasmPath = await this._getAbsPath(this.ocWasmModulePath);
    //const wasmPath = await this._getAbsPath('./wasm/archiyou-opencascade.wasm'); 
    const ocWasm = (await import(/* webpackIgnore: true */ wasmPath)).default;
    const ocJs = ocFullJS; // static import - This works!
    //const ocJs = (await import(await this._getAbsPath(this.ocJsModulePath))).default; // Problem in Webpack 4

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


  /** Load OpenCascade in Node context */
  async _loadOcNodeAsync()
  {
      const modulePath = await this._getAbsPath(this.ocJsNodeModulePath);
      
      console.info(`OcLoader::_loadOcNodeAsync(): Loading OpenCascade module at: ${modulePath}}`);
      const ocInit = (await import(modulePath)).default;
      const oc = await ocInit();

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
    Brep.prototype._oc = this._oc; // Brep sets it for all other OC based Classes!

    if (this.RUN_TEST){ this.runTest();}

    if (onLoaded)
    {
      onLoaded(oc, this); // oc and current runner instance as arguments to callback
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
        return filepath.replace('./', '/'); // make absolute
    }
    else 
    {
      // Node.js environment
      // NOTE: webpackIgnore only works in Webpack 5 to avoid processing imports on buildtime
      const { fileURLToPath } = await import(/* webpackIgnore: true */ 'url');
      const path = await import('path');
      
      // Only placing import.meta.url in the code for webpack 4 causes a error: "Module parse failed: Unexpected token"
      // Does not work: Object(import.meta).url; 
      // NOTE: We use a webpack 4 babel-loader to replace import.meta.url
      const fileURL = import.meta.url; 
      const curDir = path.dirname(fileURLToPath(fileURL)); // directory of this file
      
      // The '/' is actually needed in windows for normal ES imports 
      // But does not work with wasm files
      // NOTE: test this
      if(filepath.includes('.wasm') && curDir[0] === '/')
      { 
        curDir = curDir.slice(1); 
      } 
      
      let absPath = path.join(curDir, filepath);

      // We need to add file:// to get this working on windows
      if(process.platform === 'win32')
      {
        absPath = 'file://' + absPath; // Add file:// to the path
      }

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
  
  

  
