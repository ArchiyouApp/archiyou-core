/** OcLoader.js
 * 
 *  This helper class contains some black magic to have a custom build from OC.js working accross environments and modes:
 * 
 *    - Synchronous (with callback) or as async function: load(), loadAsync()
 *    - In a browser or node (that includes jest testing) - The context is detected automatically
 *
 *  
 *    NOTES: 
 *      - For some reason dynamic imports don't work well in Webpack DEV server. It looks like something to do with setting up the wasm serving (Wrong MIME type). 
 *      - Please make sure you enable modern ES versions (es2017+) to enable dynamic imports
 *      - We have this as JS, not TS to avoid any issues with the dynamic imports
*/

import { Geom } from './Geom'

import ocFullJS from "../wasm/archiyou-opencascade.js";
import ocFullJSFast from "../wasm/archiyou-opencascade.js";

export class OcLoader
{
  //// SETTINGS ////
  USE_FAST = false; // Fast is not really a big difference!
  SHAPE_TOLERANCE = 0.001;
  RUN_TEST = false;

  //// CALCULATED

  ocJsModulePath = `../wasm/archiyou-opencascade${(this.USE_FAST) ? '-fast' : ''}.js`;
  ocJsNodeModulePath = `../wasm/node.js`;
  ocWasmModulePath = `../wasm/archiyou-opencascade${(this.USE_FAST) ? '-fast' : ''}.wasm`

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

  _getContext()
  {
    // NOTE: some problems with process in Jest
    const isBrowser = (typeof globalThis.window !== "undefined")
    return isBrowser ? 'browser' : 'node'
  }
  

  /** Load OpenCascade module synchronous and run function when loading is done */
  _loadOcBrowser(onLoaded)
  {
    this._loadOcGeneric.then((oc) => this._onOcLoaded(oc, onLoaded));     
  }

  /** Function from Opencascade.js */
  _loadOcGeneric()
  {
     return new Promise((resolve, reject) => 
      {
        import(`../wasm/archiyou-opencascade.wasm?url`)
        .then( async wasmModule => 
        {
          const mainWasm = wasmModule.default;
          new ocFullJS({
            locateFile(path) { // Module.locateFile: https://emscripten.org/docs/api_reference/module.html#Module.locateFile
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
  }


  /** Load OpenCascade module async */
  async _loadOcBrowserAsync()
  {
    const ocJs = (await import(this.ocJsModulePath)).default;
    const ocWasm = (await import(this.ocWasmModulePath)).default;
    const oc = await new ocJs({
      locatePath(path) // Module.locateFile: https://emscripten.org/docs/api_reference/module.html#Module.locateFile
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
      const ocInit = (await import(this.ocJsNodeModulePath)).default;
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
    Geom.prototype._oc = this._oc; // Geom sets it for all other OC based Classes!

    if (this.RUN_TEST){ this.runTest();}

    if (onLoaded)
    {
      onLoaded(oc);
    }
    return this._oc;
  }


  //// UTILS 

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
  
  

  
