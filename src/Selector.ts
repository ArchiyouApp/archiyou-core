import { Selection, SelectionShapeTargetSetting, SelectorSetting, SelectorIndex } from './internal' // InternalModels
import { Shape, ShapeCollection } from './internal'
import { intRange } from './internal' // utils

/**

    Class for selecting parts of Shapes
    
    ex: 
        Shape.select('E|Z') - Edges parallel to Z axis
        Shape.select('V<<Z') - Vertex with smallest Z coordinate
        Shape.select('V<X=10') - Vertex with X coordinate smaller than 10

        subselect:
        
        Shape.select('F||top).select('V||front')

        add selections:

        Shape.select('F||top and F||front')

    How to add new selectors: 
    
    There is a configuration based scaffolding to easy parse the selectors. 
    Parsing selection strings is done in these phases:

    1. What are we looking for and how many: scan for target Shape (_setSelectionTargetShape)
        ex: F == Faces = return all Faces, Face = return first Face -

    2.  Which selector and parameters: _executeSelectString
        _executeSelectString contains all parsing logic and is the place where you add new selectors.
        !!!! IMPORTANT !!!! Parsing order of selector regular expressions is important: 
        Place the more complex ones first and simple ones (that might overlap with complex ones) later.

    3. Parsed selector and parameters are forwarded to specific selector method on Shape class as defined in _executeSelectString
        that returns the real Shapes or ShapeCollection based on number of results a selector is suppose to return

*/


export class Selector
{
    parentShape:Shape|ShapeCollection;
    selectString:string;
    lastSelection:Selection; // Used for sub-selections

    constructor(shape:Shape=null)
    {
        this.parentShape = shape;
    }

    /** Select Sub Shapes of a Shape by using a selection expression */
    select(s:string):ShapeCollection
    {
        this.selectString = s; // total string
        let selectStrings = this._splitSelectStrings(s); // for example: E|Z and E@X=10
        
        let selectedShapes = new ShapeCollection();
        
        selectStrings.forEach( str => 
        {
            let selection = this._executeSelectString(str);
            if(selection){
                selectedShapes.concat(selection);
            }
        });

        // for now always return a ShapeCollection - the individual selector methods in Shape take care of the real filtering
        return selectedShapes.distinct(); // make sure we don't have doubles (based on hash)
    }

    /** We allow multiple selections with keyword 'and' */
    _splitSelectStrings(selectString:string):Array<string>
    {
        const AND_SPLIT_SEPERATOR = /and/gi;

        return selectString.split(AND_SPLIT_SEPERATOR)
    }

    /** Scans string of selection for what we are looking for ~ the targetShape */
    _setSelectionTargetShape(selection:Selection)
    {
        const DEFAULT_SHAPE_TARGET = 'Vertex';
        const SHAPE_TARGETS:{[key:string]:SelectionShapeTargetSetting} = 
        {
            'V' : { targetShapeType: 'Vertex', ignoreCase: false },
            'E': { targetShapeType: 'Edge', ignoreCase: false},
            'W': { targetShapeType: 'Wire' },
            'F': { targetShapeType: 'Face' },
            'SH': { targetShapeType: 'Shell'},
            'S': { targetShapeType: 'Solid' },
        }

        for (const [shapeString,shapeTargetSetting] of Object.entries(SHAPE_TARGETS))
        {
            // test if our select string contains shape string
            
            let re = (shapeTargetSetting.ignoreCase) ? new RegExp(shapeString, 'i') : new RegExp(shapeString);
            
            if (selection.string.match(re))
            {
                selection.targetShape = shapeTargetSetting.targetShapeType;
                return selection; // exit
            }   
        }
        // default
        selection.targetShape = DEFAULT_SHAPE_TARGET;
        return selection;

    }

    _executeSelectString(selectString:string):ShapeCollection
    {
        /* !!!! NOTES ON THESE REGEX !!!!

             - order is important here: don't have simple ones like AXIS before SUBSHAPE (x precedes 'Box')
             - these regex are combined with the selector one in two groups (selectorRe)(paramsRe) so yielding matches: 
                [0] = whole match [1] selector [2] whole param match
             - the param match is taken seperately to get the individual params out and are input for operationalize
             - Double escape quotes!!

        */

        const BASIC_PARAMS = { 
            'SUBSHAPE' : { 
                re : '([a-z]+)', // !!!! These regex are combined with the one of the main selector - the resulting match also includes the selector part !!!!
                operationalize: (m) => m[0], // match[0] is entire match, then groups ( the first group is the selector part )
            },
            'AXISPLANES' : {
                re: '(xy|yz|xz|x|y|z)',
                operationalize: (m) => m[0],
            },
            'AXIS' : {
                re: '(x|y|z)',
                operationalize: (m) => m[0]?.toLowerCase(),
            },
            'SIDES' : {
                re: '([front|back|left|right|top|bottom]+)', // combinations of these words - we'll check later for specifics
                operationalize : (m) => m[0],
            },
            'POINTRANGE' : {
                // {{AXIS}}<10 - ex: X<10
                re: '(\\[([\\-\\d\\.]+)[\\s]*,([\\-\\d\\.]+)[\\-\\s]*,([\\-\\d\\.]+)\\](<=|>=|<|>|=)([\\-\\d\\.]+))', // NOTE: we need to capture groups for operationalize function
                operationalize: (m) => ({ point: [Number(m[2]), Number(m[3]), Number(m[4]) || 0], // make into SelectorPointRange
                                          operator: m[5],
                                          range: m[6],
                                        })
            },
            'AXISCOORD' : {
                // V@x=10 or with tolerance: V@x=10~1
                re: '(x|y|z)=([\\-\\d\\.]+)~?([\\d\\.]*)',
                operationalize: (m) => ({ axis: m[1].toLowerCase(), // make into SelectorAxisCoord
                                          coord: Number(m[2]),
                                          tolerance: (m[3] == '') ? 0 : Number(m[3]),
                                        })
            },
            'BBOX' : {
                // V@B[0,0,0][100,100,100]
                re: '\\[([^\\]]+)\\]\\[([^\\]]+)\\]', // capture the 2 points as strings 'x,y,z'
                operationalize: (m) => ({ from: m[1].split(',').map(n => Number(n)), // make into SelectorBbox
                                          to: m[2].split(',').map(n => Number(n)),
                                        })
            },
            'POINT' : { // Needs to be behind POINTRANGE
                re: '(\\[([\\-\\d\\.]+)[\\s]*,([\\-\\d\\.]+)[\\-\\s]*,([\\-\\d\\.]+)\\])', // NOTE: we need to capture groups for operationalize function
                operationalize: (m) => [Number(m[2]), Number(m[3]), Number(m[4]) || 0], // make into real array
            },
            'INDICES' :
            {
                // [0,2,1] or [1] or [1-3,2]
                // TODO: Add negative indices for length-1 ?
                re : '(([^\\]]+)\\])',
                operationalize: (m) => {
                    let indices = [];
                    let indexStatements = m[2].split(',');
                    if (indexStatements.length == 0)
                    {
                        return { indices: [] } as SelectorIndex
                    }
                    else 
                    {
                        indexStatements.forEach( s =>
                        {
                            if(s.includes('-')) // range
                            {
                                m = s.match('([0-9]+)-([0-9]+)');
                                if (m)
                                {
                                    let indicesRange = intRange(m[1],m[2]);
                                    indices = indices.concat(indicesRange);
                                }
                            }
                            else {
                                let d = parseInt(s);
                                if (!isNaN(d))
                                {
                                    indices.push(d);
                                }
                            }
                        })
                    }
                    let uniqueOrderedIndices = Array.from( new Set(indices.sort( (a,b) => a - b)));
                    return { indices: uniqueOrderedIndices } as SelectorIndex
                }
            }
        }

        // !!!! IMPORTANT: order matters here, simple ones last !!!!
        const SELECTORS:Array<SelectorSetting> = [
            {    
                testLong: 'side',
                testShort: '\\|\\|',
                params: ['SIDES'], // Set possible param types here
                worksOn: null, // All
                selectorMethod: '_selectorSide'
            },
            {
                testLong: 'inbbox',
                testShort: '@B',
                params: ['BBOX'],
                worksOn: null,
                selectorMethod: '_selectorInBbox'
            },
            {
                testLong: 'atcoord',
                testShort: '@',
                params: ['AXISCOORD'],
                worksOn: null,
                selectorMethod: '_selectorAtAxisCoord'
            },
            {    
                testLong: 'ofsubtype',
                testShort: ':',
                params: [ 'SUBSHAPE'],
                worksOn: [ 'Edge', 'Wire', 'Face', 'Solid'], 
                selectorMethod: '_selectorOfSubType'
            },
            {    
                testLong: 'closest',
                testShort: '<<\\->',
                params: ['POINT'],
                worksOn: null, // All
                selectorMethod: '_selectorClosestTo',
            },
            {    
                testLong: 'furthest',
                testShort: '<\\->>',
                params: ['POINT'],
                worksOn: null, // All
                selectorMethod: '_selectorFurthestTo',
            },
            {
                testLong: 'outer', // 0 or more
                testShort: '>>',
                params: [ 'AXIS'],
                worksOn: null, // All
                selectorMethod: '_selectorOuterAlongAxis'
            },
            {
                testLong: 'smallest', // zero or more
                testShort: '<<',
                params: [ 'AXIS'],
                worksOn: null, // All
                selectorMethod: '_selectorSmallestAlongAxis'
            },
            {    
                // example: F<->[0,0,0]<10 - TODO
                testLong: 'inrange', 
                testShort: '<\\->', // Don't put before <<->
                params: ['POINTRANGE'],
                worksOn: null, // All
                selectorMethod: '_selectorWithinRange'
            },
            {    
                testLong: 'positive',
                testShort: '\\+',
                params: [ 'AXIS'],
                worksOn: null, // All
                selectorMethod: '_selectorPositiveOnAxis'
            },
            {    
                testLong: 'negative',
                testShort: '\\-',
                params: [ 'AXIS'],
                worksOn: null, // All
                selectorMethod: '_selectorNegativeOnAxis'
            },
            {
                testLong: 'parallel',
                testShort: '\\|',
                params: ['AXIS','POINT'],
                worksOn: null,
                selectorMethod: '_selectorParallelTo'
            },
            { 
                // V[0,1,2] : NOTE: it's a bit open so keep this last
                testLong: 'index',
                testShort: '\\[',
                params: ['INDICES'],
                worksOn: null, // All
                selectorMethod: '_selectorIndex',
            },
        ];

        const TARGET_SHAPE_TO_METHOD = {
            'Vertex' : 'vertices',
            'Edge' : 'edges',
            'Wire' : 'wires',
            'Face' : 'faces',
            'Shell' : 'shells',
            'Solid' : 'solids',
        }

        // start interpretation of select string
        const selection:Selection = { string: selectString, targetShape: null, singleResult: false, paramValue:null, selectorMethod: null, selectedShapes: null };

        this._setSelectionTargetShape(selection); // set target Shape

        // Now scan for selectors - we assume there is only one!
        for( let c = 0;  c < SELECTORS.length; c++)
        {
            let selectorSetting = SELECTORS[c];

            let paramRes = selectorSetting.params.map(p => BASIC_PARAMS[p].re );
            
            // NOTE: case-insensitive regex! with 'i'
            let selectorsRe = new RegExp(`(${selectorSetting.testLong}|${selectorSetting.testShort})(${paramRes.join('|')})`, 'i'); // NOTE: we only choose the first match! so no 'g'
            let match = selection.string.match(selectorsRe);

            if (match) // we found a pattern that is selector
            {   
                // operationalize the real param
                let matchedParam = match[2]; // NOTE: is this robust? [0] = entire match, [1] = long or short version [2] = the parameters
                let paramNames = selectorSetting.params;

                let realParamValue = null;
                
                for (let p = 0; p < paramNames.length; p++)
                {
                    let paramName = paramNames[p];

                    let paramObj = BASIC_PARAMS[paramName];
                    let paramsMatch = matchedParam.match(new RegExp(paramObj.re, 'i'));

                    if (paramsMatch)
                    {
                        realParamValue = paramObj.operationalize(paramsMatch); // feed the match into a prefined parsing method        
                        break;
                    }
                }
                if (!realParamValue)
                {
                    console.warn(`Selector::_executeSelectString: Found selector "${selectorSetting.testLong}" but could not parse its params ${matchedParam}. Check if patterns ${paramRes} apply!`);
                    return null;
                }
                // specify selection with found selectors
                selection.selectorMethod = selectorSetting.selectorMethod; 
                selection.paramValue = realParamValue;
                break; // we found a selector: time to quit
            }
        }

        this.lastSelection = selection; // set current selection

        // execute selector and return Shapes
        if (!this.parentShape)
        {
            console.warn(`Selector::_executeSelectString: Not bound to Shape: cannot return any real Shapes!`);
            return null;
        }
        else { // really run the Shape selectors with the found parameters
            // first select parts of current Shape based on targetShape
            
            if (!this.parentShape[TARGET_SHAPE_TO_METHOD[selection.targetShape]])
            {
                console.error(`Selector::_executeSelectString: Could not get Shapes of type "${selection.targetShape}" from current Shape of type "${this.parentShape.type()}"`);
                return null;
            }

            let testShapes:ShapeCollection = this.parentShape[TARGET_SHAPE_TO_METHOD[selection.targetShape]](); // basically running subshape selection on current Shape
            
            if(!selection.selectorMethod || !this.parentShape[selection.selectorMethod])
            {
                throw new Error(`Selector::_executeSelectString: Could not find specific Selector. Check if you used a valid selector symbol (like ||,|) and given the type (V,E etc)!`);
            }
            else {
                // test conditionals and return results
                let selectedShapes = this.parentShape[selection.selectorMethod](testShapes, selection.paramValue);
                this.lastSelection.selectedShapes = selectedShapes; // save current selected Shapes - used for subselecting
                
                return selectedShapes
            }

        }


    }



}