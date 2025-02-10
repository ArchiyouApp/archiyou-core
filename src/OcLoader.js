/** OcLoader.js
 * 
 *  This helper class contains some black magic to have a custom build from OC.js working accross platforms:
 * 
 *   - In the browser (see OcLoader.load())
 *   - In a Node Jest enviroment (see OcLoader.loadAsync()) 
 *   - in a Node executor enviroment ( see OcLoader.loadOcNode())
 * 
 *  Please make sure you enable modern ES versions (es2017+)  to enable dynamic imports
 *  TODO: Looking into these methods a bit better might yield way better solutions!
*/

import ocFullJS from "../libs/archiyou-opencascade/archiyou-opencascade.js";
import ocFullJSFast from "../libs/archiyou-opencascade/archiyou-opencascade-fast.js";

import { Geom } from './Geom'

export default class OcLoader
{
  //// SETTINGS ////
  USE_FAST = false; // Fast is not really a big difference!
  SHAPE_TOLERANCE = 0.001;
  RUN_TEST = false;

  //// PROPERTIES ////

  _oc;
  loaded;

  constructor(onLoaded)
  {
    this.loaded = false;
    this._oc = null;

    // Tricks to dynamically load the OC Node init method in Node enviroment - NOTE: Make sure the RUNTIME_ENVIRONMENT env is set to 'node'
    if (typeof process !== 'undefined' && process.release?.name === 'node')
    {
      this.initOcNode = this.loadOcNode();
    }
    // do a little warning if not .env
    else if(!process.env.RUNTIME_ENVIRONMENT)
    {
      console.error(`No RUNTIME_ENVIRONMENT set. If you are testing you need a .env! Please make one and set RUNTIME_ENVIRONMENT to node!`)
    }
  }

  /** Load async in node environment */
  async loadOcNode()
  {
    const lib = '../libs/archiyou-opencascade/node.js'
    const { default: libFunc } = await import(lib);
    return libFunc;
  }

  /** Load sync in browser using the standard OC.js method **/
  load(onLoaded)
  {  
    // taken from official OC.js approach and added dynamic wasm loading to keep Node happy
    const initOpenCascade = ({
      mainJS = (this.USE_FAST) ? ocFullJSFast : ocFullJS,
      worker = undefined,
      } = {}) => {
      return new Promise((resolve, reject) => 
      {
        import(`../libs/archiyou-opencascade/archiyou-opencascade${(this.USE_FAST) ? '-fast' : ''}.wasm`)
        .then( async wasmModule => 
        {
          let mainWasm = wasmModule.default;
          new mainJS({
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
    };

    this.startLoadAt = performance.now();
    
    initOpenCascade({}).then(oc => this.onReady(oc, onLoaded));     
  }

  /* Used in Jest enviroment */
  loadAsync()
  {
    // for timing
    this.startLoadAt = performance.now();

    let curScope = this;

    return new Promise(function(onLoaded,rejected)
    {   
        curScope.initOcNode.then((initOcFunc) =>
          {
            initOcFunc({ }).then(oc => curScope.onReady(oc, onLoaded));
          })
    })
    
  }

  onReady(oc, onLoaded)
  {
    console.log(`**** OC: CAD library loaded with ${Object.keys(oc).length} functions! Took: ${ Math.round((performance.now() - this.startLoadAt) )} ms`);

    this._oc = oc;
    this._oc.SHAPE_TOLERANCE = this.SHAPE_TOLERANCE; // set tolerance
    Geom.prototype._oc = this._oc; // Geom sets it for all other OC based Classes!

    if (this.RUN_TEST)
    {
      this.runTest();
    }

    // run on loaded function
    if (onLoaded)
    {
      onLoaded(oc);
    }

    return this._oc;
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
  
  

  
