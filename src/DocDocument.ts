import { Doc, Page,  } from './internal'
import type { DocUnits, PageSize , PageOrientation,  DocPipeline, DocData } from './internal';

/** A document that is part of a Doc module instance
 *  It contains pages and some settings
  */
export class DocDocument
{
    //// SETTINGS ////
    DOC_DEFAULT_NAME = 'Document'; // default name for document
    DOC_UNITS_DEFAULT:DocUnits = 'mm'; // default document units
    DOC_PAGE_SIZE_DEFAULT:PageSize = 'A4'; // default ISO page size (A0-A7)
    DOC_PAGE_ORIENTATION_DEFAULT:PageOrientation = 'landscape'; // default page orientation
    ////

    name:string; // name of document
    pageSize:PageSize; // ISO page size (A0-A7)
    pageOrientation:PageOrientation;
    units:DocUnits;

    _doc:Doc; // reference to Doc module
    _pages:Array<Page> = []; // pages in this document
    _pipelines:Array<DocPipeline> = []; // pipelines for this document, see DocPipelin
    _activePage?:Page; // active page in this document
    
    constructor(doc:Doc, name:string)
    {
        this._doc = doc; // reference to Doc module
        this.name = name;
        
        this.pageSize = this.DOC_PAGE_SIZE_DEFAULT; // default page size
        this.pageOrientation = this.DOC_PAGE_ORIENTATION_DEFAULT; // default page orientation
        this.units = this.DOC_UNITS_DEFAULT; // default document units
    }

    /** Add page to this document */
    createPage(name:string):Page
    {
        if(this.pageExists(name)){ throw new Error(`Doc::page: Page name "${name}" is already taken. Please use unique names!`)}
        const newPage = new Page(this._doc, this, name);
        this._pages.push(newPage);
        this._activePage = newPage; // set active page if not set
        console.info(`Doc::createPage(): Created new page "${name}" in document "${this.name}" with default settings [${this.units} - ${this.pageSize} - ${this.pageOrientation}]`);
        return newPage;
    }

    pageExists(name:string):boolean
    {
        return !!(this._pages.find(p => p.name === name));
    }

    addPipeline(p:DocPipeline):this
    {
        if(!p || !p.fn || typeof p.fn !== 'function')
        {
            throw new Error(`Doc::addPipeline(): Invalid pipeline function. Please provide a valid function.`);
        }
        this._pipelines.push(p);
        return this;
    }

    //// EXPORT DATA ////

    async toData():Promise<DocData>
    {
        const docPagesData = [];
        for(let i = 0; i < this._pages.length; i++)
        {
            docPagesData.push(await this._pages[i].toData(this._doc._assetsCache));
        }

        return {
            name: this.name,
            units: this.units,
            pages: docPagesData,
            modelUnits: this._doc._geom._units, // set model units to calculate scale later
        }
        
    }
}
