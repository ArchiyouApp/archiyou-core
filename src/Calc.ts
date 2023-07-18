/**
 *  Calc.ts
 *      Generate data tables and do basic data analytics 
 */
 
 import { Db, Table, Geom } from './internal'; 
 import { Metric, MetricOptions, TableLocation, DataRows, isDataRows } from './types'

 export class Calc
 {
    _danfo;
    _geom;
    db:Db // TMP DISABLED: Db; // the virtual database with table in there
    dbData:Object // raw outputted data 
    _metrics:{[key:string]:Metric} = {};

    constructor(geom:Geom = null)
    {
        this._geom = geom; // needed to get data from the model
        this.loadDanfo()
            .then(() => this.init())

    }

    /** Load Danfo module dynamically based on enviroment */
    async loadDanfo():Promise<any> // TODO TS typing
    {   
        // detect context of JS
        const isBrowser = typeof window === 'object'
        const isNode = !isBrowser && typeof process !== 'undefined';
        const isWorker = !isNode && !isBrowser;
         
        if(isWorker || isBrowser)
        {
            console.log('==== LOAD DANFO FOR BROWSER/WORKER ====')
            this._danfo = await import('danfojs')
        }
        else {
            console.log('==== LOAD DANFO FOR NODE ====')
            // keep this out import(..) to avoid being picked up by Webpack in client
            // looks like NodeJS can search node_modules in webworker for the library
            const nodeDanfoPath = 'danfojs-node'; 
            
            this._danfo = await import(nodeDanfoPath)
        }
 
        return this._danfo;
    }

    /** We need to know when we can load the Shapes */
    init()
    {
        this.db = new Db(this._geom, this._danfo);
    }

    /** Automatically calc.init() when user uses calc module */
    autoInit()
    {
        if(!this.db.isInitiated())
        {
            this?.db?.init();
        }
    }

    reset()
    {
        this?.db?.reset();
        this._metrics = {};
    }

    tables()
    {
        return this?.db?.tables();
    }

    //// CREATION API ////

    /** Make table with data 
     *  @param name string
     *  @param data [ val1, val2, val3 ] or [{ col1: val1, col2: val2 }{ ... }]
    */
    table(name:string, data:DataRows, columns:Array<string>):Calc
    {   
        this.autoInit();

        if(!name){ throw new Error(`Calc::table: Please supply a table name`); }
        if(this.tables().includes(name)){ throw new Error(`Calc::table: Table name "${name}" already exists! Please use an unique name`); }
        if(!isDataRows(data)){ throw new Error(`Calc::table: Please supply data in format [{ col1: val1, col2: val2}] or [val1,val2] and supply column names as third parameter!`); }
        
        const df = (columns) ? new this._danfo.DataFrame(data, { columns: columns }) : new this._danfo.DataFrame(data);
        const newTable = new Table(df)
        newTable.name(name);
        this.db.saveTable(newTable);
        
        return this;
    }

    /** Output all table data
     *    returns: { table_name: [{Row { columnName, value, ... }},{Row}]}
     *    NOTE: outputting all data is async. Thats why we have a callback function here!
     */
    exportDb(onDone: (data:Object) => void)
    {
        this.autoInit();
        this?.db?.requestData( (data) => 
        { 
            this.dbData = data;
            onDone(this.dbData);
        });
    }

    /** Output raw data */
    toTableData():{[key:string]:Object}
    {   
        return this?.db?.toTableData(); 
    }

    //// METRIC BOARD ////

    /** Export metrics */
    metrics():{[key:string]:Metric}
    {
        return this._metrics;
    }   

    /** Add Metric element to dashboard */
    metric(name:string, data:string|number, options:MetricOptions):Metric // TODO: Metric setting typing
    {
        // some decent checking
        if (!name){ throw new Error(`Calc::metric: Please name your metric! metric('name of your metric', ...)`)}
        if (!data){ throw new Error(`Calc::metric: Please supply some data reference. Either an real value or table name or location as string!`)};

        this.autoInit();

        // data is reference to some table location
        let parsedData;
        if(typeof data === 'string')
        {
            try {
                let tableLocation = this._resolveTableLocation(data as string);
                parsedData = tableLocation.data;
            }
            catch(e)
            {
                // could not parse as table location somehow
            }
        }

        // we assume it is a direct value if parsing failed or data is not a string
        if(!parsedData)
        {
            parsedData = data;
        }

        // make metric data structure
        let metric = {  
                name: name,
                type: options?.type || 'text', // default is text
                data: parsedData,
                options: options
        }
        this._metrics[name] = metric;
        
        return metric;

    } 

    //// UTILS ////

    /** Get raw data by simple table lookup with location and return TableLocation object 
     *  We can expect values like:
     *       tableName
     *       otherTable.columnname => all values in column
     *       otherTable[1] => all values in row
    */
    _resolveTableLocation(tableLocation:string):TableLocation
    {
        // TMP DISABLED
        if (!this.db) return 

        // basic error checking
        if(typeof tableLocation !== 'string'){ throw new Error(`Calc::_resolveTableLocation: Please supply a string such as 'tablename', 'tablename.columname' or 'tablename[1]!`)}
        
        // table
        if(!tableLocation.includes('.')) 
        {
            let table = this.db.table(tableLocation)
            if (!table){ throw new Error(`Calc::_resolveTableLocation: No such table '${tableLocation}'!`) };
            return { location: tableLocation, table: table, data: table.toDataRows() }; // TODO: is this output good? Array<Object>
        }
        // column 
        const COLUMN_RE = /(?<table>[^\.]+).(?<columnName>[.]+)/;
        let m = tableLocation.match(COLUMN_RE);
        if(m)
        {
            let columnName = m?.groups.columnName;
            let table = this.db.table(m?.groups.table);
            if (!table){ throw new Error(`Calc::_resolveTableLocation: No such table '${tableLocation}'!`) };
            return {    location : tableLocation, 
                        table: table, 
                        column: columnName,
                        data: table.toDataColumn(columnName) 
                    }
        }

        // row
        const ROW_RE = /(?<table>[^\[]+)\[(?<index>[\d]+)\]/
        let rm = tableLocation.match(ROW_RE);
        if (!rm){ throw new Error(`Calc::_resolveTableLocation: Could not find column or row!`) };
        let table = this.db.table(m.groups.table);
        if (!table){ throw new Error(`Calc::_resolveTableLocation: No such table '${tableLocation}'!`) };
        let rowIndex = parseInt(m.groups.index);
        return { 
                    location: tableLocation,
                    table: table,
                    row: rowIndex,
                    data: table.toDataRows[rowIndex]
        }
    }
    

 }