/**
 *  Calc.ts
 *      Generate data tables and do basic data analytics 
 */
 
 import { Geom, Db, Table, TableIO } from './internal'; 
 import { Metric, MetricName, MetricOptions, TableLocation, DataRows, isDataRows, isMetricName } from './internal' // types and typeguards
 import { METRICS } from './internal' // constants

 declare var WorkerGlobalScope: any; // avoid TS errors with possible unknown variable

 export class Calc
 {
    //// SETTINGS ////
    
    //// END SETTINGS ////
    _geom;
    db:Db // the virtual database with table in there
    dbData:Object // raw outputted data 
    _metrics:{[key:string]:Metric} = {};

    gsheets:Record<string, any>; // utils bundled in gsheet object

    constructor(geom:Geom = null)
    {
        this._geom = geom; // needed to get data from the model
        this.init();
    }

    /** We need to know when we can load the Shapes */
    init()
    {
        this.db = new Db(this._geom);
        this.setupGSheetUtils();
    }

    reset()
    {
        this?.db?.reset();
        this._metrics = {};
    }

    /** Get names of tables */
    tables():Array<string>
    {
        return this?.db?.tables();
    }

    /** Get table instances */
    getTables(only:Array<string>):Array<Table>
    {
        const tables = (this?.db?._tables) ? Object.values(this?.db?._tables) : [];
        return (only.includes('*'))
            ? tables : tables.filter(t => only.includes(t.name));
    }

    getTableNames():Array<string>
    {
        return this.tables();
    }

    //// CREATION API ////

    /** Make or get table with data 
     *  @param name string
     *  @param data [ val1, val2, val3 ] or [{ col1: val1, col2: val2 }{ ... }]
    */
    table(name:string, data?:DataRows, columns?:Array<string>):Calc|Table
    {   

        if(!name){ throw new Error(`Calc::table: Please supply a table name`); }

        // get table
        if(name && !data && !columns)
        {
            if(!this.tables().includes(name))
            { 
                throw new Error(`Calc::table(${name}): Table name "${name}" doest not exist! Use tables() to get available tables`); 
            }
            else {
                return this.db.table(name);
            }
        }

        if(this.tables().includes(name)){ throw new Error(`Calc::table: Table name "${name}" already exists! Please use an unique name`); }
        if(!isDataRows(data)){ throw new Error(`Calc::table: Please supply data in format [{ col1: val1, col2: val2}] or [val1,val2] and supply column names as third parameter!`); }
        
        const newTable = new Table(data)
        newTable.name(name);
        if(Array.isArray(columns))
        {
            newTable.setColumns(columns)
        }
        this.db.saveTable(newTable);
        
        return newTable;
    }

    //// IO ////

    /** Output raw data */
    toTableData(only:Array<string>=null):Record<string, Object>
    {   
        return this?.db?.toTableData(only); 
    }

    toMetricsData(only:Array<string>=null):Record<string, Metric>
    {
        const metrics = this.getMetrics(only);
        return metrics.reduce((acc, metric) => {
            acc[metric.name] = metric;
            return acc;
        }, {} as Record<string, Metric>);
    }

    //// METRIC BOARD ////

    /** Get internal metric objects */
    metrics():Record<string,Metric>
    {
        return this._metrics;
    }   
    
    /** Get internal metric objects with filtering
     * @param only - array of metric names to filter by, or '*' to get all metrics
      */
    getMetrics(only?:Array<string>):Array<Metric>
    {
        if(!only || only.length === 0 || only.includes('*')) return Object.values(this._metrics); // all
        return Object.values(this._metrics).filter(m => only.includes(m.name));
    }

    /** Add Metric element to dashboard */
    metric(name:MetricName, data:string|number, options:MetricOptions):Metric // TODO: Metric setting typing
    {
        // some decent checking
        if (!name){ throw new Error(`Calc::metric: Please name your metric! metric('name of your metric', ...)`)}
        if (data === null || data === undefined){ throw new Error(`Calc::metric: Please supply some data reference. Either an real value or table name or location as string!`)};
        if(!isMetricName(name))
        {
            console.warn(`Calc::metric: Your metric "${name}" is not part of official ones: ${METRICS.join(', ')}`);
        }
        // make metric data structure
        const metric = {  
                name: name,
                label: options?.label || name,
                type: 'text', // only text is implemented now
                data: data,
                options: options
        } as Metric

        this._metrics[name] = metric;
        
        return metric;

    } 

    /** Convert metrics to own table */
    metricsToTable():Table
    {
        return this.table('metrics', 
            Object.values(this._metrics).map(m => { return [m?.label || m.name, m.data] }),
            ['name', 'value']
        ) as Table
    }

    getMetricNames():Array<string>
    {
        return Object.keys(this._metrics);
    }

    //// GOOGLE SHEETS OPS ////
    /* We bundle some CalcTableIO utils here for easy access */
    
    setupGSheetUtils()
    {
        const io = new TableIO();
    
        this.gsheets = {
            exports: [], // keep track of exported sheets. Add base url to ID 
            connect: async (googleDriveRootId:string) => await io.initGoogle(null, googleDriveRootId),
            fromTemplate: 
                async (templateSheetPath:string, newSheetPath:string, inputs:Record<string, any>) => 
                    this.gsheets.exports.push(
                        await io.googleSheetFromTemplate(templateSheetPath, newSheetPath, inputs, true, true)
                    ),
        };
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