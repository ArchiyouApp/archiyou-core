/**
 *  Access the Archiyou library of scripts for execution by Runner 
 */

import { PublishScript } from './types';
import semver from 'semver';

export class Library
{
    //// SETTINGS ////
    DEFAULT_LIBRARY_URL = 'https://pub.archiyou.com'; // default library URL
    LIBRARY_ENDPOINTS_ALL_SCRIPTS = '/search';

    constructor()
    {


    }

    /** Just request base url and see if we get some results */
    async connectTest():Promise<Record<string, any>>
    {
        return fetch(`${this.DEFAULT_LIBRARY_URL}`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Library connection failed: ${response.statusText}`);
                }
                return response.json();
            }).then((data) => {
                console.log('Library connection successful:', data);
                return data;
            })
            .catch((error) => {
                console.error('Error connecting to library:', error);
                throw error;
            });
    }

    /** Get all script versions */
    async getAllScripts():Promise<Array<PublishScript>>
    {
        return fetch(`${this.DEFAULT_LIBRARY_URL}${this.LIBRARY_ENDPOINTS_ALL_SCRIPTS}`)
            .then((response) => {   
                if (!response.ok) {
                    throw new Error(`Failed to fetch scripts: ${response.statusText}`);
                }
                return response.json();
            })
            .then((data) => {
                return data as Array<PublishScript>;
            })
            .catch((error) => {       
                console.error('Error fetching scripts:', error);
                throw error;
            });
    }

    /** Get only the latest script versions */
    async getLatestScripts():Promise<Array<PublishScript>>
    {
        const scripts = await this.getAllScripts();

        // Group scripts by name and find the latest version
        const latestScripts = Object.values(
            scripts.reduce((acc, script) => {
                if (!acc[script.name] || semver.gt(script.version, acc[script.name].version))
                {
                    acc[script.name] = script; // Keep the script with the latest version
                }
                return acc;
            }, {} as Record<string, PublishScript>)
        );

        return latestScripts;
    }

    /** Readout basic info on Library */
    async getLibraryOverview():Promise<void>
    {
        const baseInfo = await this.connectTest();
        if(baseInfo)
        {
            console.log('Library Overview:');
            console.log(`URL: ${this.DEFAULT_LIBRARY_URL}`);
            Object.keys(baseInfo).forEach((key) => { console.log(`- ${key}: ${baseInfo[key]}`);});

            const scripts = await this.getAllScripts();
            const latestScripts = await this.getLatestScripts();
    
            // Log the latest scripts
            console.log(`**** ${latestScripts.length} Scripts in Library ****`);
            latestScripts.forEach((script) => 
            {
                const numberOfVersions = scripts.filter(s => s.name === script.name).length;
                console.log(`* Script: ${script.name} [v${script.version} of ${numberOfVersions} versions]`);
            });
        }
    }

    /** Get from basic url
     *  Do some checks and return the script
     *  @param url - URL to fetch the script from 
     *     examples: https://pub.archiyou.com/archiyou/simplestep
     *              https://pub.archiyou.com/archiyou/simplestep/0.9.1 or https://pub.archiyou.com/archiyou/simplestep:0.9.1
     *  @returns Promise<PublishScript> - The script object with code and params
     */
    async getScriptFromUrl(url:string):Promise<PublishScript>
    {
        const m = url.match(/^https:\/\/(?<domain>[^/]+)\/(?<library>[^/]+)\/(?<scriptname>[^/:]+)(?:[:/](?<version>[^/]+))?\/?$/);
        if(m?.groups)
        {
            let { domain, library, scriptname, version } = m.groups;

            // if no version, get the latest version
            if(!version)
            {
                try {
                    const versions = await (await fetch(`${url}/versions`)).json();
                    if (!Array.isArray(versions) || versions.length === 0)
                    {
                        throw new Error(`No versions found for script "${scriptname}" at URL "${url}". Probably the script does not exist!`);
                    }
                    version = versions[versions.length - 1]; // assuming versions are sorted by version number
                    console.info(`Library::getScriptFromUrl(): No version specified in URL. Got latest "${version}" from  ${versions.join(', ')})`);                
                }
                catch(error)
                { 
                    throw new Error(`Failed to fetch versions from URL "${url}": ${error.message}`);
                }
            }

            const scriptUrl = `https://${domain}/${library}/${scriptname}/${version}/script`; // get only script data
            console.log(`Library::getScriptFromUrl(): Fetching script from URL: ${scriptUrl}`);
    
            try {
                return await (await fetch(scriptUrl)).json() as PublishScript;
            }   
            catch(error) {
                console.error(`Library::getScriptFromUrl(): Error fetching script from URL "${scriptUrl}":`, error);
                throw new Error(`Failed to fetch script from URL "${scriptUrl}": ${error.message}`);
            }
        }

        return null as PublishScript; // return null if URL does not match expected format

      
    }


}