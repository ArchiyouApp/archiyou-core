/**
 * 
 *  Global init function of BREP kernel based on OpenCascade
 *  Uses OcLoader
 */

import type { ArchiyouApp } from './internal';
import { OcLoader } from './internal'

// global Archiyou app with modules
// every module instance registers itself here
export let _ay = {} as ArchiyouApp;
export function getArchiyou(): ArchiyouApp 
{
  return _ay;
}
export function setArchiyou(ay:Partial<ArchiyouApp>):void
{
    _ay = { ..._ay, ...ay };
}

export async function init()
{
    // Check if already initialized
    if (_ay.oc) {
        console.warn('init(): Already initialized, skipping...');
        return _ay;
    }

    const ocLoader = new OcLoader();
    await ocLoader.loadAsync();

    // Set basic global _ay 
    console.info(`OcLoader::_onOcLoaded(): Setting global _ay`);

    setArchiyou({
        oc: ocLoader._oc
    });

    return _ay;
}