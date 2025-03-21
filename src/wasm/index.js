import ocFullJS from "./archiyou-opencascade.js";
import ocWasm from "./archiyou-opencascade.wasm";

const initOpenCascade = ({
  mainJS = ocFullJS,
  mainWasm = ocWasm, // for some reason we need to supply a string here, not import
  worker = undefined,
  libs = [],
  module = {},
} = {}) => {
  return new Promise((resolve, reject) => {
    new mainJS({
      locateFile(path) {
        if (path.endsWith('.wasm')) {
          return mainWasm;
        }
        if (path.endsWith('.worker.js') && !!worker) {
          return worker;
        }
        return path;
      },
      ...module
    }).then(async oc => {
      for (let lib of libs) {
        await oc.loadDynamicLibrary(lib, { loadAsync: true, global: true, nodelete: true, allowUndefined: false });
      }
      resolve(oc);
    });
  });
};

export default initOpenCascade;