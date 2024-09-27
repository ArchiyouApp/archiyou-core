/**
 * 
 *  ShapeCollection: A Collection with Shapes or ShapeCollections
 *   For example when with intersection and splits the Shapes into seperate Shape instances (Vertex, Edge, Wire, Face, Shell etc.)
 *
 *    ShapeCollection makes operating on multiple Shapes as easy as working on single Shapes (Inspired like JTS/GEOS). 
 *
 *   - TODO: Find a good strategy for this
 *   - TODO: The Scene is also a ShapeCollection => clear and advanced Object trees for navigation
 */

 import { isCoordArray, PointLike, isPointLike, isPointLikeSequence, PointLikeOrAnyShapeOrCollection,
         ShapeType, AnyShape, isAnyShape, AnyShapeOrCollection,AnyShapeCollection, isAnyShapeCollection, MakeShapeCollectionInput, isMakeShapeCollectionInput, 
         Pivot,AnyShapeSequence, Alignment, Bbox, Side} from './internal' // see types
 import { Obj, Point, Vector, Shape, Vertex, Edge, Wire, Face, Shell, Solid } from './internal'
 import { MeshShape, MeshShapeBuffer, MeshShapeBufferStats } from './internal' // types
 import { addResultShapesToScene, checkInput } from './decorators'; // Import directly to avoid error in ts-node/jest
 import type { Annotation, AutoDimLevel, ObjStyle, toSVGOptions } from './internal'; // NOTE: Vite does not allow re-importing interfaces and types
 import { flattenEntitiesToArray, flattenEntities } from './internal'  // utils
 import { LayoutOrderType, LayoutOptions, AutoDimSettings, MainAxis } from './internal'

 import { SHAPE_EXTRUDE_DEFAULT_AMOUNT, SHAPE_SCALE_DEFAULT_FACTOR } from './internal';
 import { MeshingQualitySettings } from './types';

 // special libraries
 import chroma from 'chroma-js';
 import { packer } from 'guillotine-packer' // see: https://github.com/tyschroed/guillotine-packer
 
 interface PackerItem {
   name:string
   width:number
   height:number
   shapeIndex:number
 }
 interface PackerResultItem {
   bin:number
   width:number
   height:number
   x:number
   y:number
   item:PackerItem
 }


 export class ShapeCollection
 {
      /*  ShapeCollection cannot contain other ShapeCollections. Hierarchies are managed by Obj container class */
      _oc:any; // Don't set to null!
      _geom:any; // Set on init of Geom
      _obj:Obj = null; // Obj container
      shapes:Array<AnyShape> = []; // No ShapeCollection here
      _groups:{[key:string]:Array<AnyShape>} = {}; // mechanism to define groups within ShapeCollection (experimental)
   
      constructor(entities?:MakeShapeCollectionInput, ...args)
      {
         if (entities)
         {
            entities = (Array.isArray(entities) && !isCoordArray(entities)) ? entities.concat(args) : [entities, ...args];
            // NOTE: Array.flat() might be interesting, except it does collapse coord arrays. Manual way to flatten entities?
            entities = flattenEntities(entities); // NOTE: we could also use flattenEntitiesToArray

            this.fromAll(entities);
         }
      }

      /** Try to convert anything to a ShapeCollection */
      // We use an incremental way of iterating over collections (Arrays, ShapeCollections), testing the entities and adding them
      @checkInput('MakeShapeCollectionInput', 'auto') // no conversion of types
      fromAll(entities?:MakeShapeCollectionInput):AnyShapeCollection
      {
         // protect against single PointLike
         entities = (Array.isArray(entities) && !isCoordArray(entities)) ? entities : [entities]; 
         entities = flattenEntities(entities); // NOTE: we could also use flattenEntitiesToArray
         
         this._addEntities(entities); // pack all together
         this._setFakeArrayKeys();

         return this;
      }

      /** Class method */
      static fromAll(s:any,...args):ShapeCollection
      {
         let entities = (Array.isArray(s) && !isCoordArray(s)) ? s.concat(args) : [s, ...args];
         return new ShapeCollection().fromAll(entities);
      }

      /** Add entities (geometry and shapes) to Shape Collection */
      // Extra: add entities as group to organize shapes inside the ShapeCollection
      @checkInput(['MakeShapeCollectionInput', ['String', null]], ['auto','auto']) // no conversion of types
      _addEntities(entities?:MakeShapeCollectionInput, group?:string):AnyShapeCollection
      {
         if(entities == null)
         {
            return this;
         }
         
         let allEntities = flattenEntitiesToArray(entities);

         // auto grouping strategy: for now only group when incoming entities is a Collection and if a name is given to the collection
         
         allEntities.forEach( es => 
         {
            let addedShapes = []; // keep track of added Shapes for grouping

            if (es === null)
            {
               console.warn('ShapeCollection::_addEntities: Skipped null!')
            }
            else if(isPointLike(es))
            {
               let vertex = (!(es instanceof Vertex)) ? new Vertex(es as PointLike) : es as Vertex;
               addedShapes.push(vertex);
               this.shapes.push(vertex); // IMPORTANT: don't make new Vertex is already one: otherwise problems with selectors!
            }
            // single ShapeCollection
            else if(isAnyShapeCollection(es))
            {
               // auto grouping
               if(!group) // if not already user defined group
               { 
                  const collName = (es as ShapeCollection).getName() as string;
                  group =  (collName !== 'UnnamedShapeCollection') ? collName : null;
               }

               // flatten an given ShapeCollection into this one
               let shapes = (es as ShapeCollection).shapes;
               this.shapes = this.shapes.concat(shapes);
               addedShapes = addedShapes.concat(shapes);
            }
            else if(isPointLikeSequence(es)) // NOTE: this needs to be later than single ShapeCollection
            {
               let points = new ShapeCollection(es); // bring all point sequences in collection
               points.forEach( e => 
               {
                  if(isPointLike(e))
                  {
                     let vertex = (!(e instanceof Vertex)) ? new Vertex(e) : e;
                     this.shapes.push(vertex);
                     addedShapes.push(vertex);
                  }
                  else if(isAnyShape(e))
                  {
                     if ( !((e as Shape).isEmpty()) )
                     {
                        this.shapes.push(e as Shape);
                        addedShapes.push(e);
                     }
                     else {
                        console.warn(`ShapeCollection::_addEntities: Empty Shape detected: ${e}. Skipped!`);
                     }
                  }
                  else if(isAnyShapeCollection(e))
                  {
                     let vertices = (e as ShapeCollection).getShapesByType('Vertex');
                     this.concat( vertices ); // append all vertices in collection
                     addedShapes = addedShapes.concat(vertices);
                  }
               })
            }
            // single Shape: also protect against empty Shapes
            else if(isAnyShape(es))
            {
               if (!((es as Shape).isEmpty()))
               {
                  this.shapes.push(es as AnyShape);
                  addedShapes.push(es);
               }
               else {
                  console.warn(`ShapeCollection::_addEntities: Empty Shape ("${es.type()}") detected. Skipped!`)
               }
            }
            else {
               console.warn(`ShapeCollection::_addEntities: Unknown entity ${es}: Skipped!`);
            }

            // order incoming entities in group (NOTE: can be an array of ShapeCollections)
            if (group)
            {
               if(this._groups[group])
               {
                  this._groups[group] = this._groups[group].concat(addedShapes)
               }
               else {
                  this._groups[group] = addedShapes;
               }
               group = null; // reset
            }
         }
         );

         this._setFakeGroupKeys();

         return this;
      }

      /** Add entities as named group */
      // TODO: organize scene tree too!
      @checkInput([['String', null], 'MakeShapeCollectionInput'], ['auto','auto']) // no conversion of types
      addGroup(group?:string, entities?:MakeShapeCollectionInput):AnyShapeCollection
      {
         let c = this._addEntities(entities, group);
         this._setFakeGroupKeys();
         return c;
      }

      _defineGroup(name:string, shapes?:ShapeCollection)
      {
         if(!shapes){ shapes = this }

         if(!name)
         {
            return null;
         }

         if(this._groups[name])
         {
            this._groups[name] = this._groups[name].concat(shapes.toArray());
         }
         else {
            this._groups[name] = shapes.toArray();
         }

         this._setFakeGroupKeys();
      }

      /** Get available groups in this ShapeCollection */
      groups():Array<string>  
      {
         return Object.keys(this._groups);
      }

      /** Get shapes in group as ShapeCollection */
      getGroup(name:string):ShapeCollection
      {
         if(name)
         {
            return (this._groups[name]) ? new ShapeCollection(this._groups[name]) : null;
         }
         return null;
      }

      /** Alias for getGroup */
      group(name:string):ShapeCollection
      {
         return this.getGroup(name);
      }

      /** Iterate over Shapes by group, ungrouped Shapes are grouped together */
      forEachGroup(func:(groupName:string, groupedShapes:ShapeCollection) => void)
      {
         const allGroupedShapes = new ShapeCollection();
         this.groups().forEach((groupName) => 
         {
            const groupedShapes = this.getGroup(groupName)
            func(groupName, groupedShapes);
            allGroupedShapes.add(groupedShapes);
         })

         // gather ungrouped Shapes as one group
         const nonGroupedShapes = this.removed(allGroupedShapes)
         if (nonGroupedShapes.length)
         {
            func(null, nonGroupedShapes)
         }
      }


      /* EXPERIMENTAL: try to be compatible with Arrays by setting index keys on this instance */
      _setFakeArrayKeys()
      {
         // remove previous if any
         let i = 0;
         while(true)
         {
            if (this[i])
            {
               delete this[i];
               i++;
            }
            else {
               break;
            }
         }
         // add fake keys
         this.shapes.forEach( (shape,index) => this[index] = shape);
         
      }

      /** EXPERIMENTAL: directly access groups by adding property to instance */
      _setFakeGroupKeys()
      {
         Object.entries(this._groups).forEach(([k,v]) => { 
            if (k !== 'shapes')  // don't set shapes because this will break access to real data
            { 
               this[k] = new ShapeCollection(v) 
            }
         }); 
      }

      //// TRANFORMATIONS ////

      /** Export to OC ListOfStype, used for Splitter algoritm */
      _toOcListOfShape()
      {
         /* OC docs:
               - https://dev.opencascade.org/doc/refman/html/class_n_collection___list.html
         */
         let ocShapeList = new this._oc.TopTools_ListOfShape_1();
         this.shapes.forEach( shape => ocShapeList.Append_1(shape._ocShape));

         return ocShapeList;
      }

      toOcShapes():Array<any>
      {
         return this.shapes.map( shape => shape._ocShape );
      }

      /** Combine all children Shapes into one Compund Shape (for export) */
      toOcCompound()
      {
         /* OC docs: 
            - https://dev.opencascade.org/doc/refman/html/class_topo_d_s___compound.html
            -
         */
         let ocCompound = new this._oc.TopoDS_Compound(); 
         let ocSceneBuilder = new this._oc.BRep_Builder();
         let ocShapes = this.toOcShapes();
         ocSceneBuilder.MakeCompound(ocCompound);
         
         ocShapes.forEach(ocShape => {
            ocSceneBuilder.Add(ocCompound, ocShape);
         })
         
         return ocCompound;
      }

      getShapes():Array<AnyShape>
      {
         return this.shapes;
      }

      //// ARRAY API ////

      /** Array API - for consitent API with Array */
      get length():number
      {
         return this.count();
      }

      /** Array API - For consistency with Array */
      @checkInput('AnyShapeSequence', 'ShapeCollection')
      concat(other:AnyShapeSequence):AnyShapeCollection
      {
         other = other as ShapeCollection;
         this.shapes = this.shapes.concat(other.shapes);
         this._setFakeArrayKeys();
         return this;
      }

      /** Array API - For consistency with Array */
      map(mapFunc: (element:AnyShape, index?:number, array?:Array<AnyShape>) => AnyShape ):AnyShapeCollection
      {
         // !!!! TODO: this functions takes it that we map new Shapes, this is not always the case with map !!!!
         return new ShapeCollection(this.shapes.map(mapFunc) as Array<any>); // avoid TS errors
      }

      /** Array API  */
      every(checkFunc: (element:AnyShape, index?:number, array?:Array<AnyShape>) => boolean ):boolean
      {
         return this.shapes.every(checkFunc);
      }

      /** Place this ShapeCollection (and all it's child Shapes) into the Obj container */
      setObj(obj:Obj)
      {
         this._obj = obj;
         
         this.shapes.forEach(s => {
            s._obj = obj;
         });
      }

      /** Add Shape to ShapeCollection */
      add(shapes?:AnyShapeOrCollection|Array<AnyShapeOrCollection>, ...args):AnyShapeCollection
      {
         this._addEntities([shapes, ...args])
         this._setFakeArrayKeys();

         return this;
      }

      /** Remove Shapes from ShapeCollection */
      @checkInput('AnyShapeOrCollection', 'ShapeCollection')
      remove(shapes:AnyShapeOrCollection, ...args): ShapeCollection
      {
         let removeShapes = shapes as ShapeCollection;

         this.shapes = this.shapes.filter( s => !removeShapes.has(s));

         // check groups and remove if needed
         Object.values(this._groups).forEach( groupColl => 
         {
            removeShapes.forEach((removeShape) => {
               const indexOf = groupColl.indexOf(removeShape)
               if( indexOf !== -1)
               {
                  groupColl.splice(indexOf, 1)
               }
            })
         })

         this._setFakeArrayKeys();
         this._setFakeGroupKeys();

         return this;
      }

      /** Clear current ShapeCollection */
      empty():this
      {
         this.remove(this);
         return this;
      }

      /** Return a new Collection of given Shapes removed */
      @checkInput('AnyShapeOrCollection', 'ShapeCollection')
      removed(shapes:AnyShapeOrCollection): ShapeCollection
      {
         const newCollection = this.shallowCopy();
         newCollection.remove(shapes)
         return newCollection;
      }


      /** Add Shape at beginning of collection */
      @checkInput('AnyShape', 'auto')
      prepend(shape:AnyShape):ShapeCollection
      {
         this.shapes = [shape].concat(this.shapes);
         return this;
      }

      /** Add Shape at beginning of collection */
      @checkInput('AnyShape', 'auto')
      prepended(shape:AnyShape):ShapeCollection
      {
         return new ShapeCollection([shape].concat(this.shapes));
      }

      /** Add Shape to right of current ShapeCollection */
      @checkInput('AnyShape', 'auto')
      addAligned(shape:AnyShape):this
      {
         const NEXT_MARGIN = 10;

         if(this.isEmpty())
         {
            // just add new Shape in center
            this.add(shape.moveToOrigin());
         }
         else {
            // add new Shape next other shapes
            let shapePosition = this.center().add(this.bbox().width() + NEXT_MARGIN + shape.bbox().width());
            this.add(shape.moveTo(shapePosition));
         }

         return this;
      }

      @checkInput(['AnyShapeOrCollection','AnyShapeOrCollection'],['ShapeCollection','ShapeCollection'])
      replace(shapes:AnyShapeOrCollection, newShapes:AnyShapeOrCollection):ShapeCollection
      {
         this.remove(shapes as ShapeCollection)
         this.add(newShapes as ShapeCollection);

         return this;
      }

      //// SHAPE API ////

      /** Set attribute to all shapes */
      attribute(key:string, value:any):AnyShapeCollection
      {
         if(!(typeof(key) === 'string') || !value){ throw new Error(`ShapeCollection::atribute: Please supply a key and value! (ie. attribute('name', 'archiyou'))`) }

         this.forEach(shape => shape.attribute(key,value))

         return this;
      }

      /** Shape API - move all Shapes in ShapeCollection */
      @checkInput('PointLike','Vector') // this automatically transforms Types
      move(vector:PointLike, ...args):AnyShapeCollection
      {
         this.shapes.forEach( shape => shape.move(vector as Vector));

         return this;
      }

      /** Shape API - move a copy of all Shapes in ShapeCollection */
      @checkInput('PointLike','Vector') // this automatically transforms Types
      moved(vector:PointLike, ...args):AnyShapeCollection
      {
         let newCollection = this.copy();
         newCollection.shapes.forEach( shape => shape.move(vector as Vector)); // 

         return newCollection;
      }


      /**  Shape API - Move center of Collection to a given point */
      // NOTE: This might be a bit weird: Moving all Shapes in this Collection to the same coordinate */
      @checkInput('PointLike','Vector') // this automatically transforms Types
      moveTo(to:PointLike, ...args):AnyShapeCollection
      {
         let moveVec = (to as Vector).subtract(this.center().toVector());
         this.shapes.forEach( shape => shape.move(moveVec));

         return this;
      }

      /** Center Shape so that the center of the Shape is at the origin */
      moveToOrigin():AnyShapeCollection
      {
         this.moveTo(0,0,0);
         return this;
      }

      /** Aliass for move along x-direction */
      @checkInput(Number, 'auto')
      moveX(distance:number):this
      {
         this.move(distance)
         return this;
      }

      /** Aliass for move along x-direction */
      @checkInput(Number, 'auto')
      moveY(distance:number):this
      {
         this.move(0,distance,0)
         return this;
      }

      /** Aliass for move along x-direction */
      @checkInput(Number, 'auto')
      moveZ(distance:number):this
      {
         this.move(0,0,distance)
         return this;
      }

      /** Shape API */
      @checkInput([ [Number,0],[Number,0], [Number,0], ['Pivot', 'center']], [Number,Number,Number,'auto']) // IMPORTANT: not able to directly convert Pivot to Vector because pivot needs current Shape (can that be accessed in decorator?)
      rotateEuler(degX?:number, degY?:number, degZ?:number, pivot?:PointLike):AnyShapeCollection
      {
         if (pivot === 'center'){ pivot = this.center();} // use center of ShapeCollection as pivot, not of individual Shape
         this.shapes.forEach( shape => shape.rotateEuler(degX, degY, degZ, pivot));
         return this;
      }

      /** Shape API */
      @checkInput([ [Number,0],[Number,0], [Number,0], ['Pivot', 'center']], [Number,Number,Number,'auto']) // IMPORTANT: not able to directly convert Pivot to Vector because pivot needs current Shape (can that be accessed in decorator?)
      rotatedEuler(degX?:number, degY?:number, degZ?:number, pivot?:PointLike):AnyShapeCollection
      {
         let newCollection = this.copy();
         if (pivot === 'center'){ pivot = this.center();} // use center of ShapeCollection as pivot, not of individual Shape
         newCollection.shapes.forEach( shape => shape.rotateEuler(degX, degY, degZ, pivot));
         return this;
      }

      /** Shape API - Rotate all Shapes around their centers with a given x,y,z angles */
      @checkInput('PointLike', Vector)
      rotate(r:PointLike, ...args):AnyShapeCollection // allows flattened notation rotate(180,0,-90)
      {
         let rv = r as Vector; // automatically converted to Vector
         let newCollection = new ShapeCollection();
         newCollection.shapes.forEach( shape => shape.rotateX(rv.x).rotateY(rv.y).rotateZ(rv.z) );
         return this;
      }

      /** Shape API - Rotate all Shapes around the x-axis with a given angle and given pivot (default: center) */
      @checkInput([Number,['Pivot','center']], [Number, 'auto'])
      rotateX(deg:number, pivot?:Pivot):AnyShapeCollection
      {
         if (pivot === 'center'){ pivot = this.center();} // use center of ShapeCollection as pivot, not of individual Shape
         this.shapes.forEach( shape => shape.rotateX(deg, pivot));
         return this;
      }

      /** Shape API - Rotate all Shapes around the y-axis with a given angle and given pivot (default: center) */
      @checkInput([Number,['Pivot','center']], [Number, 'auto'])
      rotateY(deg:number, pivot?:Pivot):AnyShapeCollection
      {
         if (pivot === 'center'){ pivot = this.center();} // use center of ShapeCollection as pivot, not of individual Shape
         this.shapes.forEach( shape => shape.rotateY(deg, pivot));
         return this;
      }

      /** Shape API - Rotate all Shapes around the z-axis with a given angle and given pivot (default: center of ShapeCollection) */
      @checkInput([Number,['Pivot','center']], [Number, 'auto'])
      rotateZ(deg:number, pivot?:Pivot):AnyShapeCollection
      {
         if (pivot === 'center'){ pivot = this.center();} // use center of ShapeCollection as pivot, not of individual Shape

         this.shapes.forEach( shape => shape.rotateZ(deg, pivot));
         return this;
      }

      /** Shape API - Rotate all Shapes around a specific axis with a given angle (default: [0,0,1]) and given pivot (default: center) */
      @checkInput([Number,['PointLike',[0,0,1]],['Pivot','center'] ], [Number, 'Vector', 'auto'])
      rotateAround(angle:number, axis?:PointLike, pivot?:Pivot):AnyShapeCollection
      {
         if (pivot === 'center'){ pivot = this.center();} // use center of ShapeCollection as pivot, not of individual Shape
         this.shapes.forEach( shape => shape.rotateAround(angle, axis, pivot));

         return this;
      }

      /** Scale entire ShapeCollection */
      @checkInput([[Number,SHAPE_SCALE_DEFAULT_FACTOR], ['PointLike', null]],[Number,'Point'])
      scale(factor?:number, pivot?:PointLike):AnyShapeCollection
      {
         pivot = pivot || this.center();
         this.shapes.forEach( shape => shape.scale(factor,pivot));
         return this;
      }

      /** Scale entire ShapeCollection and return copy */
      @addResultShapesToScene
      @checkInput([[Number,SHAPE_SCALE_DEFAULT_FACTOR], ['PointLike', null]],[Number,'Point'])
      scaled(factor?:number, pivot?:PointLike):AnyShapeCollection
      {
         let newCollection = this._copy();
         newCollection.scale(factor);
         return newCollection;
      }

      /** Shape API - Align Shapecollection to other Shape or ShapeCollection */
      @checkInput(['AnyShapeOrCollection',['Pivot','center'],['Alignment', 'center']],['auto','auto','auto'])
      align(other:AnyShapeOrCollection, pivot?:Pivot, alignment?:Alignment):AnyShapeOrCollection
      {
         // pivot using bbox() of ShapeCollection
         const pivotAlignPerc:Array<number> = (this.bbox().box() || this.bbox().rect())._alignPerc(pivot)
         const alignmentPerc:Array<number> = (ShapeCollection.isShapeCollection(other)) ? 
                                             (other.bbox().box() || other.bbox().rect())._alignPerc(alignment) :
                                             (other as Shape)._alignPerc(alignment)
         
         const fromPosition = this.bbox().getPositionAtPerc(pivotAlignPerc).toVector();
         const toPosition = other.bbox().getPositionAtPerc(alignmentPerc).toVector();

         this.move(toPosition.subtracted(fromPosition)); //.move(pivotOffsetVec);

         return this;
      }

      /** Shape API - */
      alignByPoints(...args):AnyShapeCollection
      {
         console.warn('ShapeCollection.alignByPoint: **** TO BE IMPLEMENTED ****');
         return this;
      }

      /** Shape API - */
      alignedByPoints(...args):AnyShapeCollection
      {
         console.warn('ShapeCollection.alignedByPoint: **** TO BE IMPLEMENTED ****');
         return this;
      }

      /** Shape API - */
      rotateVecToVec(...args):AnyShapeCollection
      {
         console.warn('ShapeCollection.rotateVecToVec: **** TO BE IMPLEMENTED ****');
         return this;
      }

      /** Shape API - Make an geometric array by offset ShapeCollection */
      array(size:number|Array<number>, spacings:number|Array<number>):AnyShapeCollection
      {
         let newShapes = new ShapeCollection();
         this.shapes.forEach( shape => {
            newShapes.add( shape.array(size,spacings));
         });

         return newShapes;
      }

      /** Shape API */
      @checkInput([Number,'PointLike'], [Number, 'Point']) 
      _array1D(size:number, spacingOffset:PointLike):AnyShapeCollection
      {
         let newCollection = new ShapeCollection();
         this.shapes.forEach( shape => {
            newCollection.add( shape._array1D(size,spacingOffset));
            // NOTE: array always returns the original Shape too - we get doubles in new ShapeCollection
         });

         return newCollection.unique(); // Remove doubles with unique()
      }

      /** Shape API - Mirror Shapes in ShapeCollection with mirror plane defined by planeNormal and origin */
      @checkInput([['PointLike', [0,0,0]], ['PointLike', 'x']], ['Vector', 'Vector']) // the default mirror plane is the YZ plane with normal +X-axis at [0,0,0]
      mirrored(origin:PointLike, planeNormal:PointLike):AnyShapeCollection
      {
         let newCollection = new ShapeCollection();
         this.shapes.forEach( shape => {
            newCollection.add(shape.mirrored(origin, planeNormal));
         });
         return newCollection;
      }

      /** Shape API - Mirror Shapes relative to X-plane (x=0) with its collection center as pivot or given offset x-coord */
      @checkInput([[Number,null]], ['auto'])
      mirrorX(offset?:number):AnyShapeCollection
      {
         offset = offset ?? this.center().y; // based on given offset or center of collection

         this.shapes.forEach( shape => {
            shape.mirrorX(offset);
         })
         return this;
      }

      /** Shape API - Mirror copies of Shapes relative to X-plane (x=0) with its collection center as pivot or given offset x-coord */
      @checkInput([[Number,null]], 'auto')
      _mirroredX(offset?:number)
      {
         const newCollection = new ShapeCollection();
         offset = (offset !== null) ? offset : this.center().y; // based on given offset or center of collection
         this.shapes.forEach(shape => newCollection.add(shape._mirroredX(offset)));
         return newCollection;
      }

      /** Shape API - Mirror copies of Shapes relative to X-plane (x=0) with its collection center as pivot or given offset x-coord */
      @addResultShapesToScene
      @checkInput([[Number,null]], 'auto')
      mirroredX(offset?:number)
      {
         return this._mirroredX(offset);
      }

      /** Shape API - Mirror Shapes relative to Y plane (y=0) with its collection center as pivot or given offset y-coord */
      @checkInput([[Number,null]], 'auto')
      mirrorY(offset?:number):AnyShapeCollection
      {
         offset = offset ?? this.center().x; // based on given offset or center of collection

         this.shapes.forEach( shape => {
            shape.mirrorY(offset);
         })
         return this;
      }

      /** Shape API - Mirror copies of Shapes relative to Y plane (y=0) with its collection center as pivot or given offset y-coord */
      @checkInput([[Number,null]], 'auto')
      _mirroredY(offset?:number)
      {
         const newCollection = new ShapeCollection();
         offset = offset ?? this.center().x // based on given offset or center of collection
         this.shapes.forEach(shape => newCollection.add(shape._mirroredY(offset)));
         return newCollection;
      }

      /** Shape API - Mirror copies of Shapes relative to Y plane (y=0) with its collection center as pivot or given offset y-coord */
      @addResultShapesToScene
      @checkInput([[Number,null]], 'auto')
      mirroredY(offset?:number)
      {
         return this._mirroredY(offset);
      }

      /** Shape API - Mirror Shapes relative to Z plane (z=0) with its collection center as pivot or given offset z-coord */
      @checkInput([[Number,null]], 'auto')
      mirrorZ(offset?:number):AnyShapeCollection
      {
         offset = offset ?? this.center().z; // based on given offset or center of collection
         this.shapes.forEach( shape => {
            shape.mirrorZ(offset);
         })
         return this;
      }

      /** Shape API - Mirror copies of Shapes in Z-plane (z=0) with its collection center as pivot or given offset z-coord */
      @checkInput([[Number,null]], 'auto')
      _mirroredZ(offset?:number)
      {
         const newCollection = new ShapeCollection();
         offset = offset ?? this.center().z; // based on given offset or center of collection
         this.shapes.forEach(shape => newCollection.add(shape._mirroredZ(offset)));
         return newCollection;
      }

      /** Shape API - Mirror copies of Shapes relative to XZ plane with its collection center as pivot or given offset z-coord */
      @addResultShapesToScene
      @checkInput([[Number,null]], 'auto')
      mirroredZ(offset?:number)
      {
         return this._mirroredZ(offset);
      }

      /** Shape API - offset Shapes in Collection */
      @checkInput([[Number,null],[String, null],['PointLike', null]], ['auto', 'auto', 'Vector'])
      offset(amount?:number, type?:string, onPlaneNormal?:PointLike):AnyShapeCollection
      {
         this.shapes.forEach( shape => (shape as Shape).offset(amount, type, onPlaneNormal) )

         return this;
      }

      /** Shape API - create copeis and offset Shapes in Collection  */
      @checkInput([[Number,null],[String, null],['PointLike', null]], ['auto', 'auto', 'Vector'])
      offsetted(amount?:number, type?:string, onPlaneNormal?:PointLike):AnyShapeCollection
      {
         let newCollection = new ShapeCollection();
         this.shapes.forEach( shape => {
            newCollection.add((shape as Shape).offsetted(amount, type, onPlaneNormal));
         });

         return newCollection;
      }

      /** Shape API - Extrude Shapes in ShapeCollection a certain amount in a given direction (default: [0,0,1]) */
      @checkInput([ [Number, SHAPE_EXTRUDE_DEFAULT_AMOUNT], ['PointLike', null ]], [Number, 'auto'])
      extrude(amount?:number, direction?:PointLike):AnyShapeCollection
      {
         this.shapes.forEach( shape => {
            shape.extrude(amount, direction);
         });

         return this;
      }

      /** Shape API - Extrude Shapes in ShapeCollection a certain amount in a given direction (default: [0,0,1]) */
      @checkInput([ [Number, SHAPE_EXTRUDE_DEFAULT_AMOUNT], ['PointLike', null ]], [Number, 'auto'])
      extruded(amount?:number, direction?:PointLike):AnyShapeCollection
      {
         let newCollection = new ShapeCollection();
         this.shapes.forEach( shape => {
            newCollection.add(shape.extruded(amount, direction));
         });

         return newCollection;
      }

      @checkInput([Number, [String, 'center']], [Number, String])
      thicken(amount:number,  direction?:string):ShapeCollection
      {
         this.forEach( shape => 
         {
           shape.thicken(amount, direction) 
         })
         return this;
      }

      /** Create a new ShapeCollection with thickened Shapes */
      @checkInput([Number, [String, 'all']], [Number, String])
      thickened(amount:number,  direction?:string):ShapeCollection
      {
         let newCollection = new ShapeCollection();
         this.shapes.forEach( shape => 
         {
            newCollection.add(shape.thickened(amount, direction));
         })
         return newCollection;
      }

      /* !!!! TODO  SHAPE API !!!!
         
         more operations that make sense:
         - thicken
         - sweep?
         - loft?

      */

      /** Shape API: Copy entire ShapeCollection and its Shapes and return a new one */
      _copy():ShapeCollection
      {
         const newShapeCollection = new ShapeCollection();
         // copy by group - including non-grouped shapes as seperate group (=null)
         this.forEachGroup( (groupName, groupShapes) => 
         {
            const copiedShapes = groupShapes.map(shape => shape._copy())
            newShapeCollection.addGroup(groupName, copiedShapes); 
         })
         newShapeCollection.setName( this._geom.getNextLayerName( 'CopyOf' + this.getName() ));
         newShapeCollection._setFakeArrayKeys();

         return newShapeCollection;
      }

      /** Shape API: Copy entire ShapeCollection and its Shapes and return a new one (add to Scene) */
      // NOTE: this is a deep copy! We use this by default to be in line with Shape API
      copy():ShapeCollection
      {
         const newShapeCollection = this._copy();
         newShapeCollection.addToScene();
         return newShapeCollection;
      }

      /** Make new ShapeCollection without copying the Shapes */
      shallowCopy():ShapeCollection
      {
         return new ShapeCollection(this.shapes);
      }

      /** Shape API */
      type():string
      {
         // TODO: Distinguish between: Mixed and the same geometries (like ShapeCollection, EdgeCollection, VertexCollection etc)
         return 'ShapeCollection';
      }

      /** Shape API */
      isShape():boolean
      {
         return false; // Don't make this return - it turns out it's confusing!
      }

      /** Shape/ShapeCollection API consistency */
      isShapeCollection():boolean
      {
         return this.type() == 'ShapeCollection';
      }

      /* Test if a given object is a ShapeCollection */
      static isShapeCollection(obj:any): boolean
      {
         return (!obj) ? false : (obj.type && obj.type() == 'ShapeCollection');
      }

      /** Shape API */
      center():Point
      {
         switch (this.count())
         {
            case 0:
               return null;
            case 1:
               return (this.first().bbox()) ? this.first().bbox().center() : null; 
            default:
               return this.bbox().center();
         }
      }

      /** Shape API - get combined bbox of all Shapes in Collection */
      bbox(withAnnotations:boolean=false):Bbox|null
      {
         if(this.length == 0) return null;

         let combinedBbox = this.first().bbox();
         this.shapes.forEach((shape,i) => {
            if(i > 0)
            {
               // This does not take in the shapes not tied to shapes
               let bbox = shape.bbox(withAnnotations);
               if(bbox)
               {
                  combinedBbox = combinedBbox.added(bbox);
               }
            }
         })

         return combinedBbox;
      }

      /** Shape API: get combined Shape area */
      area():number
      {
         return this.reduce((agg,s) => agg + s.area(), 0)
      }

      /** Shape API: get combined Shape volume */
      volume():number
      {
         return this.reduce((agg,s) => agg + s.volume(), 0)
      }

      /** Shape API */
      _hashcode():string
      {
         // TODO: We need to have this to be consistent with Shape
         return null;
      }
      

      /** Shape API */
      @checkInput('PointLikeOrAnyShapeOrCollection', 'auto')
      _intersections(others:PointLikeOrAnyShapeOrCollection):ShapeCollection
      {         
         if(this.count() == 0)
         {
            // no Shapes in ShapeCollection
            return this;
         }

         if (isPointLike(others))
         {
            others = new Point(others)._toVertex(); // convert PointLike to Vertex so it is a Shape
         }

         let intersections = new ShapeCollection();
         this.forEach(shape => {
            let curIntersections = shape._intersections(others); // can be one shape of a ShapeCollection
            if (curIntersections)
            {
               intersections.add(curIntersections); // ShapeCollections will be flattened
            }
         })

         return intersections;
      }

      /** Create intersecting Shapes between Shapes in this collection and other Shape or Collection */
      @addResultShapesToScene
      @checkInput('PointLikeOrAnyShapeOrCollection', 'auto')
      intersections(others:PointLikeOrAnyShapeOrCollection):ShapeCollection
      {
         return this._intersections(others)
      }

      /** Get Shapes that intersect with given Shape(s) */
      @checkInput('PointLikeOrAnyShapeOrCollection', 'auto')
      intersecting(other:PointLikeOrAnyShapeOrCollection):ShapeCollection
      {
         let otherShapeOrCollection = isPointLike(other) ? new Point(other)._toVertex() : other; // convert PointLike to Vertex so it is a Shape
         
         let intersectors = new ShapeCollection();
         this.shapes.forEach( shape => 
         {
            if (otherShapeOrCollection._intersections(shape) != null)
            {
               intersectors.add(shape)
            }
         })

         return intersectors;
      }

      /** Alias for intersecting */
      @checkInput('PointLikeOrAnyShapeOrCollection', 'auto')
      intersectors(other:PointLikeOrAnyShapeOrCollection):ShapeCollection
      {
         return this.intersecting(other);
      }

      /** Shape API */
      @checkInput('PointLikeOrAnyShapeOrCollection', 'auto')
      contains(other:PointLikeOrAnyShapeOrCollection):boolean
      {
         return (this.find(shape => shape.contains(other)) != null);
      }

      /** Find Shapes within ShapeCollection that entirely contain given other Shape */
      @checkInput('PointLikeOrAnyShapeOrCollection', 'auto')
      containers(other:PointLikeOrAnyShapeOrCollection):ShapeCollection|AnyShape
      {
         return this.filter(shape => shape.contains(other));
      }

      /** Return nearest Shape within this Collection to other given Shape(s) */
      // TODO: write test
      @checkInput('PointLikeOrAnyShapeOrCollection', 'auto')
      nearest(other:PointLikeOrAnyShapeOrCollection):AnyShape
      {  
         const otherShapes = new ShapeCollection();  
         // convert PointLikes to Vertex
         if (isPointLike(other))
         {
            otherShapes.add(new Point(other as PointLike)._toVertex())
         }
         else {
            otherShapes.add(new ShapeCollection(other));
         }
         
         let nearestShape:AnyShape = null;
         let nearestDistance:number = null;

         this.forEach( colShape => {
            otherShapes.forEach( otherShape => {
               if(!nearestDistance || colShape.distance(otherShape) < nearestDistance)
               {
                  nearestShape = colShape;
                  nearestDistance = colShape.distance(otherShape);
               }
            })
         })

         return nearestShape;
      }
      
      /** Shape API */
      _intersectionsWithEdge()
      {
         // TODO
         return null;
      }

      /** Shape API */
      vertices():ShapeCollection
      {
         let allVerts = new ShapeCollection();
         this.shapes.forEach( s => { allVerts = allVerts.concat(s.vertices()) });
         return allVerts;
      }

      /** Shape API */
      edges():ShapeCollection
      {
         let allEdges = new ShapeCollection();
         this.shapes.forEach( s => { allEdges = allEdges.concat(s.edges()) });
         return allEdges;
      }

      /** Shape API */
      wires():ShapeCollection
      {
         let allWires = new ShapeCollection();
         this.shapes.forEach( s => { allWires.concat(s.wires()) });
         return allWires;
      }

      /** Shape API */
      faces():ShapeCollection
      {
         let allFaces = new ShapeCollection();
         this.shapes.forEach( s => { allFaces.concat(s.faces()) });
         return allFaces;
      }
      
      /** Shape API */
      shells():ShapeCollection
      {
         let allShells = new ShapeCollection();
         this.shapes.forEach( s => { allShells.concat(s.shells()) });
         return allShells;
      }

      /** Shape API */
      solids():ShapeCollection
      {
         let allSolids = new ShapeCollection();
         this.shapes.forEach( s => { allSolids.concat(s.solids()) });
         return allSolids;
      }

      /** Return new ShapeCollection with only the visible Shapes */
      visible():ShapeCollection|AnyShape
      {
         return this.filter(s => s.visible());
      }

      /** Shape API */
      select(selectString:string=null):ShapeCollection
      {
         let selectedShapes = new ShapeCollection();
         this.all().forEach( shape => selectedShapes.concat(new ShapeCollection(shape.select(selectString))))
         return selectedShapes.distinct();
      }

      /**  Array API - Add Shape to ShapeCollection*/
      @checkInput('AnyShape', 'auto')
      push(shape:AnyShape):ShapeCollection
      {
         this.shapes.push(shape);
         return this;
      }

      /**  Array API - Pop last Shape from ShapeCollection*/
      pop():ShapeCollection
      {
         this.shapes.pop();
         return this;
      }

      /** Reverse order of the Shapes */
      reverse()
      {
         this.shapes.reverse();
         return this;
      }
      
      /** Shape API */
      removeFromScene()
      {
         this.shapes.forEach( shape => {
            shape.removeFromScene();
         })
      }

      /** Shape API */
      replaceShape(newShapes:Shape|ShapeCollection)
      {
         this.shapes.forEach( shape => {
            shape.replaceShape(newShapes);
         })
      }

      /** Shape API: Project 3D Shapes on XY plane */
      @checkInput([['PointLike',[0,1,0]], ['Boolean', false]],['Vector', 'auto'])
      _project(planeNormal?:PointLike, all?:boolean):ShapeCollection
      {
         const visibleShapes = new ShapeCollection(this.filter( shape => shape.visible() === true)); // filter can return single Shape
         const ocCompoundShape = visibleShapes.toOcCompound(); // combine all Shapes in ShapeCollection as CompoundShape
         // We are hacking the Shape class a bit here to be able to use Shape._project on CompoundShape
         const tmpShape = new Shape();
         tmpShape._ocShape = ocCompoundShape; 
         return tmpShape._project(planeNormal,all);
      }

      /** Shape API: Public Project 3D Shapes on XY plane and add result to Scene */
      @addResultShapesToScene
      @checkInput([['PointLike',[0,1,0]], ['Boolean', false]],['Vector', 'auto'])
      project(planeNormal?:PointLike, all?:boolean):ShapeCollection
      {
          return this._project(planeNormal, all);
      }

      /** Shape API: Generate elevation from a given side without adding to Scene */
      @checkInput([['Side', 'top'], ['Boolean', false]], ['auto', 'auto'])
      _elevation(side?:Side, all?:boolean):ShapeCollection
      {
         const visibleShapes = new ShapeCollection(this.filter( shape => shape.visible() === true)); // filter can return single Shape
         const ocCompoundShape = visibleShapes.toOcCompound(); // combine all Shapes in ShapeCollection as CompoundShape
         // Again: We are hacking the Shape class a bit here
         const tmpShape = new Shape();
         tmpShape._ocShape = ocCompoundShape; 
         
         return tmpShape._elevation(side, all);
      }
      
      /** Shape API: Generate elevation from a given side and add to Scene */
      @addResultShapesToScene
      @checkInput([['Side', 'top'], ['Boolean', false]], ['auto', 'auto'])
      elevation(side?:Side, all?:boolean):ShapeCollection
      {
         return this._elevation(side, all);
      }

      /** Shape API: Generate isometric view from Side or corner of ViewCube ('frontlefttop') or PointLike coordinate
       *      Does not add to Scene
       *      Use showHidden=true to output with hidden lines
       */
      _isometry(viewpoint:string|PointLike, showHidden:boolean=false):ShapeCollection
      {
         const visibleShapes = new ShapeCollection(this.filter( shape => shape.visible() === true));
         const ocCompoundShape = visibleShapes.toOcCompound(); // combine all Shapes in ShapeCollection as CompoundShape
         // Again: We are hacking the Shape class a bit here
         const tmpShape = new Shape();
         tmpShape._ocShape = ocCompoundShape; 
         return tmpShape._isometry(viewpoint, showHidden);
      }

      /** Shape API: Generate isometric view from Side or corner of ViewCube ('frontlefttop') or PointLike coordinate
       *     Add to scene
      *      Use showHidden=true to output with hidden lines
      */
      @addResultShapesToScene
      isometry(viewpoint:string|PointLike, showHidden:boolean=false):ShapeCollection
      {
         return this._isometry(viewpoint, showHidden)
      }

      iso(viewpoint:string|PointLike, showHidden:boolean=false):ShapeCollection
      {
         return this.isometry(viewpoint, showHidden)
      }

      //// ARRAY LIKE API ////

      /** Array API - Alias for ForEach to have compatitibility with Array */
      forEach(func: (value: any, index: number, arr:Array<any>) => void ): ShapeCollection
      {
         this.shapes.forEach(func);
         return this;
      }
      
      /** Array API - Alias for sort to have compatitibility with Array */
      sort(func: (a: any, b: any) => number ):ShapeCollection
      {
         this.shapes.sort(func); // in place changing
         this._setFakeArrayKeys(); // IMPORTANT: otherwise indices are out of sync
         return this;
      }

      /** Array API - Alias for find to have compatitibility with Array */
      find(func: (value: any, index: number, arr:Array<any>) => any ): any
      {
         return this.shapes.find(func);
      }

      /** Array API - Filter Shapes in this Collection and return a new ShapeCollection or single Shape
       */
      filter(func: (value: any, index: number, arr:Array<any>) => boolean ):ShapeCollection
      {
         return new ShapeCollection(this.shapes.filter(func))
      }

      reduce(func: (prevValue: number, curValue:AnyShape, index:number, arr:Array<AnyShape>) => number, startSum:number):number
      {
         return this.shapes.reduce(func, startSum);
      }

      /** Get Shapes at index. NOTE: We can also use the fake index keys like collection[0] */
      @checkInput(Number.isInteger, 'auto')
      at(index:number)
      {
         return this.shapes[index];
      }

      /** Exclude given Shape from current collection */
      not(shape:AnyShape):ShapeCollection
      {
         return new ShapeCollection(this.filter(s => !s.same(shape)))
      }

      /** Check if ShapeCollection is empty */
      isEmpty():boolean
      {
         return this.length === 0;
      }

      /** Alias for length */
      count():number
      {
         return this?.shapes?.length || 0;
      }

      // TODO
      specific()
      {
         /* To match API of Shape */
         return this.collapse();
      }

      //// SHAPE COMBINATION ALGORITHMS ////

      /** Try to calculate the bounding Wire 
       *   Work in progress
       *    See original code: https://github.com/Open-Cascade-SAS/OCCT/blob/ae1683705ef5c9a7e767c5c873e7d725b04d262f/src/ShapeAnalysis/ShapeAnalysis_FreeBounds.cxx#L89
      */
      boundary():Wire
      {
         /*
         console.log('=========== BOUNDARY ===========');
         console.log(this._oc.TopTools_HSequenceOfShape);
         console.log(this._oc.TopTools);
         console.log(this._oc.TopTools.HSequenceOfShape);
         console.log(this._oc.Handle_TopTools_HSequenceOfShape);
         console.log(new this._oc.TopTools().TopTools_HSequenceOfShape);
         */

         const ocShapeSequence = new this._oc.Handle_TopTools_HSequenceOfShape_1();
         const ocEdges = new this._oc.Handle_TopTools_HSequenceOfShape_1();
         this.edges().forEach( e => ocEdges.Append_1(e._ocShape));

         this._oc.ShapeAnalysis_FreeBounds.ConnectEdgesToWires(
                  ocEdges, 
                  0.1, 
                  false,
                  ocShapeSequence);

         return null;
      }

      //// NAVIGATING SHAPES ////

      /** Get Shapes of given type in ShapeCollection */
      @checkInput('ShapeType', 'auto')
      getShapesByType(type:ShapeType):ShapeCollection
      {
        let shapes = this.shapes.filter( s => s.type() == type );
        return new ShapeCollection(shapes); // always return ShapeCollection. Can be empty
        // TODO: make specific ShapeCollection: like VertexCollection?
      }

      @checkInput('ShapeTypes', Array)
      getShapesByTypes(types:Array<ShapeType>):ShapeCollection
      {
        let shapes = this.shapes.filter( s => types.includes(s.type()));
        return new ShapeCollection(shapes); // always return ShapeCollection. Can be empty
        // TODO: make specific ShapeCollection: like VertexCollection?
      }

      /** Shape API - Get all subshapes of type from Shapes in Collection */
      @checkInput('ShapeType', 'auto') 
      getSubShapes(type:ShapeType):ShapeCollection
      {
         const TYPE_TO_FUNC = { 'Vertex' : 'vertices', 'Edge' : 'edges', 'Wire' : 'wires', 'Face' : 'faces', 'Shell' : 'shells', 'Solid' : 'solids' }
         return this[TYPE_TO_FUNC[type]]();
      }

      /** Get first Shape of Collection */
      first():AnyShape
      {
         return this.shapes[0];
      }

      /** Get last Shape of Collection */
      last():AnyShape
      {
         return this.shapes[this.shapes.length - 1];
      }

      /** Get all direct children Shapes in this Collection */
      children():Array<AnyShape>
      {
         return this.shapes;
      }

      /** Alias: remove this eventually! */
      all():Array<AnyShape>
      {
         return this.children();
      }

      /** get lowest Shape type */
      lowestType():ShapeType
      {
         const TYPES_ORDERED = ['Solid', 'Shell', 'Face', 'Wire', 'Edge', 'Vertex'];

         let lowestType = null;
         let lowestTypeIndex = -1;
         this.shapes.forEach(s => {
            let i = TYPES_ORDERED.indexOf(s.type());
            if (i > lowestTypeIndex){
               lowestTypeIndex = i;
               lowestType = s.type();
            }
         });

         return lowestType;
      }

      /** check if this Collection has a specific instance of a Geometry */
      @checkInput('AnyShapeOrCollection', 'auto')
      has(s:AnyShapeOrCollection):boolean
      {
         if (Shape.isShape(s))
         {
            // NOTE: we can compare instances of AY Shapes or really underlying OC Shapes
            // return this.shapes.includes(s as AnyShape);
            return (this.shapes.find(shape => shape.same(s as Shape)) != null)
         }
         else {
            // is ShapeCollection
            let collectionShapes = (s as ShapeCollection).all();
            for (let i = 0; i < collectionShapes.length; i++)
            {
               let collShape = collectionShapes[i];
               if (this.shapes.find(shape => shape.same(s as Shape)) != null)
               {
                  return true;
               }
            }
            return false;
         }
      }

      /** Array API */
      includes(s:AnyShapeOrCollection):boolean
      {
         return this.has(s);
      }

      /** Check if this Collection has a Shape of a given type */
      @checkInput('ShapeType', 'auto')
      hasType(type:ShapeType):boolean
      {
         return this.getShapesByType(type).length > 0; 
      }

      /** Array API - Get index of given Shape, if not exists -1 */
      @checkInput('AnyShape', 'auto')
      indexOf(s:Shape):number
      {
         return this.shapes.indexOf(s);
      }

      /** Array API - */
      @checkInput([Number.isInteger, Number.isInteger], [Number, Number])
      slice(start:number,end:number):ShapeCollection
      {
         return new ShapeCollection(this.shapes.slice(start,end));
      }

      /** Get the Shapes in current collection that are also in the other one with the same Geometry */
      @checkInput('AnyShapeOrCollection', 'auto')
      getEquals(others:AnyShapeOrCollection):ShapeCollection
      {  
         let equals = [];

         let othersCollection = (isAnyShape(others)) ? new ShapeCollection(others as Shape) :  others as ShapeCollection;

         this.shapes.forEach( curShape => 
         {
            let equalShape = othersCollection.shapes.find(otherShape => curShape.equals(otherShape as any)); // HACK: use any here to avoid TS errors for now
            if (equalShape){
                  equals.push(curShape)
            }
         });

         return new ShapeCollection(equals);
      }

      /** Get the Shapes that the same, but might be translated 
       *    NOTE: this might not be enough to establish 
       * 
      */
      @checkInput('AnyShapeOrCollection', 'auto')
      getEqualsTranslated(others:AnyShapeOrCollection):ShapeCollection
      {
         let equals = [];

         let othersCollection = (isAnyShape(others)) ? new ShapeCollection(others as Shape) :  others as ShapeCollection;

         this.shapes.forEach( curShape => 
         {
            let equalShape = othersCollection.shapes.find(otherShape => curShape._copy().moveTo(0,0,0).equals(otherShape._copy().moveTo(0,0,0) as any));
            if (equalShape)
            {
                  equals.push(curShape)
            }
         });

         return new ShapeCollection(equals);
      }
      
      /** Combine two ShapeCollections and also try to upgrade Shapes that might be combined into higher order Shapes */
      // TODO: performance looks very slow. Can we improve this?
      @checkInput('AnyShapeCollection', 'auto')
      combine(other:ShapeCollection):ShapeCollection
      {
         if(!(other instanceof ShapeCollection))
         {
            console.error(`ShapeCollection::combine: Please supply other ShapeCollection to combine!`);
            return null;
         }
         else {
            this.concat(other);
            this.upgrade();

            return this;
         }
      }
      
      @checkInput('AnyShapeCollection', 'auto')
      combined(other:ShapeCollection):ShapeCollection
      {
         return this.copy().combine(other);
      }

      /** Try to combine collection of shapes into a higher order ShapeCollection */
      // TODO: What to do with the old Shapes when this collection is updated?
      upgrade():ShapeCollection
      {
         this._connectLinearShapes();
         // TODO: Combine Wires into Faces
         // TODO: Combine Faces into Shells
         // TODO: Combine Shells into Solids

         return this;
      }

      /** Try to combine collection of shapes into a higher order ShapeCollection */
      upgraded():ShapeCollection
      {
         let newCollection = this.upgrade().copy();
         
         return newCollection
      }

      /** Try to combine into higher order Shape of same type of Shapes in Collection */
      upgradeShapesByType():this
      {
         const UPGRADE_SHAPE_TYPES = ['Face','Shell'] as Array<ShapeType>; // TODO: more

         UPGRADE_SHAPE_TYPES.forEach( (curType,i) => {
            const groupedByType = this.getShapesByType(curType);
            if(groupedByType.length)
            {
               // We try to be smart by first grouping Shapes if they touch or not, then try to combine them
               const groupedByTouching = groupedByType.groupTouching();
               groupedByTouching.forEachGroup((name,grouped) => {
                  if(grouped.length > 1)
                  {
                     // Try to combine into higher order Shape
                     let combinedShape;

                     switch(curType)
                     {
                        case 'Face':
                           combinedShape = new Shell().fromFaces(grouped);
                           break;
                        case 'Shell': 
                           combinedShape = new Solid().fromShells(grouped);
                           break;
                        default:
                           console.warn(`ShapeCollection: upgradeShapesByType(): Unknown current type "${curType}". Please check code.`)
                     }

                     // Test result
                     const curUpgradeType = (i < UPGRADE_SHAPE_TYPES.length - 1) ? UPGRADE_SHAPE_TYPES[i+1] : 'Solid';
                     if(combinedShape?.type() === curUpgradeType)
                     {
                        // Remove old ones from Collection and add new upgraded
                        this.remove(grouped);
                        this.add(combinedShape);

                        console.info(`ShapeCollection: upgradeShapesByType(): Combined ${grouped.length} Shapes of type ${curType} into higher order Shape of type ${curUpgradeType}"`);
                     }
                  }
               })

            }
         }) 

         return this;
      }

      /** Combine touching Shapes into groups with names like touching{{n=0,1,2}} */
      groupTouching():this
      {
         const touchGroups = [] as Array<ShapeCollection>;
         const shapeTolerance = this._oc.SHAPE_TOLERANCE;

         this.shapes.forEach((curShape,i) => {
            if(i === 0)
            {
               touchGroups.push(new ShapeCollection(curShape));
            }
            else {
               // see if curShape touches any shape in the touchGroups
               let putInGroup = false;
               touchGroups.every( groupColl => 
               {
                  groupColl.forEach( groupShape => 
                  {
                     if(!putInGroup && groupShape.distance(curShape) <= shapeTolerance)
                     {
                        groupColl.add(curShape)
                        putInGroup = true;
                     }
                  })
               })
   
               // cur Shape not in any touching group
               if(!putInGroup)
                  {
                     // Add group 
                     touchGroups.push(new ShapeCollection(curShape))
               }
            }
         })
         
         // Make groups
         touchGroups.forEach( (groupColl,i) => this._defineGroup(`touching${i}`, groupColl))

         return this;
      }

      /** Check downgrade */
      checkDowngrade():ShapeCollection
      {
         this.shapes = this.map( shape => shape.checkDowngrade() ).toArray();

         return this;
      }

      /** Force unique Geometry based on the isEqual method ( not hash ) */
      unique():ShapeCollection 
      {
         // first use distinct to filter out Shapes with same hash
         let shapes:Array<AnyShape> = this.distinct().toArray();
         let usedShapes:Array<AnyShape> = []; // list of shapes already matched
         let uniqueShapes:Array<AnyShape> = []; 

         // TODO: ShapeCollection containing ShapeCollection?
         shapes.forEach( curShape => 
         {
            if (!usedShapes.includes(curShape))
            {
               uniqueShapes.push(curShape);
               let equalShapes = shapes.filter( testShape => curShape.equals(testShape as any) ); // HACK: avoid weird TS error for now
               usedShapes.concat(equalShapes.concat([curShape as Shape])); // remove equals shapes from consideration
            }
         })

         return new ShapeCollection(uniqueShapes);
      }

      /** Remove doubles based on OC hash */
      distinct():ShapeCollection
      {
         let distinctShapesByHash = {};

         this.forEach( shape => 
         {
            let hash = shape._hashcode();
            if (!distinctShapesByHash[hash])
            {
               distinctShapesByHash[hash] = shape;
            }
         })

         this.shapes = Object.values(distinctShapesByHash);
         this._setFakeArrayKeys();

         return this;
      }

      /** Try to sew Shapes (like Edges, Wires, Faces, Shells) together to create a Face, Shell, Solid or Compound  */
      _sewed():AnyShapeOrCollection
      {
         // !!!! ShapeUpgrade_UnifySameDomain 
         /* ocDocs:
               - BRepBuilder_Sewing: https://dev.opencascade.org/doc/occt-7.4.0/refman/html/class_b_rep_builder_a_p_i___sewing.html
               - general: https://dev.opencascade.org/doc/overview/html/occt_user_guides__modeling_algos.html#occt_modalg_8
               - ProcessIndicator: https://dev.opencascade.org/doc/occt-7.4.0/refman/html/class_message___progress_indicator.html
               - C++ code: https://github.com/i2e-haw-hamburg/opencascade/blob/master/src/BRepBuilderAPI/BRepBuilderAPI_Sewing.cxx
         */
         let ocSew = new this._oc.BRepBuilderAPI_Sewing(1e-6, true, true, true, false);
         this.shapes.forEach( curShape => ocSew.Add(curShape._ocShape));

         ocSew.Perform( new this._oc.Message_ProgressRange_1());
         let ocSewedShapeOrCompound = ocSew.SewedShape();
         if (!ocSewedShapeOrCompound.IsNull())
         {
            // We can have single Shape or a Compound
            let newOcType = new Shape()._getShapeTypeFromOcShape(ocSewedShapeOrCompound);
            if (newOcType != 'Compound')
            {
               // sewing created one new Shape of one type
               console.info(`ShapeCollection:: sewed: Sewing was succesfull and created one Shape of type '${newOcType}'!`); // TODO: geom
               let sewedShape = new Shape()._fromOcShape(ocSewedShapeOrCompound);
               return sewedShape as AnyShape;
            }
            else {
               // we got a Compound Shape: make a ShapeCollection out of it!
               let newShapeCollection = new Shape()._extractShapesFromOcCompound(ocSewedShapeOrCompound);
               console.info(`ShapeCollection:: sewed: Sewing resulting in more than one Shape. Returned a collection`); // TODO: geom
               return newShapeCollection as ShapeCollection;
            }
         }

         // unchanged Shape or ShapeCollection
         return this;

      }

     /** Combining Linear Shapes (Edges and Wires) into Wires connected by Vertices
     *    For Edges that overlap this does not work ( union could work: TODO )
     *    All other Shapes except Edges are kept in the collection
     *    TODO: Use OC native methods here!
     */
      _connectLinearShapes()
     {
         const edges = this.getShapesByType('Edge'); 
         const wires = this.getShapesByType('Wire')
         const wireEdges = new ShapeCollection();
         wires.forEach( w => 
            {
               wireEdges.concat(w.edges());
            }
         ) 

         let allEdges = edges.concat(wireEdges);

         if (allEdges.length <= 1)
         {
            // no or only one Edge(s) to combine
            console.warn(`ShapeCollection::_connectLinearShape: No linear (Edges,Wires) Shapes to combine! Returned original`);
            return this;
         }

         this.remove(edges);
         this.remove(wires);

         let groupedEdges:Array<Array<Edge>> = new Wire()._groupEdges(edges);
         // add Wires and remaining Edges back to Collection
         groupedEdges.forEach( edgeGroup => 
         {
            if(edgeGroup.length == 1)
            {
               this.add(edgeGroup); // single Edge Wire revert back to Edge
            }
            else {
               // make a Wire from the Edges
               this.add( new Wire().fromEdges(edgeGroup) ); // just add the newly combined Wire
            }
         });

         console.info(`ShapeCollection::_connectLinearShapes: Created ${this.getShapesByType('Wire').length} Wire(s). Remaining ${this.getShapesByType('Edge').length} Edges`);
         
         return this;
      }

      /** Removing Shapes that are contained by others in the Collection  */
      _removeContained():ShapeCollection
      {
         let notContainedShapes = [];
         for(let p = 0; p < this.shapes.length; p++)
         {
            let curShape = this.shapes[p];
            let isContained = false;
            for (let s = 0; s < this.shapes.length; s++)
            {
               let otherShape = this.shapes[s];
               if (curShape != otherShape)
               {
                  if(otherShape.contains(curShape))
                  {
                     isContained = true;
                     break;
                  }
               }
            }
            if (!isContained)
            {
               notContainedShapes.push(curShape);
            }
         }

         // remove Shapes
         this.shapes = notContainedShapes;
         this._setFakeArrayKeys();
         
         return this;
      }

      /** The same as _removeContained but returns a new Collection */ 
      _removedContained()
      { 
         let newColl = this.copy();
         newColl._removeContained();
         return newColl;
      }

      /** Test if the collections are the same */
      @checkInput('AnyShapeOrCollection', 'auto')
      equals(other:AnyShapeOrCollection):boolean
      {
         if(!ShapeCollection.isShapeCollection(other))
         {
            console.warn(`ShapeCollection::equals(): Other operant is a Shape. Returned false`)
            return false;
         }

         if (this.count() != other.count())
         {
            return false;
         }
         else 
         {
            return this.every( shape => {
               return new ShapeCollection(other).find(otherShape => otherShape.equals(shape))
            })
         }
      }

      /** Check null or single, and return single value if the case  */
      checkSingle():AnyShape|ShapeCollection
      {
         if(this.shapes.length === 0)
         {
            return null;
         }
         else if (this.shapes.length == 1)
         {
            return this.shapes[0] as AnyShape;
         }
         else {
            return this; 
         }
      }

      /** Collapse ShapeCollection into one Shape if there is only one */
      collapse():AnyShape|ShapeCollection
      {
         if(this.shapes.length == 0)
         {
            return null;
         }
         else {
            return this.checkSingle();
         }
      }

      toArray(): Array<AnyShape>
      {
         return this.shapes;
      }

      //// BOOLEAN OPERATIONS (compatible with Shape API) ////

      /* Private Subtract without adding to scene */
      @checkInput('AnyShapeOrCollection', 'auto')
      _subtracted(other:AnyShapeOrCollection):ShapeCollection
      {
         const newShapes = new ShapeCollection();
         /* When other is ShapeCollection we need to keep track of what Shapes 
            were subtracted by any operant Shape : These will not be part resulting collection
         */
         const subtractedShapes = new ShapeCollection();  
         this.shapes.forEach( shape =>
            {
               if (isAnyShape(other))
               {
                  newShapes.add(shape._subtracted(other));
               }
               else if (ShapeCollection.isShapeCollection(other)) { // iterate Shape collection
                  other.forEach(otherShape =>
                  {
                     if(Shape.isShape(otherShape))
                     {
                        const subtractedShape = shape._subtracted(otherShape);

                        if(!subtractedShape)
                        {
                           // No resulting Shape, just skip
                        }
                        // There was an alteration to a Shape in Collection - either generating a ShapeCollection or a other Shape
                        else if(ShapeCollection.isShapeCollection(subtractedShape) || !shape.equals(subtractedShape as Shape)) // second term will not be evaluated when ShapeCollection
                        {
                           newShapes.add(subtractedShape);
                           subtractedShapes.add(shape); // keep track of it, to exclude it from the results
                        }
                        else {
                           // add original shape (to keep data like names)
                           newShapes.add(shape);
                        }
                     }
                  })
               }
            })

         return new ShapeCollection(newShapes.filter(s => !subtractedShapes.includes(s)));
      }

      /** Subtract Shape or ShapeCollection from current ShapeCollection and return new ShapeCollection */
      @addResultShapesToScene
      @checkInput('AnyShapeOrCollection', 'auto')
      subtracted(other:AnyShapeOrCollection):ShapeCollection
      {
        return this._subtracted(other);
      }

      @checkInput('AnyShapeOrCollection', 'auto')
      subtract(other:AnyShapeOrCollection):ShapeCollection
      {
         this.shapes = this._subtracted(other).toArray();
         return this;
      }

      /** Shape API - Try to union all shapes in Collection (without adding to Scene) */
      @checkInput([['AnyShapeOrCollection',null ],[Boolean, false]], ['auto', 'auto'])
      _unioned(other?:AnyShapeOrCollection, noRecurse?:boolean):ShapeCollection|AnyShape
      {
         // just add the other to collection, and then union
         if(other)
         {
            this.add(other);
         }

         let results = new ShapeCollection();

         this.forEach( (curShape,i) => 
         {
            if (i === 0)
            {
               results.add(curShape);
            }
            else
            {
               // Check if any previous union results can be unioned with curShape
               let didUnion = false;
               results.toArray().every( resultShape => {
                  const unionResult = resultShape._unioned(curShape);
                  if(unionResult)
                  {
                     // there was a union, keep track of mutations
                     results.remove(resultShape); // remove old shape
                     results.add(unionResult) // add new unioned Shape/ShapeCollection
                     didUnion = true;
                     return false; // break loop
                  }
                  return true;
               }) 

               // Shape was not unioned, add to results as is
               if(!didUnion)
               {
                  results.add(curShape._copy());
               }
            }
         })

         // We recurse one level by trying again to union the results
         if(!noRecurse && results.length > 1)
         {
            // To increase chances of succesful union order by volume
            // TODO: introduce a smarter approach
            results.sort((a,b) => b.volume() - a.volume())
            results = new ShapeCollection(results._unioned(null, true));
         }

         return results.checkSingle();
      }

      /** Shape API - Try to union all shapes in Collection and add to Scene */
      @addResultShapesToScene
      @checkInput([['AnyShapeOrCollection',null ]], 'auto')
      unioned(other?:AnyShapeOrCollection):ShapeCollection|AnyShape
      {
         return this._unioned(other);
      }

      /** Shape API - Try to union all shapes in Collection */
      @addResultShapesToScene
      union():this
      {
         const unionedCollection = new ShapeCollection(this._unioned());
         this.removeFromScene(); // Remove current Shapes
         this.empty();
         this.add(unionedCollection); // Add Shapes to current collection

         return this;
      }
      

      //// STYLING AND VISIBILITY WITH Obj API ////

      /**  Shape API - Add all shapes in the collection to the Scene */
      addToScene():ShapeCollection
      {
         // Keep Shapes in Collection together within layer
         this._geom.layer( this._geom.getNextLayerName(this.getName()));
         this.all().forEach(shape => shape.addToScene());
         this._geom.resetLayers(); // return active layer to scene
         return this;
      }

      color(color:any):this
      {
         this.forEach( shape => shape.color(color));

         return this;
      }

      /** Make all Shapes in this ShapeCollection dashed lines */
      dashed():this
      {
         this.forEach( shape => shape.dashed());
         return this;
      }
      
      /** Shape API - Style all Shapes in Collection */
      @checkInput('ObjStyle', 'auto')
      style(newStyle:ObjStyle):ShapeCollection
      {
         this.forEach( shape => shape.style(newStyle));
         return this;
      }

      /** Return this Shape wrapped with a Obj instance for adding it to the scene */
      object():Obj
      {
         // wrap in Obj and return
         let obj = new Obj(this);
         this._obj = obj;
         return this._obj;
      }

      /** Check if there is an Obj container tied to current ShapeCollection
       *    If so: return it, otherwise make one and return that
       */
      checkObj():Obj
      {
          if(!this._obj)
          {
              this.object();
          }
          return this._obj;
      }

      /** NOTE: We don't use set/get here, because it doesnt play well with chaining */
      name(n?:string):this|string
      {
         return (n) ? this.setName(n) : this.getName();
      }

      /** Set name */
      setName(newName:string):this
      {
         this.checkObj().name(newName);
         return this;
      }

      /** Get name of container Obj */
      getName():string|undefined
      {
         const r = this?._obj?.name();
         return (typeof r === 'string') ? r : 'UnnamedShapeCollection'; // TODO: we better return undefined if not there, but we have some algoritms depending on this
      }

      /** Shape API - hide all Shapes in Collection */
      hide():ShapeCollection
      {
         this.forEach( shape => shape.hide());

         return this;
      }

      // TODO: .color, .

      //// LAYOUTING ALGORITHMS ////

      /** Layout Shapes on XY plane within a given Layout order */
      @checkInput([ ['String','binpack'], ['Boolean', true], ['LayoutOptions', null]], ['String','auto','auto'])
      layout(order:LayoutOrderType, copy:boolean, options:LayoutOptions):ShapeCollection
      {
         let lastItemPosition:Point = new Point(0,0,0);
         let layoutCollection = new ShapeCollection();

         this.forEach( (shape,index) => 
         {
            let workShape = (copy) ? shape._copy() : shape;
            // autoRotate (default)
            workShape = (options?.autoRotate == undefined || options?.autoRotate) ? workShape.rotateToLayFlat() : workShape;
            // flatten if given as option
            workShape = (options?.flatten) ? workShape._flattened() : workShape;

            switch (order)
            {
               case 'line':
                  lastItemPosition = this._placeLine(workShape, lastItemPosition, options?.margin, index);
                  break
               case 'binpack':
                     // do when ShapeCollection is done: see underneath
                     break;
               default:
                  throw new Error(`layout:: Unknown layout order "${order}". Please use: 'line','grid','binpack' or 'nest'`)
            }
            
            workShape.addToScene();
            layoutCollection.add(workShape);
         })

         // actions after ShapeCollection is made
         switch(order)
         {
            case 'line':
               // nothing
               break;
            case 'binpack':
               layoutCollection = layoutCollection.pack(options); // add bin Shapes to layouted collection
               break;
         }

         return layoutCollection;
      }


      _placeLine(shape:AnyShape, prevPosition:Point, margin:number=10, index:number):Point // returns last position
      {
         let workShapeBbox = shape.bbox();
         let offset = prevPosition.moved(workShapeBbox.width()/2);
         shape.moveTo(offset.x, offset.y, shape.center().z);
         
         return prevPosition.moved(workShapeBbox.width() + margin)
      }

      pack(options:LayoutOptions, copy:boolean=true):ShapeCollection
      {
         const DEFAULT_BIN_WIDTH = 1000; // NOTE: still in local model-units (can be anything basically)
         const DEFAULT_BIN_HEIGHT = 1000;
         const DEFAULT_AUTOROTATE = false;
         const DEFAULT_FLATTEN = false;
         const BOX_MARGIN_DEFAULT = 5;
         const BIN_MARGIN = 100; 
         
         const position = new Vertex(0,0,0);
         const binWidth = options?.stockWidth || DEFAULT_BIN_WIDTH;
         const binHeight = options?.stockHeight || DEFAULT_BIN_HEIGHT;

         const autoRotate = options?.autoRotate ?? DEFAULT_AUTOROTATE;
         const flatten = options?.flatten ?? DEFAULT_FLATTEN;
         if(autoRotate || flatten){ copy = true };

         const boxMargin = (options?.margin !== undefined) ? options.margin : BOX_MARGIN_DEFAULT;
         const boxes = this.toArray().map( (shape,i) => 
         {
            let s = (autoRotate) ? shape._copy().rotateToLayFlat() : shape;
            s = (flatten) ? s._flattened() : s;
            return this._makeBinPackBox(s, boxMargin, i)
         });


         // place boxes with skewest width-height ratio first
         boxes.sort((a,b) => this._calculateSizeSkewness(b) - this._calculateSizeSkewness(a)); // order boxes from big to small for better fitting
         
         const packResult = packer(
            { 
               binHeight: binHeight,
               binWidth: binWidth,
               items: boxes,
            },
            { 
               kerfSize: boxMargin, 
               allowRotation: true 
            }
         ); // returns Array<Array<PackerResultItem>>

         // now align shapes to all bins
         let numPackedBins = packResult.length;
         let toShapeCollection = (!copy) ? this : new ShapeCollection();

         packResult.every((bin,binIndex) => 
         {  
            // start placing Shapes according to resultItem
            (bin as Array<PackerResultItem>).forEach(resultItem => 
            {
               // NOTE: resultItems xy are left top
               const box = resultItem as PackerResultItem;
               let boxCenter = [box.x + box.width/2 + (binIndex*(binWidth+BIN_MARGIN)+position.x), 
                                 box.y + box.height/2 + position.y];
               
               let workShape = this.at(box.item.shapeIndex);
               if(copy)
               { 
                  let newWorkShape = workShape._copy(); // IMPORTANT: don't add to scene - flattened leaves this copy around
                  newWorkShape = (autoRotate) ? newWorkShape.rotateToLayFlat() : newWorkShape;
                  newWorkShape = (flatten) ? newWorkShape._flattened() : newWorkShape;
                  
                  toShapeCollection.addGroup('cut', newWorkShape);
                  workShape = newWorkShape;
               } // copy shape or move in place
               // check if we need to rotate 90 degrees (NOTE: Shape bbox are original size while Box are with margin!)
               if((Math.round(workShape.bbox().width())) != Math.round(box.width))
               {
                  workShape.rotateZ(90);
               }
               
               workShape.moveTo(boxCenter);
               
            })
            return true; // continue every loop
            
         })

         // Add bins in seperate group
         const binShapes = new ShapeCollection();
         if(options?.drawStock === undefined || options.drawStock === true)
         {
            new Array(numPackedBins).fill(null).forEach( (n, bi) => 
            {
               let binStartX = bi*(binWidth+BIN_MARGIN)+position.x;
               let binStartY = position.y;
               let outline = new Face()
                              .makePlaneBetween([binStartX, binStartY],[binStartX+binWidth, binStartY+binHeight])
                              ._toWire();
               binShapes.add(outline);
            })
            
         }

         // return binpacked Shapes and optionally stock outlines in ShapeCollection
         return (binShapes) ? toShapeCollection.addGroup('bins', binShapes) : toShapeCollection;
      }

      _makeBinPackBox(shape:AnyShape, margin:number=10, index:number):any // TODO: typing
      {
         // IMPORTANT: The shape needs to be on XY plane!
         let workShapeBbox = shape.bbox() // DISABLED: .enlarged(margin) - use packer.kerfSize
         const box = { 
            name: shape.getName(), 
            width: workShapeBbox.width(), 
            height: workShapeBbox.depth(),
         } as PackerItem; 
         box.shapeIndex = index; // IMPORTANT: to keep track of box-Shape link
         return box;
      }

      _calculateSizeSkewness(box:any)
      {
         // higher is more skewness
         let whSkew = box.width/box.height;
         let hwSkew = box.height/box.width;
         return (whSkew > hwSkew) ? whSkew : hwSkew;
      }

      //// ANNOTATIONS ////

      /** Make (semi) automatic dimension lines through the Shapes of this collection at levels (in percentage of total size) along MainAxis within bbox
       *    @param options:AutoDimSettings
       *    {
       *       levels: Array< Record<MainAxis,number>
       *       minDistance: number (0-1)
       *    }
       * 
      */
      autoDim(settings?:AutoDimSettings):ShapeCollection
      {
         const BBOX_MARGIN = 10;
         const SECTION_PLANE_DEPTH = 2;
         const DIMENSION_LINE_OFFSET_FROM_BBOX = 30;
         const DEFAULT_MIN_DISTANCE = 0;

         if(!settings || !Array.isArray(settings?.levels)){ throw new Error('ShapeCollection.autoDim(options): No autoDim settings given. Please supply levels ({ axis:x|y|z, at:number }]). Level options are minDistance, coordType, and offset')}

         const collectionBbox = this.bbox();

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
            const intersections = this._intersections(sectionPlane);

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

                     // NOTE: for now we still need a dimension line to be attached to a Shape - TODO: better
                     const dimLine = new Edge().makeLine(dimLineStartPoint,dimLineEndPoint)
                                       .color('blue').hide()
                                       .dimension({  
                                          offset: dimLineOffset, 
                                          roundDecimals: 0,
                                       });

                     this.add(dimLine.shape);
                  }
               }
            })
         })

         return this;
      }


      //// OUTPUT DATA ////

      /** Shape API - Turn Edges (Line, Arc, Spline etc) into discreet (straight) edges for use in THREE JS
       *    Flattens all Shapes into one array of edges */
      toMeshShapes(quality?:MeshingQualitySettings):Array<MeshShape>
      {  
         let shapeMeshes:Array<MeshShape> = [];
         this.shapes.forEach( s => 
         {
            let meshShape = s.toMeshShape(quality);
            if (meshShape)
            {
               shapeMeshes.push(meshShape);
            }
         });

         console.info(`ShapeCollection:toMeshShapes: Output ${shapeMeshes.length} meshes of ${this.shapes.length} shapes!`);

         return shapeMeshes;
      }

      /** Output all Shapes in Collection to a single ShapeMeshBuffer */
      toMeshShapeBuffer(quality:MeshingQualitySettings):MeshShapeBuffer
      {         
         let meshShapes = this.toMeshShapes(quality);

         let numShapes = meshShapes.length;
         let numVertices = meshShapes.reduce( (acc,shapeMesh) => acc + shapeMesh.vertices.length, 0 );
         let numEdges = meshShapes.reduce( (acc,shapeMesh) => acc + shapeMesh.edges.length, 0 );
         let numFaces = meshShapes.reduce( (acc,shapeMesh) => acc + shapeMesh.faces.length, 0 );
         let numTriangles = meshShapes.reduce( (acc,shapeMesh) => acc + shapeMesh.faces.reduce( (sum, faceMesh) => sum + faceMesh.numTriangles, 0), 0 );

         let stats:MeshShapeBufferStats = { 
            numShapes: numShapes, 
            numVertices: numVertices,
            numEdges: numEdges,
            numFaces: numFaces,
            numTriangles: numTriangles
         }

         let meshShapeBuffer:MeshShapeBuffer = {
            verticesBuffer: [], // size of NumVertices*3
            verticesInfo: [], // info per Vertex
            edgesBuffer: [], // size of NumEdges*2*3
            lineEdgesInfo: [], // info per Edge
            trianglesVertices: [], // variable
            triangleIndices: [], // num triangles * 3
            trianglesVertexColors: [],
            triangleNormals: [],
            triangleUVs: [],
            trianglesInfo: [], // info per triangle
            stats: stats,
         }

         meshShapes.forEach( (curMeshShape, curMeshShapeIndex) =>
         {
            meshShapeBuffer.verticesBuffer = meshShapeBuffer.verticesBuffer.concat(
               curMeshShape.vertices.reduce( (sum, v) => sum.concat(v.vertices), []));
            
            // Per OC Edge we got sequential Vertices coords: either 6 coords for Line Edge, or a multiple of 3 coords
            // We need to output as coordinate pairs
            curMeshShape.edges.forEach( curShapeEdge => 
            {
               let lineSegmentsCoords = [];

               let numVertices = curShapeEdge.vertices.length/3;
               let coordBuffer = curShapeEdge.vertices;
               let prevVertexCoords = null;

               let lineSegmentIndexStart = meshShapeBuffer.edgesBuffer.length/6;
               let lineSegmentIndexEnd = lineSegmentIndexStart + numVertices-1;

               // Info per LineEdge
               let edgeInfo = { objId: curShapeEdge.objId, shapeId: curShapeEdge.ocId, subShapeType: 'Edge', indexInShape: curShapeEdge.indexInShape, 
                              color: chroma(curMeshShape?.style?.line?.color || '#333333').darken(0.5).num(), // darken lines a bit
                              edgeGroupLineSegmentsRange: [lineSegmentIndexStart,lineSegmentIndexEnd ] };

               // for the first line segment
               meshShapeBuffer.lineEdgesInfo.push(edgeInfo as any); // avoid TS warning

               for (let v = 0; v < numVertices; v++)
               {
                  // if more then 2 vertices: start pairing by adding previous coordBuffer first
                  if(v >= 2)
                  {
                     // add a edgeInfo object per line segment (2*3 coords)
                     meshShapeBuffer.lineEdgesInfo.push(edgeInfo as any); // avoid TS warning
                     lineSegmentsCoords = lineSegmentsCoords.concat(prevVertexCoords);
                  }
                  let vertexCoords = [coordBuffer[v*3],coordBuffer[v*3+1], coordBuffer[v*3+2]]; // [x,y,z]
                  lineSegmentsCoords = lineSegmentsCoords.concat(vertexCoords); // add vertex coords
                  prevVertexCoords = vertexCoords;  
               }

               meshShapeBuffer.edgesBuffer = meshShapeBuffer.edgesBuffer.concat(lineSegmentsCoords);
            })

            curMeshShape.faces.forEach( f => 
            {
               let lastVertexIndex = (meshShapeBuffer.trianglesVertices.length == 0 ) ? 0 : (meshShapeBuffer.trianglesVertices.length) / 3 ;
               meshShapeBuffer.trianglesVertices = meshShapeBuffer.trianglesVertices.concat(f.vertices); // triangle vertices buffer
               let newVertexIndices = f.triangleIndices.map(i => i + lastVertexIndex);
               meshShapeBuffer.triangleIndices = meshShapeBuffer.triangleIndices.concat(newVertexIndices);

               let newVertexColors = [];
               for(let v = 0; v < f.vertices.length/3; v++)
               {
                  let shapeColor = curMeshShape?.style?.fill?.color || chroma('#333333'); // TODO: nice defaults
                  let rgba = chroma(shapeColor).gl();
                  newVertexColors.push(rgba[0],rgba[1],rgba[2]);
               }
               meshShapeBuffer.trianglesVertexColors = meshShapeBuffer.trianglesVertexColors.concat( newVertexColors )
               meshShapeBuffer.triangleNormals = meshShapeBuffer.triangleNormals.concat(f.normals);
               meshShapeBuffer.triangleUVs = meshShapeBuffer.triangleNormals.concat(f.uvCoords);

               let trianglesInfo = [];
               let faceInfo = {  objId: f.objId, 
                                 shapeId: f.ocId,
                                 subShapeType: 'Face', 
                                 indexInShape: f.indexInShape,
                                 color: curMeshShape?.style?.fill?.color,
                                 faceGroupVertexIndices : newVertexIndices,
                                }
               // replicate info for numTriangles per Face
               for(let c = 0; c < f.numTriangles; c++)
               {
                  trianglesInfo.push(faceInfo);
               }

               meshShapeBuffer.trianglesInfo = meshShapeBuffer.trianglesInfo.concat(trianglesInfo);
            })

          
            // Info per entity
            meshShapeBuffer.verticesInfo = meshShapeBuffer.verticesInfo.concat( 
               curMeshShape.vertices.map( v => ({ objId: v.objId, shapeId: v.ocId, subShapeType: 'Vertex', indexInShape: v.indexInShape, color: chroma(curMeshShape?.style?.line?.color || '#333333').darken(0.5).num()  }) )
            );

         })

         // set line stats
         meshShapeBuffer.stats.numLines = meshShapeBuffer.edgesBuffer.length / 6;

         return meshShapeBuffer;
      }  

      toData():Array<Object> // TS typing
      {
         return this.shapes.map(shape => shape.toData());
      }

      toString():string
      {
         return `ShapeCollection<${this.shapes.map(s => s.toString())}>`;
      }

      /** Get all edges of 2D XY Shapes in this collection 
       *    Supply true to force all Shapes, even invisible ones!
      */
      _get2DXYShapeEdges(all:boolean=false):ShapeCollection
      {
         const shapeEdges = new ShapeCollection();

         this.forEach(shape => 
         {
            if (shape.is2DXY() && (all || shape.visible()))
            {
               shapeEdges.add(shape.edges()); // NOTE: this._parent refers to main Shape of subshapes
            }
         })

         return shapeEdges;
      }

      /** Get Annotations tied to the shapes in this collection
       *    IMPORTANT: For robustness we use all annotations that are in the bounding box of this ShapeCollection
       *          not just the annotations that are directly tied to the Shapes within
       *          This because annotations might be added using methods like bbox() 
       */
      getAnnotations(onlyVisibleShapes:boolean=false):Array<Annotation>
      {
         const BBOX_MARGIN = 100; 

         const allAnnotations = this._geom._annotator.getAnnotations();
         let collectionBbox = this.bbox(true); // withAnnotations - but does not take into account annotations not tied to shapes!
         collectionBbox = collectionBbox.enlarged(BBOX_MARGIN); // TMP FIX: make bbox larges to catch dimensions not tied to shapes

         const annotationsInBbox = allAnnotations.filter(a => a.inBbox(collectionBbox) && ((onlyVisibleShapes) ? a?.shape?.visible : true) )  
         return annotationsInBbox;
      }

      /** Export Shapes that are 2D and on XY plane to SVG 
       *    All shapes will be converted to Edges
       *    @param options { all:boolean, annotations: boolean, contours:boolean  }
       * 
       *    NOTE: contours use Arrangement2D (see Geom), but the OC routines are very slow
       *    TODO: run these algorithms apart from OC
      */
      toSvg(options:toSVGOptions = { all: false, annotations: true, fills:true, outlines:false }):string
      {
         let shapeEdges = this._get2DXYShapeEdges(options?.all);
         
         if (shapeEdges.length == 0){ return null;}

         // NOTE: SVG has reversed y-axis
         shapeEdges = shapeEdges.map(s => s._mirroredX(0)); 

         // Edges to SVG paths
         let svgPaths:Array<string> = [];
         shapeEdges.forEach( edge => 
         {
            svgPaths.push(edge.toSvg());
         })

         // NOTE: origin for SVG is in topleft corner (so different than world coordinates and doc space)
         const withAnnotations = (options?.annotations === false ) ? false : true; // true is default
         let bbox = shapeEdges.bbox(withAnnotations)

         const svgRectBbox = `${bbox.bounds[0]} ${bbox.bounds[2]} ${bbox.width()} ${bbox.depth()}`; // in format 'x y width height' 

         const svg = `<svg 
                        xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
                        viewBox="${svgRectBbox}"
                        _bbox="${svgRectBbox}" 
                        _worldUnits="${this._geom._units}" stroke="black">
                        ${svgPaths.join('\n\t')}
                        ${(withAnnotations) ? this._getDimensionLinesSvgElems() : ''}
                     </svg>`
         // TODO: remove block so we can enable subshape styling

         return svg;
      }


      _getDimensionLinesSvgElems():string
      {
         const svgElems = this.getAnnotations().map(a => a.toSvg())
         const svgText = svgElems.join('\n')

         return svgText;
      }
      
 }


 