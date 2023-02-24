import { Page, Container, AnyContainer, Pipeline, AnyShape, AnyShapeOrCollection, 
    ShapeCollection, isAnyShapeCollection, Alignment, ZoomRelativeTo, ContainerContent} from './internal'
import { checkInput  } from './internal';

export class View extends Container
{
    _pipeline:Pipeline;
    _shapes:ShapeCollection;
    _style:any; // general style (TODO)
    _styles:{[key:string]:any}; // style overrides (TODO)
    _dimension:any; // TODO

    constructor(name:string)
    {
        super(name);
        this._type = 'view';
    }

    //// OUTPUT ////

    toData():any // TODO
    {
        return {
            ...this._toContainerData(),
            content: { main: this._shapes?.toSvg(), settings: {} } as ContainerContent,
        }
    }

    /** Bind ShapeCollection to View */
    @checkInput('AnyShapeOrCollection', 'ShapeCollection')
    shapes(shapes:AnyShapeOrCollection)
    {
        const shapeCollection = shapes as ShapeCollection; // auto converted
        this._shapes = shapeCollection;
    }

}
