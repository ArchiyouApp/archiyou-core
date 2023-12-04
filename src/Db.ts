/** Convert AY scene to a database with tables/dataframes and basic analytics and IO */


import { Geom, Table } from './internal'

export class Db
{
    // SETTINGS
    DEBUG = false;
    UNNAMED_TABLE = 'Table'

    _danfo:any; // dynamic Danfo module
    _geom:Geom; // bind to geom module to d data of Shapes and Scene
    _tables:Object = {}; // name : Table
    shapes:Table; // all Shapes in the current model (see _geom)
    objects:Table; // all Obj containing Shapes in the Scene ( through _geom)

    data:Object; // output data { tablename : [datarows] }


    constructor(geom:Geom, danfo:any)
    {
        this._geom = geom;
        this._danfo = danfo;

        this.init(); // try to init immediately. Maybe there are not Shapes in Geom instance. When there are use init()
    }

    init()
    {
        this.setupTables();
    }

    isInitiated():boolean
    {
        return Object.keys(this._tables).length > 0;
    }

    /** reset  */
    reset()
    {
        // reset tables
        this._tables = {};
        // get new data from Geom
        this.setupTables();
    }

    /** Generate standard tables  */
    setupTables()
    {
        // add reference to the parent database in every Table instance
        Table.prototype._db = this;
        Table.prototype._danfo = this._danfo; // if available
    
        let shapesDataRows = this.generateShapesData();
        
        if(shapesDataRows.length > 0)
        {
            this.shapes = new Table(shapesDataRows);
            this.shapes.save("shapes");
        }

        let objDataRows = this.generateObjsData();
        if(objDataRows.length > 0)
        {
            this.objects = new Table(objDataRows);
            // register shapes and object table
            this.objects.save("objects");
        }
        
    }

    saveTable(table:Table, name?:string)
    {
        name = name || table.name() || (this.UNNAMED_TABLE + '_' + Object.keys(this._tables).length);
        this._tables[name] = table;
    }

    tables():Array<string>
    {
        return Object.keys(this._tables);
    }

    table(name:string):Table
    {
        return this._tables[name];
    }

    generateShapesData():Array<Object> // TODO: make output Object an Interface?
    {
        if(!this._geom)
        {
            console.error(`Db::generateShapesData: Cannot get Shapes without an instance of Geom. Please supply it in constructor!`);
            return [];
        }
        let shapesData = this._geom.allShapes().toArray().map(shape => shape.toTableData());
        return shapesData;
    }

    generateObjsData():Array<Object> // TODO: make output Object an Interface?
    {
        if(!this._geom)
        {
            console.error(`Db::generateObjsData: Cannot get Objs without an instance of Geom. Please supply it in constructor!`);
            return [];
        }
        return this._geom.allObjs().map(obj => obj.toData());
    }

    // ==== OUTPUTS ====

    /** Output tables as json data */
    toTableData():{[key:string]:Object}
    {
        let data = {}; // key: data

        for (const [key,tableObj] of Object.entries(this._tables))
        {
            if (tableObj)
            {
                data[tableObj.name()] = tableObj.toData();
            }
            else {
                console.warn(`Got a undefined Table under name ${key}`)
            }
        }
        return data;
    }

    /** Export Database with saves Tables to Json format */
    requestData(onDone : (data:Object) => void )
    {
        this.data = {}; // reset data (if needed)
        for (const [key,tableObj] of Object.entries(this._tables))
        {
            this.data[key] = null; // make key ( so we can check the results )
            let tableName = tableObj.name();
            tableObj.toData().then( (tableData) => this.handleTableData(tableData,tableName,onDone));
        }
    }

    handleTableData(tableData:Object,table:string,onDone:(data:Object)=> void )
    {
        // save data when Promise is resolved. Then set in this.data - check if all results are in and run onDone
        this.data[table] = tableData;
        if( !Object.values(this.data).includes(null) )
        {
            // we are done
            if (onDone){
                onDone(this.data);
            }
        }
    }   

    //// DEBUG OUTPUT METHODS ////

    generateTestShapesData(amount:number=50):Array<Object> // TODO: make output Object an Interface?
    {
        
        return Array.from(Array(amount).keys()).map(i => this.generateTestShape());
    }

    generateTestShape():Object
    {
        return {
            ocId : Math.round(Math.random()*999999999),
            objId : Math.round(Math.random()*999999999),
            // typing
            isCollection: (Math.random() > 0.5) ? true : false,
            type : this.randomShapeType(),
            // geometry properties
            isValid: (Math.random() > 0.5) ? true : false,
            bbox : null, 
            bboxWidth : Math.round(Math.random()*100),
            bboxDepth : Math.round(Math.random()*100),
            bboxHeight : Math.round(Math.random()*100),
            center: [0,0,0], // Vector as data
            numVertices : Math.round(Math.random()*10),
            numEdges :  Math.round(Math.random()*10),
            numWires :  Math.round(Math.random()*10),
            numFaces :  Math.round(Math.random()*10),
            numShells :  Math.round(Math.random()*10),
            numSolids :  Math.round(Math.random()*10),
            length :  Math.round(Math.random()*10),
            surface : Math.round(Math.random()*10),
            area :  Math.round(Math.random()*100),
            volume :  Math.round(Math.random()*1000),
        }
    }

    generateTestObjsData(amount:number=50):Array<Object> // TODO: make output Object an Interface?
    {
        
        return Array.from(Array(amount).keys()).map(i => this.generateTestObj());
    }

    generateTestObj():Object
    {
        return {
            id : Math.random()*999999999,
            name : (Math.random()*999999999).toString(),
            isLayer: (Math.random() > 0.5) ? true : false,
            visible : (Math.random() > 0.5) ? true : false,
            style : {},
            color: null,
            parentId: null,
            childrenIds: [],
            shapeIds : [],
        }
    }

    randomShapeType()
    {
        const SHAPE_TYPES = ['Vertex', 'Edge', 'Wire', 'Face', 'Shell', 'Solid'];
        let index = Math.round((Math.random()*SHAPE_TYPES.length-1));
        return SHAPE_TYPES[index]
    }
}