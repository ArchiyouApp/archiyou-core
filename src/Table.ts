/**
 *  Table.ts
 *     A table object holds data and enables easy adding, modifiying of data
 * 
*/

import { Db, DataRowsColumnValue, DataRowColumnValue, DataRows } from './internal';
import { isDataRowsValues, isDataRowsColumnValue } from './internal';
import { DbCompareStatement } from './internal'; // types.ts
import * as StringMatchAll from 'string.prototype.matchall' // polyfill for es5


export class Table
{
    //// SETTINGS ////
    DEFAULT_COL_NAME = 'col';
    //// END SETTINGS

    _name:string;
    _db:Db; // reference to database parent
    _dataRows: DataRowsColumnValue; // raw data fallback: [{ col1: v1, col2: v2}, { col1: v3, col2: v4 }]}
    _component:string; // component name if this table came from a component

    /** Make Table from rows with Objects or values */
    constructor(data:DataRows, columns:Array<string>=null)
    {
        if(isDataRowsValues(data)) 
        {
            // only rows with values [[r1v1,r1v2],[r2v1,r2v2]], make up column names
            // Set the columns later with setColumns()
            console.info(`Table::constructor(): Creating table with ${data.length} rows and ${data[0].length} columns`);
            this._dataRows = data.map((row,rowIndex) => row.reduce((acc,val,valIndex) => 
            {
                // accumulator is the new row
                acc[`${this.DEFAULT_COL_NAME}${valIndex}`] = val;
                return acc
            }, {}))
            console.info(`Table::constructor(): Created table with data ${JSON.stringify(this._dataRows)}`);
        }
        else if(isDataRowsColumnValue(data))
        {
            this._dataRows = data;
        }
        else {
            console.info(`Table: Can't create table. Unknown data format. Please supply [{ col1:v1, col2:v2 }, ...] or [[r1v1,r1v2],...]`);
        }
    
    }

    
    /** Print table to console */
    print()
    {
        return this._dataRows;
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
            const newRow = {};
            for (const [colName,val] of Object.entries(row))
            {
                const i = Object.keys(row).indexOf(colName);
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
    // TODO: Implement now danfo is gone

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

    /** Output raw data in rows 
     * in format { [col1: row1val, col2: row1val2], [col1: row2val, ..] ... }
     * */
    toData():DataRows
    {
        return this._dataRows
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