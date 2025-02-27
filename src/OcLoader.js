/** OcLoader.js
 * 
 *  This helper class contains some black magic to have a custom build from OC.js working accross environments and modes:
 * 
 *    - Synchronous (with callback) or as async function: load(), loadAsync()
 *    - In a browser or node (that includes jest testing) - The context is detected automatically
 *
 *  Please make sure you enable modern ES versions (es2017+) to enable dynamic imports
*/

import { Geom } from './Geom'

export default class OcLoader
{
  //// SETTINGS ////
  USE_FAST = false; // Fast is not really a big difference!
  SHAPE_TOLERANCE = 0.001;
  RUN_TEST = false;

  //// CALCULATED

  ocJsModulePath = `../libs/archiyou-opencascade/archiyou-opencascade${(this.USE_FAST) ? '-fast' : ''}.js`;
  ocJsNodeModulePath = `../libs/archiyou-opencascade/node.js`;
  ocWasmModulePath = `../libs/archiyou-opencascade/archiyou-opencascade${(this.USE_FAST) ? '-fast' : ''}.wasm`

  //// PROPERTIES ////

  _oc;
  loaded;

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
    return (typeof process !== 'undefined' && process.release?.name === 'node') ? 'node' : 'browser';
  }

  /** Load OpenCascade module synchronous and run function when loading is done */
  _loadOcBrowser(onLoaded)
  {
    this._loadOcBrowserAsync().then(oc => onLoaded(oc));
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
      this._onOcLoaded(oc);
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
  
  

  
