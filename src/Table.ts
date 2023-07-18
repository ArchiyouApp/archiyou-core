/** a AY table: basically a wrapper over a Danfo dataframe  */

// Danfo docs: https://danfo.jsdata.org/api-re
import { Db } from './internal';
import { DbCompareStatement } from './internal'; // types.ts
import * as StringMatchAll from 'string.prototype.matchall' // polyfill for es5

type DataFrame = any; // avoid problems

export class Table
{
    _name:string;
    _danfo:any; // Danfo module
    _db:Db; // reference to database parent
    _dataframe:DataFrame;

    constructor(dataframe:DataFrame)
    {
        this._dataframe = dataframe;
        console.info(`Table: Created a table from dataframe with ${this.numRows()} rows and ${this.numColumns()} columns`);
    }

    /** Print table to console */
    print()
    {
        return this._dataframe.print();
    }

    /** Get/set name */
    name(newName?:string)
    {
        if(!newName){ return this._name;}
        
        this._name = newName;
        return this._name;
    }

    /** Save this Table is the database*/
    save(name:string):Table
    {
        if(!this._db)
        {
            console.error(`Table::save: Table cannot register to the database. None given!`);
        }

        this._db.saveTable(this, name || this._name);
        this._name = name;

        return this;
    }

    // ==== getting basic properties ====

    /** Get size of table in rows and columns */
    shape():Array<number> // [rows,columns]
    {
        return this._dataframe.shape;
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

    /** Return column labels */
    columns():Array<string>
    {
        return this._dataframe.columns;
    }

    copy():Table 
    {
        return new Table(this._dataframe.copy())
    }

    /** Return index labels. By default serial integers */
    index():Array<string|number>
    {
        return this._dataframe.index;
    }

    // ==== slicing and dicing methods ====

    head(amount:number):Table
    {
        return new Table(this._dataframe.head(amount));
    }

    tail(amount:number):Table
    {
        return new Table(this._dataframe.tail(amount));
    }

    /** Get general statistics of Table */
    describe()
    {
        this._dataframe.describe().print();
    }

    /** Slice rows based on start and end index */
    slice(startIndex:number, endIndex:number=null):Table
    {
        // see Danfo docs: https://danfo.jsdata.org/api-reference/dataframe/danfo.dataframe.iloc
        endIndex = (endIndex == 0 ) ? null : endIndex; // protect against zero, otherwise an error occurs

        if (endIndex == null)
        {
            return new Table(this._dataframe.iloc({ rows: [startIndex] }));
        }
        else 
        {
            console.log(`${startIndex}:${endIndex}`);
            return new Table(this._dataframe.iloc({ rows: [ `${startIndex}:${endIndex}`]}));
        }
        
    }

    /** Select specific column labels */
    select(columns:string|Array<string>):Table
    {
        if (typeof columns == 'string')
        {
            columns = [ columns ];
        }

        return new Table(this._dataframe.loc({ columns : columns }));
    }

    /** Sorting of Table */
    sort(columns:string|Array<string>, ascending:boolean):Table
    {
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

    /** Output to Row objects */
    toDataRows():Array<Object> // TODO: TS typing
    {
        let rawRows = this._dataframe.values; // returns [ [row1],[row2],[row3] ]
        let columnNames = this.columns();

        let rows = [];
        rawRows.forEach( rowValues => {
            rows.push( this._zip(columnNames, rowValues));
        })
        
        return rows;
    }

    /** Output to raw Array of values of this column */
    toDataColumn(columnName:string):Array<number|string>
    {
        let colIndex = this.columns().indexOf(columnName);
        if(colIndex !== -1)
        {
            let colValues = [];
            this._dataframe.values.forEach( rowValues => 
            {
                colValues.push(rowValues[colIndex])
            });

            return colValues;
        }

        return [];
    }

    /** Iterate over rows with a function and write new values 
     *  Danfo does not offer something like this. Got inspiration from PETL
    */
    apply(func:(row:Object,index?:number,all?:Array<any>) => void):Table
    {
        // For example: write a certain value to column 'x': apply( (row,df) => row.x = '1' );
        // NOTE: Danfo has limited options here, only the gather crude apply. Fallback on JS/TS functions
        let rowObjs = this.toDataRows();
        // map over rows to create new DF
        rowObjs.forEach(func);

        return new Table( new this._danfo.DataFrame(rowObjs) );
    }

    /** Add Column with certain value to Dataframe and return the new Table
     *  @value 
     *      - Can be a static value number, 'test' etc. !!!! IMPORTANT: Value cannot be null or undefined due to Danfo using NaN !!!!
     *      - Can be a function to operate on the row (row,index,all?) -- needs to return a value for the new column
     */
    addColumn(name:string, value:any|Array<any>|((row:Object,index?:number, all?:Array<Object>) => any)=NaN):Table
    {
        // an normal static value
        if( !(typeof value == 'function'))
        {
            // IMPORTANT: Danfo expects a Array of values - and these values cannot be null or undefined in this context ==> use Nan
            if (!(value instanceof Array))
            {
                value = new Array(this.numRows()).fill(this._protectNullUndefined(value));
            }
            let newDf = this._dataframe.copy();
            newDf.addColumn(name, value); 

            return new Table(newDf);
        }
        else {
            // a dynamic value calculated on a row basis
            let tmpTable = this.addColumn(name, NaN );
            let wrapColFunc = (row:Object,index:number,all:Array<Object>) =>
            {
                row[name] = (value as Function)(row,index,all);
            };
            
            return tmpTable.apply(wrapColFunc);            
        }
    }

    /** GroupBy: Grouping rows by column values and run aggregate functions */
    groupBy(columns:string|Array<string>, aggFuncs:string|Array<string>, aggColumns:string|Array<string>):Table
    {
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
    join(other:Table, keys:string|Array<string>)
    {
        return new Table( this._danfo.merge(
                            { left : this._dataframe, 
                              right : other._dataframe, 
                              on : (keys instanceof Array) ? keys : [keys], 
                              how : 'inner' } ) ); // see: https://danfo.jsdata.org/api-reference/general-functions/danfo.merge
    }


    // ==== OUTPUT ====

    toData()
    {
        return this._danfo.toJSON(this._dataframe)
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
            obj[key] = values[index]
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
            console.log(m);
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