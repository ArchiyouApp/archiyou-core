/**
 *  Module for loading and parsing external data sources
 * 
 */

import { Geom } from "./Geom";
import { AnyShape, ShapeCollection, Sketch } from "./internal";

import parseSVG from "svg-path-parser"; // https://github.com/hughsk/svg-path-parser
const makeAbsolute = parseSVG.makeAbsolute; //
import * as txml from 'txml'; // for XML parsing because DOMParser is not available in a WebWorker: https://github.com/tobiasnickel/tXml


interface Asset
{
    source:string
    valid:boolean
    locationType: 'url'|'local'; // on the web or on AY
    url:string
    localId:string
    formatType: 'data'|'geodata'|'vector'|'bitmap'|'api'
    format: string // TODO: more formats possible: jpg
    content?:any // raw content
    fetchError?:string
    imported?:any // Shape or data ready for Archiyou
}

interface SvgTransform 
{
    x:number
    y:number
}

export class IO
{
    _oc:any;
    _geom:Geom;
    
    source:string;
    asset:Asset // last asset
    cache:{[key:string]:Asset} = {}; // save all assets

    // SETTINGS
    FORMAT_TO_TYPE = {
        svg: 'vector',
        json: 'data',
        geojson: 'geodata',
        jpg: 'bitmap',
        gif: 'bitmap',
        png: 'bitmap',
    }

    constructor(geom:Geom)
    {
        console.log('IO::constructor');
        this._geom = geom;
        this._oc = this?._geom?._oc;
    }

    async load(source:string, forceFetch:boolean=false, onlyCache:boolean=false)
    {
        console.log(`IO::load: ${source}`);

        this.source = source;
        let cachedAsset = await this._getAssetFromCache(source);

        if (cachedAsset && !forceFetch)
        {
            return cachedAsset;
        }
        else if (!onlyCache)
        {
            // fetch
            let asset = this._parse(this.source);
            let fetchedAsset = await this._fetch(asset);
            let importedAsset = this._importAsset(fetchedAsset); // set in cache automatically
            
            return importedAsset;
        }
        else {
            console.error(`IO:load: onlyCached forced, but nothing in cache under source ${source}`)
            return null;
        }
    }

    /** Load directly from hot cache (no async) */
    loadFromCache(source:string):AnyShape|ShapeCollection
    {
        let cachedAsset = this.cache[source];

        return cachedAsset?.imported || null;
    }
    
    _parse(source:string):Asset
    {
        const locationType = (source.includes('https')) ? 'url' : null;
        const url = (locationType === 'url') ? source : null;
        const localId = null; // TODO if we have local asset management
        const format = url.split('.').slice(-1)[0];
        const formatCheck = Object.keys(this.FORMAT_TO_TYPE).includes(format);
        const formatType = this.FORMAT_TO_TYPE[format];

        // TODO: api

        // basic checks
        const valid = (url && formatCheck && format && formatType) != null;

        // AssetInfo
        return {
            source: source,
            valid: valid,
            locationType: locationType,
            url: url,
            localId: localId,
            formatType: formatType,
            format: format,
        }

    }

    async _getAssetFromCache(source:string)
    {
        // to have it consistent with fetch we return a promise
        let compScope = this;
         let promise = new Promise((resolve, reject) => {
            resolve(compScope.cache[source]);
        });

        return promise as any; // avoid TS error
    }

    async _fetch(asset:Asset)
    {        
        let fetchedAsset = await this._fetchAsset(asset);
        return fetchedAsset;
    }

    async _fetchAsset(asset:Asset)
    {
        if(asset.locationType === 'url')
        {

            switch(asset.format)
            {
                // TODO: more cases
                default:

                    try
                    {
                        let r = await fetch(asset.source, { 
                            method : 'GET',
                            headers: {
                                'Content-type': `text/plain`,
                            },
                        })

                        let loadedAsset = await this._handleFetchedAsset(asset,r);
                        return loadedAsset
                    }
                    catch(e)
                    {
                        this._handleFetchedAssetError(asset)
                        return null;
                    }
            }

          
        }

        // TODO: fetch from API
    }

    async _handleFetchedAsset(asset:Asset, response:any)
    {
        const content = await response.text();
        
        let fetchedAsset = { ...asset, content:content };
        // NOTE: we only set asset in cache when also content is imported to Shapes or data
        return fetchedAsset;
    }

    _handleFetchedAssetError(asset:Asset)
    {
        throw new Error(`IO::_fetch: Failed to fetch asset ${asset.source}: Check if it exists or the server allowes downloading from other domains!`);
    }

    /** Convert and import fetched asset to Archiyou entity: either some Shape or raw data like a text or json data structure */
    _importAsset(asset:Asset):any // TODO: shape, string or Object
    {
        if(!asset.content)
        {
            console.error(`IO::_importAsset: Skipped asset "${asset.source}" because it has no content (probably an invalid source)`);
            return null;
        }

        let imported;
        switch(asset.format)
        {
            case 'svg':
                imported = this._importSVG(asset);
                break;
            default:
                // TODO: give error
                imported = null;
        }

        // place asset (incuding imported ) cache
        let importedAsset = { ...asset, imported: imported };

        this.cache[asset.source] = importedAsset;

        return importedAsset
    }   

    _importSVG(asset:Asset)
    {
        // see for overview: https://developer.mozilla.org/en-US/docs/Web/SVG
      
        if(!asset)
        {
            console.log('IO::_importSVG: Skipped invalid SVG')
            return null;
        }

        let svgNodesWithTransform;
        try 
        {
            let svgTree = txml.parse(asset.content);
            svgNodesWithTransform = this._getSvgNodesRecursive(svgTree); // [{ node: { tagName, attributes }, transform: {x,y}  }]
        }
        catch(e)
        {
            console.log(`IO::_importSVG: parse error. Check if valid SVG!`);
            return null;
        }

        if (!this._oc)
        {
            throw new Error(`IO:_importSVG: Cannot import SVG without reference to geom in constructor!`)
        }

        let svgShapeCollection = new ShapeCollection();
        svgShapeCollection.name('importedSVG');

        // parse SVG nodes
        svgNodesWithTransform.forEach( nodeAndTransform => 
        {
            let node = nodeAndTransform.node;
            let transform = nodeAndTransform.transform;
            let nodeName = node.tagName;
            let shapeOrShapes;

            switch(nodeName)
            {
                case 'path':
                    shapeOrShapes = this._importSVGPath(node.attributes.d, transform);
                    shapeOrShapes.setName(this._geom.getNextObjName('ImportedSVGPath'));
                    break;
            }
            svgShapeCollection.add(shapeOrShapes)
        });

        // because SVG has a y-axis that points down we mirror the imcoming shapes
        //svgShapeCollection = svgShapeCollection._mirroredX(); // mirror around center of ShapeCollection

        return svgShapeCollection;
        
    }

    _getSvgNodesRecursive(svgTree, svgNodesWithTransform = [], parentTransform:SvgTransform = { x: 0, y: 0 })
    {
        /* svgTree structure
            [elem,elem] with elem { tagName, attributes : {}, children: [elem,elem..]}
        */
        const TRAVERSE_DEEPER_TAGS = ['svg','g']; 
        const VALID_SVG_TAGS = [
            'path',
            'polygon',
            'circle',
            'line',
            'polyline',
            'rect',
            // text
        ]

        svgTree.forEach(elem => 
        {
            // traverse deeper
            if (TRAVERSE_DEEPER_TAGS.includes(elem.tagName))
            {
                // traverse deeper, but do take transform with if in attributes
                const transform = elem.attributes.transform ? this._parseTransformString(elem.attributes.transform) : parentTransform;
                svgNodesWithTransform = this._getSvgNodesRecursive(elem.children, svgNodesWithTransform, transform)
            }
            // a valid graphic element
            else if (VALID_SVG_TAGS.includes(elem.tagName))
            {
                let localNodeTransform = elem.attributes.transform ? this._parseTransformString(elem.attributes.transform) : { x: 0, y: 0 };
                let nodeTransform = { x : parentTransform.x + localNodeTransform.x, y: parentTransform.y + localNodeTransform.y };
                svgNodesWithTransform.push( { node: elem, transform: nodeTransform })
            }
        })

        return svgNodesWithTransform;
    }

    _parseTransformString(t:string)
    {
        const PARSE_RE = /translate\(([-\d\.]+),([-\d\.]+)/
        let m = t.match(PARSE_RE);
        return m ? { x: parseFloat(m[1]), y: parseFloat(m[2]) } : null;
    }

    _importSVGPath(pathData:string, transform:SvgTransform = { x : 0, y: 0}):AnyShape|ShapeCollection
    {
        // path command to sketch command
        const PATH_CMD_TO_SKETCH_CMD = {
            'moveto' : { func: 'moveTo', args: (cmd) => [ [cmd.x + transform.x, cmd.y + transform.y]] },
            'lineto' : { func: 'lineTo', args: (cmd) => [ [cmd.x + transform.x, cmd.y + transform.y]] },
            'closepath' : { func: 'close', args: (cmd) => [] },
        }

        let commands = parseSVG(pathData);

        let absCommands = makeAbsolute(commands);

        let sketch = new Sketch('xy');
        absCommands.every( (cmd) => 
        {
            let sketchCmd = PATH_CMD_TO_SKETCH_CMD[cmd.command];

            if (!sketchCmd)
            {   
                console.error(`IO::_importSVGPath: Not yet supported command "${cmd.command}. Skipped entire SVG Path!`)
                // TODO: just skip?
                return false;
            }
            // supported SVG Path command: apply to Sketch
            let args = sketchCmd.args(cmd);
            sketch[sketchCmd.func](...args);

            return true
        })
        
        let shapeOrShapes = sketch.getShapes(); // return Shape of this SVG Path
        sketch._removeSketchLayer(); // remove original sketch layer
        this._geom.resetLayers(); 

        return shapeOrShapes;
    }
}