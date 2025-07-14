/**
 *  Table.ts
 *     A table object holds data and enables easy adding, modifiying of data
 *     !!!! WIP !!!! We need to refactor the dependancy of Danfo, which is a bit too heavy for this context
 * 
*/

import { Db, DataRowsColumnValue, DataRowColumnValue, DataRows } from './internal';
import { isDataRowsValues, isDataRowsColumnValue } from './internal';
import { DbCompareStatement } from './internal'; // types.ts
import * as StringMatchAll from 'string.prototype.matchall' // polyfill for es5

type DataFrame = any; // avoid problems

export class Table
{
    //// SETTINGS ////
    DEFAULT_COL_NAME = 'col';
    //// END SETTINGS

    _name:string;
    _danfo:any; // Danfo module
    _db:Db; // reference to database parent
    _dataframe:DataFrame; // TODO: Remove Danfo stuff
    _dataRows: DataRowsColumnValue; // raw data fallback: [{ col1: v1, col2: v2}, { col1: v3, col2: v4 }]}
    _component:string; // component name if this table came from a component

    /** Make Table from either rows with Objects or Danfo Dataframe */
    constructor(data:DataRows|DataFrame)
    {
        if(this._danfo)
        {
            this._dataframe = (Array.isArray(data)) ? new this._danfo.DataFrame(data) : data;
            console.info(`Table: Created a table with ${this.numRows()} rows and ${this.numColumns()} columns`);
        }
        else {
            console.warn(`Table: Danfo module is disabled! Fall back to raw DataRows as data format. Analytic functions don't work!`)
            if(isDataRowsValues(data)) 
            {
                // only rows with values [[r1v1,r1v2],[r2v1,r2v2]], make up column names
                // Set the columns later with setColumns()
                this._dataRows = data.map((row,rowIndex) => row.reduce((acc,val,valIndex) => 
                {
                    // accumulator is the new row
                    acc[`${this.DEFAULT_COL_NAME}${valIndex}`] = val;
                    return acc
                }, {}))
            }
            else if(isDataRowsColumnValue(data))
            {
                this._dataRows = data;
            }
            else {
                console.info(`Table: Can't create table. Unknown data format. Please supply [{ col1:v1, col2:v2 }, ...] or [[r1v1,r1v2],...]`);
            }
        }
    }

    /** Check if Danfo is available, if not throw error analytic methods */
    checkDanfo():boolean
    {
        if(!this._danfo)
        {
            throw new Error(`Table: Danfo is not available. This method does not work!`);
        }
        return true;
    }

    /** Print table to console */
    print()
    {
        return (!this._danfo) ?  this._dataRows : this._dataframe.print();
    }

    /** Get/set name */
    name(newName?:string):string|Table
    {
        if(!newName)
        { 
            return this._name;
        }
        
        this._db.renameTable(this, newName);
        return this;
    }

    /** Save this Table in the database*/
    save(name:string):Table
    {
        if(!this._db)
        {
            console.error(`Table::save: Table cannot register to the database. None given!`);
        }
        else {
            this._db.saveTable(this, name || this._name);
            this._name = name;
        }

        return this;
    }

    // ==== getting basic properties ====

    firstRow():DataRowColumnValue
    {
        return this._dataRows[0] || {}
    }

    /** Get size of table in rows and columns */
    shape():Array<number> // [rows,columns]
    {
        return [this._dataRows.length, Object.keys(this._dataRows[0])?.length];
    }
    
    size():Array<number>
    {
        return this.shape();
    }

    numRows():number
    {
        return this.shape()[0];
    }

    numColumns():number
    {
        return this.shape()[1];
    }

    /** Set name of columns */
    setColumns(names:Array<string>):Table
    {
        if(!Array.isArray(names))
        {
            throw new Error(`Table::setColumns(columns): Please names of columns in an Array!`)    
        }

        this._dataRows = this._dataRows.map( row => {
            const newRow = { ...row };
            for (const [colName,val] of Object.entries(row))
            {
                const i = Object.keys(row).indexOf(colName);
                delete newRow[colName];
                newRow[names[i] || colName] = val;
            } 
            return newRow;
        })


        return this;
    }

    columns():Array<string>
    {
        return this._dataRows.reduce( (agg, row) => 
        {
            Object.keys(row).forEach( (col) => 
            {
                if(!agg.includes(col))
                {
                    agg.push(col);
                }
            });
            return agg
        },
            []
        ) as Array<string>
    }


    /** Return index labels. By default serial integers */
    index():Array<string|number>
    {
        return Array.from(Array(this._dataRows.length).keys());
    }

    //// SIMPLE OPS ////

    /** Add a simple row consisting of valyues */
    addRow(row:Array<string|number|Record<string,  string|number>>):this
    {
        if(Array.isArray(row))
        {
            this._dataRows.push(this._zip(this.columns(), row))
        }
        else if(typeof row === 'object'){
            const fullRow = { ...this._zip(this.columns(), []), ...(row as Object) };
            this._dataRows.push(fullRow); // can directly push the key:value pair
        }

        return this;
    }

    //// SLICING AND DICING ////
    // TODO: Remove Danfo stuff

    head(amount:number):Table
    {
        this.checkDanfo();
        return new Table(this._dataframe.head(amount));
    }

    tail(amount:number):Table
    {
        this.checkDanfo();
        return new Table(this._dataframe.tail(amount));
    }

    /** Get general statistics of Table */
    describe()
    {
        this.checkDanfo();
        this?._dataframe?.describe()?.print();
    }

    /** Slice rows based on start and end index */
    slice(startIndex:number, endIndex:number=null):Table
    {
        this.checkDanfo(); // TODO: make work without danfo

        // see Danfo docs: https://danfo.jsdata.org/api-reference/dataframe/danfo.dataframe.iloc
        endIndex = (endIndex == 0 ) ? null : endIndex; // protect against zero, otherwise an error occurs

        if (endIndex == null)
        {
            return new Table(this._dataframe.iloc({ rows: [startIndex] }));
        }
        else 
        {
            return new Table(this._dataframe.iloc({ rows: [ `${startIndex}:${endIndex}`]}));
        }
        
    }

    /** Select specific column labels */
    select(columns:string|Array<string>):Table
    {
        this.checkDanfo();

        if (typeof columns == 'string')
        {
            columns = [ columns ];
        }

        return new Table(this._dataframe.loc({ columns : columns }));
    }

    /** Sorting of Table */
    sort(columns:string|Array<string>, ascending:boolean):Table
    {
        this.checkDanfo(); // TODO: make work without danfo

        const DEFAULT_ORDER = true; // true = ascending, false = descending

        ascending = ascending || DEFAULT_ORDER;

        return new Table( this._dataframe.sort_values({ by: columns, ascending: ascending, inplace: false }));
    }

    /** Filter a Table 
     *  @param filter   
     *      - can be original Danfo query Object: { "column", "is", "to" }. Example: { "column": "B", "is": ">", "to": 5 }
     *      - can be a string we turn into Danfo query Object:  'B > 5' or 'type = Edge or type = Shell'
    */

    filter(query:string|Object):Table
    {
        this.checkDanfo(); // TODO: make work without danfo

        let dfQueries = []; 

        if (query instanceof Object)
        {
            if (!this._checkDfQuery(query))
            {
                console.error(`Table::filter: Please input a Danfo Query Object ({column, is, to}) or a string! Returned the original Table!`);
                return this;
            }
            else 
            {
                dfQueries = [query];
            }
        }
        else if(typeof query == 'string')
        {
            // we convert a expression to one or more DfQueryObjects
            dfQueries = this._stringToDfQueries(query);

        }
        else {
            console.error(`Table::filter: Please input a Danfo Query Object ({column, is, to}) or a string! Returned the original Table!`);
            return this;
        }

        // We have one or more Danfo query objects. We combine them into one dataframe
        let currentDf = this._dataframe;
        dfQueries.forEach( query => 
        {
            if (!query.combine || query.combine == 'and' || query.combine == '&&')
            {
                // AND logic: filter the currentDf, not the original
                currentDf = currentDf.query(query);
            }
            else {
                // OR logic: query original DF and concat to current
                currentDf = this._danfo.concat({ dfList: [currentDf, this._dataframe.query(query)], axis: 0 }) as DataFrame; // TS FIX DataFrame|Series
            }
        
        });

        return new Table(currentDf);

    }

    /** Iterate over rows with a function and write new values 
     *  Danfo does not offer something like this. Got inspiration from PETL
    */
    apply(func:(row:Object,index?:number,all?:Array<any>) => void):Table
    {
        this.checkDanfo(); // TODO: make work without danfo

        // For example: write a certain value to column 'x': apply( (row,df) => row.x = '1' );
        // NOTE: Danfo has limited options here, only the gather crude apply. Fallback on JS/TS functions
        let rowObjs = this.toDataRows();
        // map over rows to create new DF
        rowObjs.forEach(func);

        return new Table( new this._danfo.DataFrame(rowObjs) );
    }



    /** GroupBy: Grouping rows by column values and run aggregate functions */
    groupBy(columns:string|Array<string>, aggFuncs:string|Array<string>, aggColumns:string|Array<string>):Table
    {
        this.checkDanfo(); // TODO: make work without danfo
        // TODO: agg reducer functions 

        // see more: https://danfo.jsdata.org/api-reference/dataframe
        const AGG_FUNCTIONS_TO_DANFO = {
            'sum' : 'sum',
            'max' : 'max',
            'min' : 'min',
            'mean' : 'mean',
            'median' : 'median',
            'avg' : 'mean',
            'var' : 'var',
        }

        // check columns input
        if (!(columns instanceof Array))
        {
            if (typeof columns == 'string'){
                columns = [ columns ]; // put into array
            }
            else {
                console.error(`Table::groupBy: Please supply a single or list of valid column names to group by!`);
                return null;
            }
        }

        // check values of columns
        let checkedColumns = this._checkColumns(columns);
        if (checkedColumns.length != columns.length ){
            console.warn(`Table::groupBy: We detected some unknown columns and dropped them. Please check!`);
        }

        // check aggFuncs
        aggFuncs = ( aggFuncs instanceof Array ) ? aggFuncs : [ aggFuncs ];
        let checkedAggFuncs = aggFuncs.filter( f => Object.keys(AGG_FUNCTIONS_TO_DANFO).includes(f) );
        if (checkedAggFuncs.length != aggFuncs.length)
        {
            console.error(`Table::groupBy: Detected unknown aggregate functions: Please choose one or these: [${Object.values(AGG_FUNCTIONS_TO_DANFO).join(',')}]`);
            return null;    
        }

        aggColumns = (aggColumns instanceof Array) ? aggColumns : [aggColumns];
        let checkedAggArgCols = this._checkColumns(aggColumns);

        if(checkedAggArgCols.length != checkedAggFuncs.length){ 
            console.error(`Table::groupBy: Please supply equal aggregate functions (#${checkedAggFuncs.length}) as column names (#${checkedAggArgCols.length}) to apply them on!`);
        }

        // now do the Danfo operation
        let groups = this._dataframe.groupby(checkedColumns);
        let newTable;
        // for every group add an aggregate function on a specific column:
        checkedAggFuncs.forEach( (funcName, index) => {
            let aggColumns = checkedAggArgCols[index];
            let funcNameDf = AGG_FUNCTIONS_TO_DANFO[funcName];
            if (index == 0){
                newTable = new Table(groups.col([aggColumns])[funcNameDf]()); // see: https://danfo.jsdata.org/api-reference/groupby/groupby.col
            }
            else {
                // append specific
                let addTable = new Table(groups.col([aggColumns])[funcNameDf]());
                let lastColName = addTable.columns()[addTable.columns().length - 1];
                // last column as table
                addTable = addTable.select([checkedColumns[0], lastColName]); // use first column that we grouped on as key
                newTable = newTable.join(addTable, checkedColumns[0]);
            }
            
        });

        return newTable;

    }

    /** Join two table on a specific key or multiple keys */
    join(other:Table, keys:string|Array<string>):Table
    {
        this.checkDanfo(); // TODO: make work without danfo

        return new Table( this._danfo.merge(
                            { left : this._dataframe, 
                              right : other._dataframe, 
                              on : (keys instanceof Array) ? keys : [keys], 
                              how : 'inner' } ) ); // see: https://danfo.jsdata.org/api-reference/general-functions/danfo.merge
    }


    // ==== OUTPUT ====

    /** Output to Row objects */
    toDataRows():DataRowsColumnValue // TODO: TS typing
    {
        return this._dataRows;
    }

    /** Output to raw Array of values of this column */
    toDataColumn(columnName:string):Array<number|string>
    {
        return this._dataRows.map(row => row[columnName]); 
    }

    /** Output raw data in rows */
    toData():DataRows
    {
        return this._dataRows;
    }

    // ==== utils ====

    _protectNullUndefined(value:any)
    {
        if(value == null){
            return NaN;
        }
        if(value == undefined)
        {
            return NaN;
        }
        return value;
    }

    _zip(keys:Array<string>,values:Array<any>)
    {
        let obj = {};
        
        keys.forEach( (key, index) =>
        {
            obj[key] = values[index] ?? null
        });

        return obj;
    }

    _stringToDfQueries(input:string):Array<Object> // TODO: interface
    {
        const MAP_EXPRESSION_TO_DF_QUERY = {
            column : 'column',
            comparator: 'is',
            value: 'to',
            combine: 'combine',
        }

        let expressions:Array<DbCompareStatement> = this._getExpressions(input);

        if(expressions.length == 0)
        {
            return null;
        }
        else {
            let dfQueries = []
            expressions.forEach( expr =>
            {
                if(!this._checkColumn(expr.column))
                {
                    console.warn(`Table::_stringToDfQuery: You used column "${expr.column}" in an expression. But it does not exist on this Table!`);
                }
                else {
                   dfQueries.push(this._remapObject( expr, MAP_EXPRESSION_TO_DF_QUERY));
                }
            });

            return dfQueries;
        }

    }

    _checkColumn(name:string)
    {
        return this.columns().includes(name);
    }

    _checkColumns(names:Array<string>)
    {
        return names.filter( name => this._checkColumn(name));
    }

    /** Remap keys of Object to new */
    _remapObject(obj:Object, map:Object)
    {
        let newObj = {}
        for (const [key,value] of Object.entries(obj))
        {
            newObj[map[key]] = value;
        }

        return newObj;
    }

    _getExpressions(input:string):Array<DbCompareStatement> // TODO: make expression Interface
    {
        const LOGIC = ['==', '>=', '<=', '>', '<']; // NOTE: order is important, otherwise '>' in '>=' is matched earlier!
        const EXPRESSION_COMBINE_LOGIC = ['and', 'or', '\|\|', '&&'];
        const EXPRESSION_RE = new RegExp( `(?<combine>${EXPRESSION_COMBINE_LOGIC.join('|')})?(^|[ ]+)(?<column>[^ ]+)[ |${LOGIC.join('|')}]*(?<comparator>${LOGIC.join('|')})[ ]*(?<value>[^ ]+)([ ]+)?`, 'g');

        // get conditional expressions
        // NOTE: polyfilled for String.matchAll
        let expressions:Array<DbCompareStatement> = Array.from(StringMatchAll(input, EXPRESSION_RE)).map( m => { 
            return { 
                // avoiding some TS errors: TODO: Get Match Interface?
                column : (m as any).groups.column.trim(), 
                comparator : (m as any).groups.comparator.trim(), 
                value : this._makeRealValue((m as any).groups.value.trim()),
                combine: ((m as any).groups.combine) ? (m as any).groups.combine.trim() : null,
                }
        });

        return expressions;

    }

    /** We need to convert some values into their real type */
    _makeRealValue(value:string)
    {
        // null
        if(value == 'null'){ return null; };
        // booleans
        if(value == 'false'){ return false;}
        if(value == 'true'){ return true; }
        // numbers
        if (this._isNumeric(value))
        {
            return parseFloat(value);
        }
        return value;

    }

    _isNumeric(value:string)
    {
        if(typeof value == 'number'){
            return true;
        }
        else {
            return !isNaN(value as any) && !isNaN(parseFloat(value)); // avoid TS errors
        }

    }

    _checkDfQuery(obj:Object):boolean
    {
        return this._checkObject(obj, ['column','is', 'to']);
    }

    _checkObject(obj:Object,columns:Array<string>)
    {
        for (let i = 0; i < columns.length; i++)
        {
            if(!Object.keys(obj).includes(columns[i]))
            {
                return false;
            }
        }
        return true;
    }

    _range(startIndex:number, endIndex:number):Array<number>
    {
        return Array.from({length: (endIndex - startIndex)}, (v, k) => k + startIndex);
    }


    

}