import { Page, Container, ContainerData, AnyPageContainer, Pipeline, Shape, AnyShape, AnyShapeOrCollection, 
    ShapeCollection, isAnyShapeCollection, Alignment, ZoomRelativeTo, ContainerContent} from './internal'
import { checkInput  } from './internal';

export class View extends Container
{
    _shapes:ShapeCollection|string; // either a real reference to a ShapeCollection or the name of it that is suppose to be available after running the Doc pipeline
    _style:any; // general style (TODO)
    _styles:{[key:string]:any}; // style overrides (TODO)
    _dimension:any; // TODO
    _forceAll:boolean = false;

    constructor(name:string)
    {
        super(name);
        this._type = 'view';
    }

    //// OUTPUT ////

    async toData():Promise<ContainerData> // TODO
    {
        return {
            ...this._toContainerData(),
            content: { 
                data: (ShapeCollection.isShapeCollection(this._shapes)) ? 
                                (this._shapes as ShapeCollection)?.toSvg({ all: this._forceAll }) : 
                                this.resolveShapeNameToSVG(this._shapes as string), 
                settings: {} 
            } as ContainerContent,
        }
    }

    resolveShapeNameToSVG(shapes:string):string
    {
        if(typeof shapes !== 'string')
        { 
            throw new Error(`View::resolveShapeNameToSVG(): Given shapes "${shapes}" is not a string!`) 
        } 

        const workerScope = this._page._doc._ay.worker?.self || this._page._doc._ay.worker; // either in Webworker or Nodejs global

        if (workerScope)
        {
            const realShapes = workerScope[shapes];

            if(!Shape.isShape(realShapes) && !ShapeCollection.isShapeCollection(realShapes))
            { 
                throw new Error(`View::resolveShapeNameToSVG(): Given shapes "{shapes}" does not refer to a valid Shape or ShapeCollection!`) 
            } 
            
            const s = new ShapeCollection(realShapes); // make sure we got a ShapeCollection
            return s.toSvg({ all: this._forceAll });
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

}
