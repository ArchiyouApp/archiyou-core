/**
 * 
 *  Global init function of BREP kernel based on OpenCascade
 *  Uses OcLoader
 */

import { OcLoader } from './internal'

export async function init()
{
    // TODO: avoid double init
    const ocLoader = new OcLoader();
    await ocLoader.load();
}