/**
 *  Annotator.ts
 *      Make different annotations on the model like dimensions, labels etc.
 *      Their main purpose is offering information on top of the model - and are not part of the Shapes 
 *      Only on output they might be turned into real Shapes like text Faces etc.
 */ 

import { Point, Vector, PointLike, Vertex, Edge, AnyShape, Geom, DimensionOptions, ShapeCollection, AnyShapeOrCollection } from './internal'

import { checkInput } from './decorators' // NOTE: needs to be direct

import { Annotation, AnnotationData, DimensionLine, AutoDimLevel, AutoDimSettings, AnnotationAutoDimStrategy, 
            MainAxis } from './internal'


export class Annotator
{
    //// SETTINGS ////
    DIMENSION_BOX_OFFSET_DEFAULT = 20;
    
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
    dimensionLine(start?:PointLike, end?:PointLike, options?:DimensionOptions)
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

    getAnnotations():Array<Annotation>
    {
        return this.dimensionLines
    }    

    /** Get all annotations in one Array. See interfaces like DimensionLineData */
    getAnnotationsData():Array<AnnotationData> // TODO: more types
    {
        // TODO: gather all annotations in one array?
        let annotationsData = [];
        annotationsData = annotationsData.concat(this.dimensionLines.map(d => d.toData()));

        return annotationsData;
    }

    /** Reset annotations */
    reset()
    {
        this.dimensionLines = [];
    }

    //// GENERATE DIMENSIONS ON SHAPES ////

    @checkInput(['AnyShapeOrCollection', ['DimensionOptions', null], ['AnnotationAutoDimStrategy', null]], ['ShapeCollection', 'auto','auto'])
    autoDim(shapes:ShapeCollection, options?:DimensionOptions, strategy?:AnnotationAutoDimStrategy)
    {
        strategy = strategy || this._getAutoDimStrategy(shapes);
        
        switch (strategy)
        {
            case 'part':
                return this.autoDimPart(shapes, options);
            case 'levels':
                return this.autoDimLevels(shapes, options);
            default:
                console.error(`Annotator::autoDim(shapes,strategy): No automatic strategy found. Please supply one (like 'part' or 'levels') as argument`);
                return null;
        }
        
    }

    /** Try to determine the best auto dimensioning strategy 
     *  These strategies are now available:
     *      - Part: One clear 2D Shape (possible with holes). Dimensioning mostly focused on producing that Shape
     *      - Levels: Complex collection of Shapes. Dimensioning along levels of the collection
    */
    @checkInput('AnyShapeOrCollection', 'ShapeCollection')
    _getAutoDimStrategy(shapes:ShapeCollection):AnnotationAutoDimStrategy
    {
        if(shapes.length === 1 && shapes.first().is2D()) // TODO: better
        {
            return 'part'
        }
        else if (shapes.bbox().is2D())
        {
            return 'levels'
        }
        else {
            console.warn(`Annotator._getAutoDimStrategy(): `)
            return null;
        }
    }

    /** Generate dimension lines for a 2D Part on XY plane slighly focused on production by cutting
     *      We take an approach of dimension line levels:
     *         1. Outset bbox of Shape: the stock dimensions
     *         2. Dimension the edges on, and parallel to the bbox outside 
     *         3. Add any dimensions of edges that are not yet done. Avoid doubles
     * 
     * @param shapes Shape or ShapeCollection to dimension
     * @returns ShapeCollection
     */
    @checkInput(['AnyShapeOrCollection', ['DimensionOptions', null]], ['ShapeCollection', 'auto'])
    autoDimPart(shapes:ShapeCollection, options?:DimensionOptions):ShapeCollection
    {
        const OFFSET_PER_LEVEL = 20;
        const DIMENSION_MIN_DISTANCE = 1;

        // Take some settings from optional settings
        const dimLevelOffset = options?.offset || OFFSET_PER_LEVEL;
        const dimUnits = options?.units;
        
        const part = shapes.first();

        if(!part.is2D()){ throw new Error('Annotator.autoDimPart(): Please make sure you have a 2D part on the XY plane!');}

        // Level 1: stock size (bbox)
        part.bbox().back().dimension({ offset: dimLevelOffset * 3, units: dimUnits });
        part.bbox().left().dimension({ offset: dimLevelOffset * 3, units: dimUnits });
        
        // Level 2: edges on and parallel to sides of bbox
        const bboxSideEdges = part.bbox().rect().edges();
        const dimEdgesOnSides = new ShapeCollection();

        bboxSideEdges.forEach((sideEdge,i) => 
        {
            const sideDir = sideEdge.direction().normalized().round().abs();
            const sideDir90 = sideDir.copy().rotateZ(90).abs();
            const sideEdges = part.edges()
                            .intersecting(sideEdge)
                            .filter(e => {
                                return !(e as Edge).direction().normalize().abs().round().equals(sideDir90)
                            });
            const sideDimOffsetVec = sideEdge.center().toVector().subtracted(part.bbox().center()).normalize();

            const sideAlongAxis = (sideDir.equals([1,0,0])) ? 'x' : 'y';
            const levelCoordAxis = (sideAlongAxis === 'x') ? 'y' : 'x'; // dimension level coord that stays same
            const levelCoordValue = sideEdge.center()[levelCoordAxis]
            
            // Generate dimension lines along sides
            const dimLevelVertices = sideEdges
                    .vertices()
                    .add(sideEdge.start(), sideEdge.end())
                    .filter( v => v[levelCoordAxis] = levelCoordValue )
                    .unique()
                     // make sure we don't include points that are not on level
                    .sort((v1,v2) => {
                        // sort x,y ascending
                        if(v1.x !== v2.x ){ return v1.x - v2.x }
                        else { return v1.y - v2.y };
                    })
                    .toArray();

            // Only more than 2 points, otherwise the bbox is sufficient
            if(dimLevelVertices.length > 2)
            {
                dimLevelVertices.forEach((v,i,arr) => 
                {
                    if(i !== 0) // skip first
                    {
                        if(v.distance(arr[i-1]) >= DIMENSION_MIN_DISTANCE)
                        {
                            const dim = this.dimensionLine(
                                arr[i-1] as PointLike,
                                v as PointLike, 
                                { 
                                    offsetVec: sideDimOffsetVec, 
                                    offset: dimLevelOffset * 2, 
                                    units: dimUnits,
                                    ortho: sideAlongAxis // always orthogonal
                                });
                            part.addAnnotations(dim);
                            dimEdgesOnSides.add(new Edge().makeLine(arr[i-1] as Vertex, v as Vertex)); // keep track of what dim lines we made
                        }
                    }
                })
            }
        })
        // Level 3 - remaining Edges by direction and length
        const remainingEdges = part.edges().filter(e => !dimEdgesOnSides.has(e));
        const edgesOnSidesByDirLength = dimEdgesOnSides.toArray().reduce((acc,curEdge) => {
            const n = (curEdge as Edge).direction().normalized().round().abs();
            const l = Math.round((curEdge as Edge).length());
            const id = `${n}-${l}`;
            acc[id] = curEdge; 
            return acc;
        }, {});

        const remainingEdgesByDirLength = remainingEdges
            .toArray()
            .reduce((acc,curEdge) => {
                const n = (curEdge as Edge).direction().normalized().round().abs();
                const l = Math.round((curEdge as Edge).length());
                const id = `${n}-${l}`;
                if(!edgesOnSidesByDirLength[id]) // Not already done for Edge
                {
                    acc[id] = curEdge; // TOOD: order these edges
                }
                return acc;
            }, {})
        
        Object.values(remainingEdgesByDirLength).forEach((e,i) =>
        {
            const dim = this.dimensionLine().fromShape(e as Edge, { offset: OFFSET_PER_LEVEL * 1  }); // offset inside shape
            part.addAnnotations(dim);
        });

        return shapes;
    }

    /** Make (semi) automatic dimension lines through the Shapes of this collection at levels (in percentage of total size) along MainAxis within bbox
     *    @param options:AutoDimSettings
     *    {
     *       levels: Array< Record<MainAxis,number>
     *       minDistance: number (0-1)
     *    }
     * 
     */
    @checkInput(['AnyShapeOrCollection','AutoDimSettings','DimensionOptions'], ['ShapeCollection', 'auto', 'auto'])
    autoDimLevels(collection:ShapeCollection, settings?:AutoDimSettings, options?:DimensionOptions):Array<DimensionLine>
    {
        const BBOX_MARGIN = 10;
        const SECTION_PLANE_DEPTH = 2;
        const DIMENSION_LINE_OFFSET_FROM_BBOX = 30;
        const DEFAULT_MIN_DISTANCE = 0;

        if(!settings || !Array.isArray(settings?.levels)){ throw new Error('Annotator.autoDimLevels(options): No autoDim settings given. Please supply levels ({ axis:x|y|z, at:number }]). Level options are minDistance, coordType, and offset')}

        const collectionBbox = collection.bbox();
        const autoDimLines = [];

        // For every level make a section shape, gather intersection points and draw dimension lines
        settings.levels.forEach((lvl,i) => 
        {
            lvl = lvl as AutoDimLevel;
            const levelAxis = lvl?.axis
            let levelCoord = lvl?.at; // percentage of size along levelAxis
            // NOTE: if coordType not given, We take it that if the level is given < 1.0 it is meant relative
            const levelCoordType = lvl?.coordType || ((levelCoord < 1 || levelCoord > -1 ) ? 'relative' : 'absolute');
            if(levelCoordType === 'relative')
            {
                levelCoord = (levelCoord > 1.0) ? 1.0 : levelCoord; 
                levelCoord = (levelCoord < 0) ? 0 : levelCoord;
            }
            
            const bboxSize = collectionBbox.sizeAlongAxis(levelAxis);
            const rangeAxis = (['x','y','z'] as Array<MainAxis>).find((a) => a !== levelAxis && collectionBbox.axisMissingIn2D() !== a);
            const sectionLineDepthAxis = (['x','y','z'] as Array<MainAxis>).find(a => a !== levelAxis && a !== rangeAxis);
            const sectionLineRangeStart = collectionBbox.min()[rangeAxis] - BBOX_MARGIN;
            const sectionLineRangeEnd = collectionBbox.max()[rangeAxis] + BBOX_MARGIN;
            const sectionLineStart = new Point(0,0,0)['set'+rangeAxis.toUpperCase()](sectionLineRangeStart);
            const sectionLineEnd = new Point(0,0,0)['set'+rangeAxis.toUpperCase()](sectionLineRangeEnd);
            const sectionLineLevelCoord = (levelCoordType === 'relative') ? collectionBbox.minAtAxis(levelAxis) + levelCoord*bboxSize : levelCoord;
            const sectionLine = new Edge().makeLine(sectionLineStart,sectionLineEnd)
                                            ['move'+levelAxis.toUpperCase()](sectionLineLevelCoord)

            if(lvl?.showLine){ sectionLine.color('red').addToScene() };
            // to deal with accurary issues we use a section plane
            const sectionPlaneNormal = new Vector(0,0,0)['set'+sectionLineDepthAxis.toUpperCase()](1);
            const sectionPlane = sectionLine._extruded(SECTION_PLANE_DEPTH, sectionPlaneNormal)
                                    ['move'+sectionLineDepthAxis.toUpperCase()](-SECTION_PLANE_DEPTH/2);
            // now get unique intersection points of all shapes
            const intersectionPointsAlongRangeAxis = []
            const intersections = collection._intersections(sectionPlane);

            if(!intersections.length)
            {
                console.warn(`ShapeCollection::autoDim(): level "${levelAxis}=${levelCoord}" [${levelCoordType}] Did not cut any Shapes!`)
            }

            intersections.forEach((int) => 
            {
                // NOTE: we can get intersections of Shapes: points, lines, planes
                // We just check all their points
                int.vertices().forEach(v => {
                    const coordAlongRangeAxis = v[rangeAxis];
                    if(!intersectionPointsAlongRangeAxis.includes(coordAlongRangeAxis))
                    {
                        intersectionPointsAlongRangeAxis.push(coordAlongRangeAxis)
                    }
                })
            });
            intersectionPointsAlongRangeAxis.sort((a,b) => a - b ); // min first
            
            // Now make the dimension lines at a given coord (parallel to section line) based on align ('min','max,'auto') and offset
            let dimLinesLevelCoord = sectionLineLevelCoord;
            if (lvl?.align === 'auto')
            {
                dimLinesLevelCoord = (levelCoord <= 0.5) ? collectionBbox['min'+levelAxis.toUpperCase()]() : collectionBbox['max'+levelAxis.toUpperCase()]()
            }
            if(['min','max'].includes(lvl?.align))
            {
                dimLinesLevelCoord = collectionBbox[lvl.align+levelAxis.toUpperCase()]() 
            }
            const minDistance = lvl?.minDistance || DEFAULT_MIN_DISTANCE;
            let dimLineOffset = lvl?.offset || DIMENSION_LINE_OFFSET_FROM_BBOX;
            dimLineOffset = (lvl?.align === 'min' || levelCoord <= 0.5) ? dimLineOffset : dimLineOffset *-1; // flip offset direction

            intersectionPointsAlongRangeAxis.forEach((v,i,arr) => 
            {
                if(i < arr.length -1 )
                {
                    const lineStartCoord = v;
                    const lineEndCoord = arr[i+1];
                    const distance = lineEndCoord - lineStartCoord;
                    if(distance > minDistance)
                    {
                        const dimLineStartPoint = new Point(0,0,0)
                                                    ['set'+rangeAxis.toUpperCase()](lineStartCoord)
                                                    ['set'+levelAxis.toLocaleUpperCase()](dimLinesLevelCoord);

                        const dimLineEndPoint = new Point(0,0,0)
                                                ['set'+rangeAxis.toUpperCase()](lineEndCoord)
                                                ['set'+levelAxis.toLocaleUpperCase()](dimLinesLevelCoord);

                        const dimLine = this.dimensionLine(
                                            dimLineStartPoint,
                                            dimLineEndPoint,
                                            {  
                                                offset: dimLineOffset, 
                                                roundDecimals: 0,
                                            }
                                        )
                        
                        autoDimLines.push(dimLine);
                    }
                }
            })
        })

        return autoDimLines;
    }
}
