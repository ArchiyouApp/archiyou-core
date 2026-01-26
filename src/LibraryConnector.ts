/**
 *  Access the Archiyou library of scripts for execution by Runner 
 *  The library can connect to the older publishing library (python)
 *  or an instance of the new one (ts/js)
 * 
 *  NOTE: We try to keep compatibility with both libraries as much as possible
 */

import { PublishScript } from './types';
import { Script, ScriptData } from './internal';


import semver from 'semver';

export class LibraryConnector
{
    //// SETTINGS ////
    DEFAULT_LIBRARY_URL = 'https://pubv2.archiyou.com'; // default library URL
    LIBRARY_ENDPOINTS = {
        v1: { 
                all: '/search' // all scripts 
            },
        v2: {
            all: '/scripts' // all scripts
        }
    }
    //// END SETTINGS ////
    
    domain:string; // https://domain.com
    version:'v1'|'v2'; // library version

    constructor(domain?:string)
    {
        if(!domain || domain === '')
        {
            console.error(`LibraryConnector::constructor(): No domain supplied. Using default library domain: "${this.DEFAULT_LIBRARY_URL}"`);
            this.domain = this.DEFAULT_LIBRARY_URL;
        }
        else if(!this._validateDomain(domain))
        {
            console.error(`LibraryConnector::constructor(): Please supply a valid domain of the library. Got: "${domain}". Default library URL will be used instead.`);
            this.domain = this.DEFAULT_LIBRARY_URL;
        }
        else {
            this.domain = this._validateDomain(domain) as string;
            console.info(`LibraryConnector::constructor(): Using library domain: "${this.domain}"`);
        }
    }

    /**
     * Detect if a string is a domain (with or without protocol). Returns the origin string or false.
     * Accepts:
     *  - example.com
     *  - https://example.com
     *  - http://example.com:8080
     *  - sub.domain.example.com/
     *
     * Rejects strings that contain path segments beyond an optional trailing slash:
     *  - https://example.com/path -> false
     */
    _validateDomain(value: string): string|false
    {
        if (!value || typeof value !== 'string') return false;

        const trimmed = value.trim();

        // Prepend https:// if no protocol provided to allow URL parsing
        const withProto = /^[a-zA-Z]+:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;

        try {
            const parsed = new URL(withProto);

            // Only allow http/https
            if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
            if (!parsed.host) return false;
            if (parsed.username || parsed.password) return false;
            if (parsed.pathname && parsed.pathname !== '/' && parsed.pathname !== '') return false;

            // Disallow query or fragment
            if (parsed.search || parsed.hash) return false;

            return parsed.origin;
        } 
        catch (err) 
        {
            return false;
        }
    }


    /** Just request base url and see if we get some results */
    async connect():Promise<boolean>
    {
        return fetch(this.domain)
            .then((response) => 
            {
                if (!response.ok) {
                    throw new Error(`Library connection failed: ${response.statusText}`);
                }
                return response.json();
            }).then((data) => {
                this.version = this._getLibraryVersion(data);
                console.log(`Library connection successful. Connected to ${this.domain}: Library version: "${this.version}"`);
                return true;
            })
            .catch((error) => {
                console.error('Error connecting to library:', error);
                throw error;
            });
    }

    _getLibraryVersion(info?:Record<string,any>):'v1'|'v2'|null
    {
        // Old library (v1) return { library, maintainer, maintainer_email }
        // New one (v2): { success, data: { name, version, maintainer, email }}
        if(!info) return null;
        return (info?.success) ? 'v2' : 'v1';
    }
    
    /** Get all script versions */
    async getAllScripts():Promise<Array<Script>>
    {
        return fetch(`${this.domain}${this.LIBRARY_ENDPOINTS[this.version].all}`)
            .then((response) => {   
                if (!response.ok) {
                    throw new Error(`Failed to fetch scripts: ${response.statusText}`);
                }
                return response.json();
            })
            .then((res) => {
                // either direct scripts or in data
                const scriptsRaw = (this.version === 'v2') ? res.data : res;
                return scriptsRaw.map(s => new Script().fromData(s)).filter(s => s !== null);
            })
            .catch((error) => {       
                console.error('LibraryConnector::getAllScripts():Error fetching scripts:', error);
                throw error;
            });
    }


    /** Get only the latest script versions */
    async getLatestScripts():Promise<Array<Script>>
    {
        const scripts = await this.getAllScripts();

        // Group scripts by name and find the latest version
        const latestScripts = Object.values(
            scripts.reduce((acc, script) => {
                if (!acc[script.name] || semver.gt(script?.published?.version, acc[script.name].published.version))
                {
                    acc[script.name] = script; // Keep the script with the latest version
                }
                return acc;
            }, {} as Record<string, Script>)
        );

        return latestScripts;
    }

    /** Get specific script */
    async getScript(author:string, name:string, version?:string):Promise<Script|null>
    {
        const scripts = await this.getAllScripts();

        const script = scripts.find(s => 
                            s.author.toLowerCase() === author.toLowerCase() 
                            && s.name.toLowerCase() === name.toLowerCase() 
                            && (!version || s.published.version === version));

        return script || null;
    }

    async getLatestScript(author:string, name:string):Promise<Script|null>
    {
        const scripts = await this.getLatestScripts();
        const script = scripts.find(s => 
            s.author.toLowerCase() === author.toLowerCase() 
            && s.name.toLowerCase() === name.toLowerCase());
        return script || null;
    }

    async getScriptVersions(author:string, name:string):Promise<Array<string>>
    {
        const scripts = await this.getAllScripts();
        const versions = scripts
                            .filter(s => 
                                s.author.toLowerCase() === author.toLowerCase() 
                                && s.name.toLowerCase() === name.toLowerCase())
                            .map(s => s.published.version);
        return versions;
    }

    /** Readout basic info on Library */
    async printLibraryOverview():Promise<void>
    {
        const baseInfo = await this.connect();
        if(baseInfo)
        {
            console.info('**** Library Overview ****');
            console.info(`URL: ${this.DEFAULT_LIBRARY_URL}`);
            Object.keys(baseInfo).forEach((key) => { console.info(`- ${key}: ${baseInfo[key]}`);});

            const scripts = await this.getAllScripts();
            const latestScripts = await this.getLatestScripts();
    
            // Log the latest scripts
            console.log(`**** ${latestScripts.length} Scripts in Library ****`);
            latestScripts.forEach((script) => 
            {
                const numberOfVersions = scripts.filter(s => s.name === script.name).length;
                console.log(`* Script: ${script.name} [v${script.published.version} of ${numberOfVersions} versions]`);
            });
        }
    }

    /** Get script from a URL 
     *  
     *  If no https://domain is given, default library URL is used
     *  Otherwise a new instance of LibraryConnector is created for that domain
     * 
     *  @param path - path to fetch the script from 
     *     
     *     examples: 
     *         - https://pub.archiyou.com/archiyou/simplestep
     *         - https://pubv2.archiyou.com/archiyou/simplestep/0.9.1 or https://pub.archiyou.com/archiyou/simplestep:0.9.1
     *         - archiyou/simplestep (default library)
     * 
     
     *  @returns Promise<Script> - The script object with code and params
     */
    async getScriptFromUrl(url:string):Promise<Script>
    {
        const m = url.match(/^(?:(?<domain>https?:\/\/[^/]+)\/)?(?<author>[^/]+)\/(?<scriptname>[^/:]+)(?:[:/](?<version>[^/]+))?\/?$/);

        if(!m)
        {
            throw new Error(`LibraryConnector::getScriptFromUrl(): Invalid URL format: "${url}"`);
        }
        else
        {
            let { domain, author, scriptname, version } = m.groups;

            // First check if path has domain that is different than current library
            let currentLibraryConnector;

            if(domain.toLowerCase() !== this.domain.toLowerCase())
            {
                console.info(`LibraryConnector::getScriptFromUrl(): Different domain detected in URL. Creating new LibraryConnector for domain: "${domain}"`);

                currentLibraryConnector = new LibraryConnector(domain);
                const r = await currentLibraryConnector.connect(); // connect to new library
                if(!r)
                {
                    throw new Error(`LibraryConnector::getScriptFromUrl(): Failed to connect to library at domain "${domain}"`);
                }
            }
            else {
                currentLibraryConnector = this; // use current instance
            }
            
            // If version is not given: get latest
            if(!version)
            {
                try {
                    const versions = await (await fetch(`${url}/versions`)).json();
                    if (!Array.isArray(versions) || versions.length === 0)
                    {
                        throw new Error(`No versions found for script "${scriptname}" at URL "${url}". Probably the script does not exist!`);
                    }
                    version = versions[versions.length - 1]; // assuming versions are sorted by version number
                    console.info(`LibraryConnector::getScriptFromUrl(): No version specified in URL. Got latest "${version}" from  ${versions.join(', ')})`);                
                }
                catch(error)
                { 
                    throw new Error(`Failed to fetch versions from URL "${url}": ${error.message}`);
                }
            }

            const script = await (currentLibraryConnector as LibraryConnector).getScript(author, scriptname, version);
            if(!script)
            {
                throw new Error(`LibraryConnector::getScriptFromUrl(): Script not found at URL: ${url}`);
            }
            else {
                console.info(`LibraryConnector::getScriptFromUrl(): Successfully fetched script "${scriptname}" (v${version}) from URL: ${url}`);
            }
            return script            
        }
        
    }

}