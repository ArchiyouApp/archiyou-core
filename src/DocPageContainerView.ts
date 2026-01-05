import { Page, Container, ContainerData, AnyPageContainer, Pipeline, Shape, AnyShape, AnyShapeOrCollection, 
    ShapeCollection, isAnyShapeCollection, Alignment, ZoomRelativeTo, ContainerContent} from './internal'
import { checkInput  } from './internal';

export class View extends Container
{
    _shapes:ShapeCollection|string; // either a real reference to a ShapeCollection or the name of it that is suppose to be available after running the Doc pipeline
    _resolvedShapesSVG:string; // cached resolved SVG string
    _style:any; // general style (TODO)
    _styles:{[key:string]:any}; // style overrides (TODO)
    _dimension:any; // TODO
    _forceAll:boolean = false;

    constructor()
    {
        super(); // no name needed?
        this._type = 'view';
    }

    //// OUTPUT ////

    async toData():Promise<ContainerData> // TODO
    {
        return {
            ...this._toContainerData(),
            content: { 
                data: this.resolveShapesToSVG(), 
                settings: {} 
            } as ContainerContent,
        }
    }

    /** For components we need to remove all references to Shapes */
    resolveShapesToSVG():string
    {
        if(this._resolvedShapesSVG)
        { 
            console.info(`DocPageContainerView::resolveShapesToSVG(): Got svg from cache!`);
            return this._resolvedShapesSVG
        }

        const svg = (ShapeCollection.isShapeCollection(this._shapes)) 
                        ? (this._shapes as ShapeCollection)?.toSVG({ all: this._forceAll, annotations: true }) 
                        :  this.resolveShapeNameToSVG(this._shapes as string)

        this._resolvedShapesSVG = svg; // set to avoid double use
        
        return this._resolvedShapesSVG;
    }

    resolveShapeNameToSVG(shapesRef:string):string
    {
        if(typeof shapesRef !== 'string')
        { 
            throw new Error(`View::resolveShapeNameToSVG(): Given shapes "${shapesRef}" is not a string!`) 
        } 

        const workerScope = this._page._doc._ay?.scope || // If run with Runner scope is set, for backwards compatibility look for other locations
                            this._page._doc._ay.worker?.self || this._page._doc._ay.worker; // either in Webworker or Nodejs global

        if (workerScope)
        {
            const realShapes = workerScope[shapesRef]; // get the real reference to the ShapeCollection or Shape

            if(!Shape.isShape(realShapes) && !ShapeCollection.isShapeCollection(realShapes))
            { 
                throw new Error(`View::resolveShapeNameToSVG(): Given reference "${shapesRef}" for view "${this.name} = ..." can't be found. Make sure you set it in pipeline function with "this.${shapesRef}". Using without this will not set values on scope!`); 
            } 
            
            const s = ShapeCollection.isShapeCollection(realShapes) ? realShapes : new ShapeCollection(realShapes); // make sure we got a ShapeCollection
            return s.toSVG({ all: this._forceAll, annotations: true });
        }
        else {
            console.warn('DocPageContainerView:resolveShapenameToSVG(): Could not determine worker scope: Could not resolve shapes variable. No shapes were outputted!');
            return null;
        }
    }

    /** Bind ShapeCollection to View */
    shapes(shapes:AnyShapeOrCollection|string, all:boolean=false)
    {
        this._forceAll = all;
        // a reference to a ShapeCollection from main script
        if (ShapeCollection.isShapeCollection(shapes) || Shape.isShape(shapes))
        {
            this._shapes = new ShapeCollection(shapes) as ShapeCollection; // auto converted
        }
        else if(typeof shapes === 'string')
        {
            this._shapes = shapes as string;
        }
        else {
            throw new Error('DocPageContainer:shapes(): Please supply either a reference to ShapeCollection or the name of one that will be available after running the pipeline!');
        }
    }

    //// UTIL ////

    /** Used to remove DocDocument instances from execution scope
     *  Used in components
     */
    resolveScopeReferences():this
    {
        this.resolveShapesToSVG();
        this.shapes = null; // remove to be sure
        return this;
    }


}
