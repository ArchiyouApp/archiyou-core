/** Convert AY scene to a database with tables/dataframes and basic analytics and IO */


import { Brep, Table } from './internal'

export class Db
{
    // SETTINGS
    DEBUG = false;
    UNNAMED_TABLE = 'Table'

    _brep:Brep; // bind to brep module to d data of Shapes and Scene
    _tables:Object = {}; // { name : Table }
    
    shapes:Table; // all Shapes in the current model (see _brep)
    objects:Table; // all Obj containing Shapes in the Scene ( through _brep)

    constructor(brep:Brep)
    {
        this._brep = brep;

        this.init(); // try to init immediately. Maybe there are not Shapes in Brep instance. When there are use init()
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
        // get new data from Brep
        this.setupTables();
    }

    /** Generate standard tables  */
    setupTables()
    {
        // add reference to the parent database in every Table instance
        Table.prototype._db = this;
    
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
        name = name || (table.name() as string) || (this.UNNAMED_TABLE + '_' + Object.keys(this._tables).length);
        this._tables[name] = table;
    }

    /** Rename table and update its references in Db */
    renameTable(table:Table, newName:string)
    {
        const oldName = table.name() as string;
        table._name = newName;
        this._tables[newName] = table;
        delete this._tables[oldName];
    }

    /** Get names of tables */
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
        if(!this._brep)
        {
            console.error(`Db::generateShapesData: Cannot get Shapes without an instance of Geom. Please supply it in constructor!`);
            return [];
        }
        let shapesData = this._brep.all().toArray().map(shape => shape.toTableData());
        return shapesData;
    }

    generateObjsData():Array<Object> // TODO: make output Object an Interface?
    {
        if(!this._brep)
        {
            console.error(`Db::generateObjsData: Cannot get Objs without an instance of Brep. Please supply it in constructor!`);
            return [];
        }
        return this._brep.allObjs().map(obj => obj.toData());
    }

    //// OUTPUTS ////

    /** Output tables as raw data */
    toTableData(only?:string|Array<string>):Record<string, Object>
    {
        only = Array.isArray(only) 
                ? only 
                : typeof only === 'string' ? [only] : null;

        return Object.keys(this._tables).reduce((data, tableName) => {
            if (!only || only.includes(tableName))
            {
                data[tableName] = this._tables[tableName].toData();
            }
            return data;
        }, {} as Record<string, Object>);
    }

    /** Output tables as Excel file buffers  */
    async toTableExcel(only?:string|Array<string>):Promise<Record<string, ArrayBuffer>>
    {
        only = Array.isArray(only) 
                ? only 
                : typeof only === 'string' ? [only] : null;

        const tableNames = this.tables();
        const tableBufferByName: Record<string, ArrayBuffer> = {};

        for(let t = 0; t < tableNames.length; t++)
        {
            const table = this._tables[tableNames[t]];
            if (!only || only.includes(tableNames[t]))
            {
                tableBufferByName[tableNames[t]] = await table.toExcel();
            }
        }

        return tableBufferByName;
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