import { Doc, PageSide, Container, View, WidthHeightInput, ContainerData, 
    DocUnits, PageSize, PageOrientation, AnyPageContainer, isPageSize,
    isPageOrientation,  isAnyPageContainer, ValueWithUnitsString} from './internal'
import { convertValueFromToUnit } from './internal' // utils
 

//// PAGE CLASS ////

export class Page 
{
    //// SETTINGS ////
    DEFAULT_PADDING:WidthHeightInput = '1cm';
    DEFAULT_SIZE:PageSize = 'A4';
    PAGE_ISO_SIZE_TO_WIDTH_HEIGHT_MM = { // landscape
        A0: { w : 1189, h:841 },
        A1: { w : 841, h:594  },
        A2: { w : 594, h:420  },
        A3: { w : 420, h:297  },
        A4: { w : 297, h:210  },
        A5: { w : 210, h:148  },
        A6: { w : 148 , h:105  },
        A7: { w : 105, h:74  },
    }
    

    //// END SETTINGS ////

    name:string;
    _doc:Doc;
    _document:string; // name of doc in Doc module
    _units:DocUnits; // taken from _doc module and _document
    _size:PageSize; // ISO page size (A0-A7)
    _width:number; // in doc units (mm,cm,inch)
    _height:number;
    _orientation:PageOrientation = 'landscape';
    _padding:Array<number>; // relative to [width,height]
    _containers:Array<AnyPageContainer> = [];
    _variables: {[key:string]:any} = {}; // template variables

    constructor(doc:Doc, documentName:string, name:string)
    {
        this.name = name;
        this._doc = doc;
        this._document = documentName;
        this._units = this._doc._unitsByDoc[this._document];
        this.setDefaults();
    }

    setDefaults()
    {
        this.size(this.DEFAULT_SIZE);
        this.padding(this.DEFAULT_PADDING);
    }

    size(size:PageSize)
    {
        if(!isPageSize(size)){ throw new Error(`Doc::pageSize: Invalid ISO page size. Use: A0-A7`);}
        this._size = size;
        this._sizeToWidthHeight(this._size); // set width and height in document units
    }

    /** Set width of Page in document units */
    width(n:WidthHeightInput):Page
    {
        if (typeof n === 'number')
        {
            this._width = n;
            return this;
        }
        else if(typeof n === 'string')
        {
            const m = n.match(/[\d\.]+/); // strip all units etc.
            if (m && m[0])
            {
                this._width = parseFloat(m[0]);
                return this;
            }
        }
        throw new Error(`Page::width(): Invalid value for width: "${n}". Supply a number (in document units)`)
    }

    /** Set height of Page in document units */
    height(n:WidthHeightInput):Page
    {
        if (typeof n === 'number')
        {
             this._height = n;
             return this;
        }
        else if(typeof n === 'string')
        {
            const m = n.match(/[\d\.]+/); // strip all units etc. We don't care for now. TODO: make more robust
            if (m && m[0])
            {
                this._width = parseFloat(m[0]);
                return this;
            }
        }
        throw new Error(`Page::width(): Invalid value for width: "${n}". Supply a number (in document units)`)
    }

    orientation():Page
    {
        // TODO
        return this;
    }

    /** Set padding width (left and right) and height (top and bottom) 
     *  Use relative width/height ([0-1]), number with percentage (5%) or number with real units ('1cm','0.5"')
    */
    padding(w:WidthHeightInput, h?:WidthHeightInput):Page
    {
        // only resolved size needed, padding is always relative to page
        const paddingX = this._doc._resolveWidthHeightInput(w, this, 'width')[0]; 
        const paddingY = this._doc._resolveWidthHeightInput((h || w), this, 'height')[0];

        if( (paddingX > 0.5 || paddingX < 0) || (paddingY > 0.5 || paddingY < 0))
        {
            throw new Error(`Page::padding(): Cannot make padding bigger than 0.5 or less then zero!. Check values!`);
        }

        // NOTE: padding percentage is relative to WIDTH
        this._padding = [paddingX, paddingY];
        return this;
    }

    /** Add AnyPageContainer to page */
    add(container:AnyPageContainer)
    {
        if(!isAnyPageContainer){  throw new Error(`Page::add: Invalid container!`);}
        if(this._containerExists(container.name)){  throw new Error(`Page::add: Container with name "${container.name}" already exists!`);}
        
        if(!this._containers.includes(container))
        { 
            this._containers.push(container) 
        };
    }

    //// UTILS ////

    // Alias forwarding to doc._resolveValueWithUnitsStringToRel
    /** Transform numeric value with units to relative position to page width or height */
    _resolveValueWithUnitsStringToRel(s:ValueWithUnitsString, side:PageSide):number
    {
        return this?._doc._resolveValueWithUnitsStringToRel(s,this,side);
    }


    //// OUTPUTS ////

    async toData(cache?:Record<string,any>)
    {
        // async load (some) containers
        const containersData = [];
        for(let i = 0; i < this._containers.length; i++)
        {
            containersData.push(await this._containers[i].toData(cache));
        }

        return {
            _entity: 'page',
            name: this.name,
            size: this._size,
            width: this._width,
            height: this._height,
            orientation: this._orientation,
            padding: this._padding,
            containers: containersData,
            docUnits: this._units // taken from doc, used in rendering
        }
    }

    //// UTILS

    _containerExists(name:string):boolean
    {
        return this._containers.some( c => c.name === name);
    }

    /** Transform given ISO page size (A0-A7) to units in document units */
    _sizeToWidthHeight(size:PageSize)
    {
        let pageWidth = this.PAGE_ISO_SIZE_TO_WIDTH_HEIGHT_MM[size].w;
        let pageHeight = this.PAGE_ISO_SIZE_TO_WIDTH_HEIGHT_MM[size].h;

        // Convert to units in document
        if(this._units === 'cm')
        { 
            pageWidth /= 10;
            pageHeight /= 10;
        }
        else if(this._units === 'inch')
        {
            pageWidth = convertValueFromToUnit(pageWidth, 'mm', 'inch');
            pageHeight = convertValueFromToUnit(pageHeight, 'mm', 'inch');
        }

        this.width(pageWidth);
        this.height(pageHeight);
    }   
}
