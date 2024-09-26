/**
 *  Annotator.ts
 *      Make different annotations on the model like dimensions, labels etc.
 *      Their main purpose is offering information on top of the model - and are not part of the Shapes 
 *      Only on output they might be turned into real Shapes like text Faces etc.
 */ 

import { Point, PointLike, Edge, Geom, DimensionOptions } from './internal'
import { AnyShape } from './internal'
import { checkInput } from './decorators' // NOTE: needs to be direct

import { AnnotationType, DimensionLineData, DimensionLine } from './internal'


export class Annotator
{
    //// SETTINGS ////
    DIMENSION_BOX_OFFSET_DEFAULT = 10;
    
    //// END SETTINGS ////

    _oc; // is set in constructor prototype when Geom once OC is loaded - IMPORTANT: Don't assign here!
    _geom:Geom; // also set on Pipeline prototype when making Geom
    name:string;
    dimensionLines:Array<DimensionLine> = [];
    // labels:Array<Label> = []; // TODO

    constructor()
    {   
        // TODO
    }

    /** Make dimension line */
    @checkInput([['PointLike',null],['PointLike',null]],['auto','auto'])
    dimensionLine(start:PointLike, end:PointLike, options:DimensionOptions)
    {
        const newDimension = new DimensionLine(start as Point,end as Point, options); // start and end can be null
        this.dimensionLines.push(newDimension);
        return newDimension;
    }

    /** Create dimension lines for bounding box of Shape */
    // TODO: use orientated bbox too
    @checkInput(['AnyShape'],['auto'])
    dimensionBox(shape:AnyShape)
    {
        // Where to place the dimension lines by default
        const DIMENSION_BBOX_ALIGN = {
            width: 'bottomfront',
            depth: 'bottomleft',
            height: 'frontleft' 
        }
        
        let bbox = shape.bbox();

        Object.entries(DIMENSION_BBOX_ALIGN).forEach( ([dimSide,alignment]) => 
        {
            let e = bbox.getSidesShape(alignment);
            
            if(e.type() == 'Edge') // If we get a Vertex it means that we have a 2D Bbox: skip that axis
            {
                let edge = e as Edge;
                let dim = new DimensionLine(edge.start().toPoint(), edge.end().toPoint());

                if (dim.value != 0) // skip zero length dimensions
                {
                    let bboxVec = bbox.center().toVector();
                    let offsetVecDiag = e.center().toVector().subtracted(bboxVec);
                    
                    if(dimSide === 'width'){ offsetVecDiag.x = 0; offsetVecDiag.z = 0; }
                    if(dimSide === 'depth'){ offsetVecDiag.y = 0; offsetVecDiag.z = 0; }
                    if(dimSide === 'height'){ offsetVecDiag.z = 0; offsetVecDiag.y = 0; }
                    
                    // now we can safely normalize
                    let offsetVec = offsetVecDiag.normalize().scaled(this.DIMENSION_BOX_OFFSET_DEFAULT);
                    
                    dim.setOffsetVec(offsetVec);
                    this.dimensionLines.push(dim);
                }
            }
        })

    }

    /** Get all annotations in one Array. See interfaces like DimensionLineData */
    getAnnotations():Array<DimensionLineData> // TODO: more types
    {
        let annotationsData = [];
        annotationsData = annotationsData.concat(this.dimensionLines.map(d => d.toData()));

        return annotationsData;
    }

    /** Reset annotations */
    reset()
    {
        this.dimensionLines = [];
    }
}
