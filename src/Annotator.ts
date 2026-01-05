/**
 *  Annotator.ts
 *      Make different annotations on the model like dimensions, labels etc.
 *      Their main purpose is offering information on top of the model - and are not part of the Shapes 
 *      Only on output they might be turned into real Shapes like text Faces etc.
 */ 

import { Point, Vector, PointLike, Vertex, Edge, AnyShape, Brep, DimensionOptions, 
            ShapeCollection, AnyShapeOrCollection, BaseAnnotation, Bbox } from './internal'

import { checkInput } from './decorators' // NOTE: needs to be direct

import { Annotation, AnnotationData, DimensionLine, DimensionLevelSettings, AnnotationAutoDimStrategy, 
            MainAxis, DimensionLevel } from './internal'

import { roundTo, roundToTolerance } from './internal' // utils


export class Annotator
{
    //// SETTINGS ////
    DIMENSION_BOX_OFFSET_DEFAULT = 20;
    
    //// END SETTINGS ////

    _oc; // is set in constructor prototype once OC is loaded - IMPORTANT: Don't assign here!
    _brep:Brep; // also set on Pipeline prototype when making Brep
    name:string;
    annotations:Array<Annotation> = [];
    // labels:Array<Label> = []; // TODO

    constructor()
    {   
        // TODO
    }

    /** Make dimension line. Is added to list automatically */
    @checkInput([['PointLike',null],['PointLike',null]],['auto','auto'])
    dimensionLine(start?:PointLike, end?:PointLike, options?:DimensionOptions, autoAdd:boolean=true)
    {
        const newDimension = new DimensionLine(start as Point,end as Point, options); // start and end can be null
        if(autoAdd){ this.annotations.push(newDimension);}
        return newDimension;
    }

    /** Make a Dimension Line without adding to list yet! */
    makeDimensionLine(start?:PointLike, end?:PointLike, options?:DimensionOptions)
    {
        return this.dimensionLine(start,end,options,false);
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
                    this.annotations.push(dim);
                }
            }
        })

    }

    getAnnotations():Array<Annotation>
    {
        // TODO: make more generic
        return this.annotations
    }
    
    getAnnotationsInBbox(bbox:Bbox, margin?:number):Array<Annotation>
    {
        const MAX_DISTANCE = 30;
        const selectionBbox = bbox.enlarged(margin ?? MAX_DISTANCE);
        return this.annotations.filter(a => selectionBbox.contains(a.toShape()));
    }

    addAnnotations(annotations:Array<Annotation>):this
    {
        if(!Array.isArray(annotations)){ return this; }
        const checkedAnnotations = annotations.filter( a => BaseAnnotation.isAnnotation(a));
        this.annotations = this.annotations.concat(checkedAnnotations as Array<DimensionLine>) as Array<DimensionLine>; // NOTE: avoid doubles with Annotator.unique()
    }

    setAnnotations(annotations:Array<Annotation>):this
    {
        if(!Array.isArray(annotations)){ return this; }
        const checkedAnnotations = annotations.filter( a => BaseAnnotation.isAnnotation(a));
        this.annotations = checkedAnnotations;
    }

    /** Get all annotations in one Array. See interfaces like DimensionLineData */
    getAnnotationsData():Array<AnnotationData> // TODO: more types
    {
        // TODO: gather all annotations in one array?
        let annotationsData = [];
        annotationsData = annotationsData.concat(this.annotations.map(d => d.toData()));

        return annotationsData;
    }

    /** Reset annotations */
    reset()
    {
        this.annotations = [];
    }

    //// GENERATE DIMENSIONS ON SHAPES ////

    @checkInput(['AnyShapeOrCollection', ['DimensionOptions', null], ['AnnotationAutoDimStrategy', null]], ['ShapeCollection', 'auto','auto'])
    autoDim(shapes:ShapeCollection, options?:DimensionOptions|DimensionLevelSettings, strategy?:AnnotationAutoDimStrategy)
    {
        strategy = strategy || this._getAutoDimStrategy(shapes);
        
        switch (strategy)
        {
            case 'part':
                return this.autoDimPart(shapes, options as DimensionOptions);
            case 'levels':
                return this.autoDimLevels(shapes, options as DimensionLevelSettings);
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
        const OFFSET_PER_LEVEL = 15;
        const DIMENSION_MIN_DISTANCE = 1;
        const LEVEL_COORD_ROUND_DECIMALS = 0; // round to full units
        const LEVEL_CHECK_VERTICES_TOLERANCE = 3; // when check
        const SIDE_VERTICES_UNIQUE_TOLERANCE = 1;

        // Take some settings from optional settings
        const dimLevelOffset = options?.offset || OFFSET_PER_LEVEL;

        const dimUnits = options?.units;
        
        const part = shapes.first();
        const newAnnotations = [] as Array<Annotation>;

        if(!part.is2D()){ throw new Error('Annotator.autoDimPart(): Please make sure you have a 2D part on the XY plane!');}

        // Level 1: stock size (bbox)
        newAnnotations.push(part.bbox(false).back().dimension({ offset: dimLevelOffset * 3, units: dimUnits }) as DimensionLine);
        newAnnotations.push(part.bbox(false).left().dimension({ offset: dimLevelOffset * 3, units: dimUnits }) as DimensionLine);

        
        // Level 2: edges on and parallel to sides of bbox
        const bboxSideEdges = part.bbox().rect().edges();
        const sideEdgesUsed = new ShapeCollection();

        bboxSideEdges.forEach((sideEdge,i) => 
        {
            const sideDir = sideEdge.direction().normalized().round().abs();
            const sideDir90 = sideDir.copy().rotateZ(90).abs();
            
            const sideAlongAxis = (sideDir.equals([1,0,0])) ? 'x' : (sideDir.equals([0,1,0])) ? 'y' : false;
            const sideIsOrtho = !!sideAlongAxis;
            const levelCoordAxis = (sideIsOrtho) ? (sideAlongAxis === 'x') ? 'y' : 'x' : null; // dimension level coord that stays same
            const levelCoordValue = roundTo(sideEdge.center()[levelCoordAxis],LEVEL_COORD_ROUND_DECIMALS);

            // These are the original edges on the sides of the part (this can also be only with one vertex)
            const sideEdges = part.edges()
                            .intersecting(sideEdge)
                            .filter(e => {
                                return !(e as Edge).direction().normalize().abs().round().equals(sideDir90) // no perpendicular
                                    && (!e.direction().isOrtho() || (e.direction().isOrtho() && roundTo(e.center()[levelCoordAxis], LEVEL_COORD_ROUND_DECIMALS) === levelCoordValue)) // ortho edges need to be on side, other we allow
                            });

            // We keep track of those, so we don't use them twice
            sideEdgesUsed.addUnique(sideEdges);

            const sideDimOffsetVec = sideEdge.center().toVector().subtracted(part.bbox().center()).normalize();
            /*
            // Not really needed
            if (part.bbox().center().distance(sideEdge.center().moved(sideDimOffsetVec)) 
                    < part.bbox().center().distance(sideEdge.center().moved(sideDimOffsetVec.reversed())))
            {
                sideDimOffsetVec.reverse();
            }
            */
            
            // Generate dimension lines along sides
            const dimLevelVertices = sideEdges
                    .vertices()
                    .add(sideEdge.start(), sideEdge.end())
                    .unique(SIDE_VERTICES_UNIQUE_TOLERANCE) // again: tolerance to be more robust!
                     // make sure we don't include points that are not on level, with tolerance
                    .filter((v) => Math.abs(roundTo(v[levelCoordAxis],LEVEL_COORD_ROUND_DECIMALS) - levelCoordValue) < LEVEL_CHECK_VERTICES_TOLERANCE )
                    .sort((v1,v2) => {
                        // sort x,y ascending. 
                        if(sideAlongAxis === 'x')
                        {
                            // sort on x-axis
                            return v1.x - v2.x;
                        }
                        else {
                            // sort on y-axis
                            return v1.y - v2.y;
                        }
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
                            const dim = this.makeDimensionLine(
                                arr[i-1] as PointLike,
                                v as PointLike, 
                                { 
                                    offsetVec: sideDimOffsetVec, 
                                    offset: dimLevelOffset * 2, 
                                    units: dimUnits,
                                    ortho: sideAlongAxis // always orthogonal
                                });
                            dim.link(part); // link to part as main shape
                            newAnnotations.push(dim)
                        }
                    }
                })
            }
        })

        
        // Level 3 - remaining Edges by direction and length
        const remainingEdges = part.edges()
                                .filter(e => !sideEdgesUsed.has(e)); 
                                    //&& bboxSideEdges.every(bboxEdge => !e.intersects(bboxEdge)));  

        remainingEdges.forEach((e,i) =>
        {
            const dim = this.makeDimensionLine()
                            .fromEdge(e as Edge, { offset: dimLevelOffset * 1  })
            newAnnotations.push(dim)
        });
        
        // Check all annotations one last time and make sure they are unique
        const uniqueAnnotations = this.unique(newAnnotations);
        part.addAnnotations(uniqueAnnotations);
        this.addAnnotations(uniqueAnnotations); // Add to list 
        this.removeSameAtSmallDistance(dimLevelOffset); // Also remove dimensions lines that are too close too each other

        return shapes;
    }

    /** Make (semi) automatic dimension lines through the Shapes of this collection at levels (in percentage of total size or absolute coords) along MainAxis within bbox
     *    @param options:AutoDimSettings
     *    {
     *       levels: Array< Record<MainAxis,number>
     *       minDistance: number (0-1)
     *    }
     * 
     */
    @checkInput(['AnyShapeOrCollection','DimensionLevelSettings'], ['ShapeCollection', 'auto'])
    autoDimLevels(collection:ShapeCollection, settings?:DimensionLevelSettings):Array<DimensionLine>
    {
        const BBOX_MARGIN = 10;
        const SECTION_PLANE_DEPTH = 2;
        const DIMENSION_LINE_OFFSET_FROM_BBOX = 30;
        const DEFAULT_MIN_DISTANCE = 0;
        const ADD_BBOX_OUTLINE_TO_LEVEL_SECTION = true;

        if(!settings || !Array.isArray(settings?.levels)){ throw new Error('Annotator.autoDimLevels(options): No autoDim settings given. Please supply levels ({ axis:x|y|z, at:number }]). Level options are minDistance, coordType, and offset')}

        const collectionBbox = collection.bbox(false); // No annotations here!
        const autoDimLines = [];

        // For every level make a section shape, gather intersection points and draw dimension lines
        settings.levels.forEach((lvl,i) => 
        {
            lvl = lvl as DimensionLevel;

            const levelAxis = lvl?.axis // axis of dimension cutting line
            let levelCoord = lvl?.at; // percentage of size along levelAxis
            
            // NOTE: if coordType not given, We take it that if the level is given in 0 < coord > 1.0 it is absolute
            const levelCoordType = !lvl?.coordType && ((levelCoord < 0 || levelCoord > 1 ) ? 'absolute' : 'relative');

            if(levelCoordType === 'relative')
            {
                levelCoord = (levelCoord > 1.0) ? 1.0 : levelCoord; 
                levelCoord = (levelCoord < 0) ? 0.0 : levelCoord;
            }
            
            const bboxSize = collectionBbox.sizeAlongAxis(levelAxis);
            const rangeAxis = (['x','y','z'] as Array<MainAxis>).find((a) => a !== levelAxis && collectionBbox.axisMissingIn2D() !== a); // dimension section line along this axis

            const sectionLineDepthAxis = (['x','y','z'] as Array<MainAxis>).find(a => a !== levelAxis && a !== rangeAxis); // this axis is not really in play
            const sectionLineRangeStart = collectionBbox.min()[rangeAxis] - BBOX_MARGIN;
            const sectionLineRangeEnd = collectionBbox.max()[rangeAxis] + BBOX_MARGIN;
            const sectionLineStart = new Point(0,0,0)['set'+rangeAxis.toUpperCase()](sectionLineRangeStart);
            const sectionLineEnd = new Point(0,0,0)['set'+rangeAxis.toUpperCase()](sectionLineRangeEnd);
            const sectionLineLevelCoord = (levelCoordType === 'relative') 
                                                ? collectionBbox.minAtAxis(levelAxis) + levelCoord*bboxSize 
                                                : levelCoord;

            const sectionLine = new Edge().makeLine(sectionLineStart,sectionLineEnd) // set basic section line 
                                            ['move'+levelAxis.toUpperCase()](sectionLineLevelCoord); // move line to level coord

            if(lvl?.showLine){ sectionLine.color('red').addToScene() };


            // to deal with accurary issues we use a section plane
            const sectionPlaneNormal = new Vector(0,0,0)['set'+sectionLineDepthAxis.toUpperCase()](1);
            const sectionPlane = sectionLine._extruded(SECTION_PLANE_DEPTH, sectionPlaneNormal)
                                    ['move'+sectionLineDepthAxis.toUpperCase()](-SECTION_PLANE_DEPTH/2);

            // now get unique intersection points of all shapes
            const intersectionPointsAlongRangeAxis = []

            // If we want dimensions from bbox too, add it to shallow copy of collection
            if(ADD_BBOX_OUTLINE_TO_LEVEL_SECTION)
            {
                const bboxOutline = collectionBbox.rect()._toWire();
                collection.add(bboxOutline);
            }

            const intersections = collection._intersections(sectionPlane);

            // Remove last added bbox outline
            if(ADD_BBOX_OUTLINE_TO_LEVEL_SECTION)
            {
                collection.pop();
            }

            if(intersections.length === 0)
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
            
            // Now make the dimension lines at a given coord (parallel to section line) 
            // based on align ('min','max,'auto') and offset
            let dimLinesLevelCoord = sectionLineLevelCoord;

            if(lvl?.align === false)
            {
                // user diabled align by setting it to false. Default is auto align (see below)
            }
            else if ( lvl?.align === true || lvl?.align === 'auto' || (lvl?.align ?? true) === true ) // last term checks nullish
            {
                // section line on side of bbox at levelAxis that is closest to given sectionLineLevelCoord
                const minSide = collectionBbox['min'+levelAxis.toUpperCase()]();
                const maxSide = collectionBbox['max'+levelAxis.toUpperCase()]();
                dimLinesLevelCoord = Math.abs(sectionLineLevelCoord - minSide) <  Math.abs(sectionLineLevelCoord - maxSide) ? minSide : maxSide;
            }
            else if(['min','max'].includes(lvl?.align as string))
            {
                dimLinesLevelCoord = collectionBbox[lvl.align+levelAxis.toUpperCase()]() 
            }

            const minDistance = lvl?.minDistance ?? DEFAULT_MIN_DISTANCE;
            // Determine offset Vector based on line and collection: Should always point outwards of collection
            const offsetVec = sectionLine.normal()
            if( collection.center().distance(sectionLine.center().moved(offsetVec)) 
                    < collection.center().distance(sectionLine.center().moved(offsetVec.reversed())))
            {
                offsetVec.reverse(); 
            }

            intersectionPointsAlongRangeAxis.forEach((v,i,arr) => 
            {
                if(i < arr.length -1 )
                {
                    const lineStartCoord = v;
                    const lineEndCoord = arr[i+1];
                    const distance = lineEndCoord - lineStartCoord;
                    if(roundToTolerance(distance) > minDistance) // TODO: Use the dimension value rounding settings to avoid zero values in dim lines
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
                                                offset: (lvl?.offset ?? DIMENSION_LINE_OFFSET_FROM_BBOX), 
                                                offsetVec: offsetVec,
                                                roundDecimals: 0,
                                            }
                                        ).link(collection);

                        autoDimLines.push(dimLine);
                    }
                }
            })
        })

        return autoDimLines;
    }

    //// MANAGING MULTIPLE ANNOTATIONS 

    /** Filter out the same annotations
     *  See isSame for config flags
     */
    unique(annotations:Array<Annotation>, flags:Record<string,any> = {}):Array<Annotation>
    {
        if(!Array.isArray(annotations))
        {
            console.error(`Annotator::unique(annotations): Please supply annotations in Array!`);
            return annotations;
        }

        const annotationsById = annotations
                                    .filter(a => BaseAnnotation.isAnnotation(a))
                                    .reduce((acc,a) => {
                                        const id = a.sameId(flags);
                                        if(!acc[id]) acc[id] = a; // first only
                                        return acc;
                                    }, {} as Record<string,Annotation>); // NOTE: first ones are keps                                

        const uniqueAnnotations = Object.values(annotationsById);
        console.info(`Annotator::filterOutSame(annotations): Returned ${uniqueAnnotations.length}/${annotations.length} unique annotations!`)

        return uniqueAnnotations;
    }

    /** Remove annotations that have same value and are close to each other */
    removeSameAtSmallDistance(d:number, sameFlags:Record<string,any>={}):this
    {
        // Annotations grouped by same id
        const annotationsGroups = this.getAnnotations()
                                        .reduce((acc,a) => 
                                        {
                                                const sameId = a.sameId({ ...sameFlags, compareWithShape: false }); // exclude shape
                                                (!acc[sameId]) ? acc[sameId] = [a] : acc[sameId].push(a);
                                                return acc;
                                        }, {});

        const selectedAnnotations = [] as Array<Annotation>;
        
        Object.keys(annotationsGroups).forEach( id => 
        {
            const groupedAnnotations = annotationsGroups[id];
            if(groupedAnnotations.length === 1)
            {
                selectedAnnotations.push(groupedAnnotations[0]); // add single - this goes through
            }
            else {
                // consider the same annotations (without shape) and check distance
                const fa = groupedAnnotations[0];
                selectedAnnotations.push(fa); // first goes through
                groupedAnnotations.forEach((a,i) => {
                    if(i > 0)
                    {
                        if(fa.toShape().distance(a.toShape()) > d )
                        {
                            selectedAnnotations.push(a);
                        }
                    }
                })
            }
        })

        console.info(`Annotator::removeSameAtSmallDistance(): Removed ${this.getAnnotations().length - selectedAnnotations.length}/${this.getAnnotations().length} annotations within distance ${d}`);
        
        this.setAnnotations(selectedAnnotations);
        return this;
    }
}
