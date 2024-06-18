/**
 * CodeParser: 
 *      Parses code and uses information to give the user increasingly refined feedback on his code     
 *      !!!! Copy from App - TODO: clean up app part and use this one !!!!
 */

import { Parser, Options, Node } from 'acorn'
import { ScriptVersion, ImportStatement } from './models'
import { IO } from './IO'

interface PreStats
{
    numStatements: number;
}

interface StatementFilter
{
    pattern:string; // just a simple str
}


export class CodeParser
{   
    //// SETTINGS ////
    ACORN_OPTIONS:Options = {
        ecmaVersion: 6, 
        locations: true,
    }
    
    IMPORT_RE = /\$import\((\'|\")([^\'\"]+)\'[\s]*,[\s]*(\{[^\}]+\})/ 
    LOAD_RE = /\$load\((\'|\")([^\'\"]+)(\"|\')\)/;
    DOC_RE = /docs\s*\./;


    /* NOTES ON REGEX (TODO): 
        - will break in objects as param values { param: { x:1, y:2}}
        - will break with strings in params
    */

    //// PROPERTIES ////
    config:any = {}; // { endpoint_shared_scripts : url }
    code:string = null;
    io:IO = null;
    tree:any; // TODO: acorn typing
    statements:Array<Statement> = []; // seperated statements
    importStatements:Array<ImportStatement> = []; // reference to statements that are importStatements
    prestats:PreStats = null;
    importedScriptCache:{[key:string]:ScriptVersion} = {}; // { file_name : ScriptVersion }
    importedScriptQueue:Array<ImportStatement> = []; // queue when loading import scripts

    constructor(code:string, config: any, io:IO) // TODO: TS typing
    {
        this.code = code;
        this.config = config;
        this.io = io;
        this.parse();
    }

    update(code:string, config:any = null)
    {
        this.code = code;
        this.config = (!config) ? this.config : config;
        this.parse();
    }

    /** Split as best as possible into seperate statements to be executed */
    parse()
    {
        try { 
            this.tree = Parser.parse(this.code, this.ACORN_OPTIONS)
            this.makeStatements();
            this.filterStatements();
            this.removeDeclarations();
        }
        catch(e)
        {
            // move Error up to GeomWorker
            throw new Error(`${e}`);   
        }

    }

    /** Create Statements from AST tree */
    makeStatements():Array<Statement>
    {
        const EXCLUDE_NODE_TYPES = ['EmptyStatement'];

        this.statements = []; // reset statements

        this.tree.body.forEach(
            node => 
            {
                // We have a valid Statement Node
                if(!EXCLUDE_NODE_TYPES.includes(node.type))
                {
                    let statement:Statement = { 
                        startIndex: node.start, 
                        endIndex: node.end, 
                        lineStart: node.loc.start.line,
                        lineEnd: node.loc.end.line,
                        columnStartIndex: node.loc.start.column,
                        columnEndIndex: node.loc.end.column,
                        code: this.getCodeOfNode(node)
                       }
                    this.statements.push(statement)
                }
            }
        )

        return this.statements;
    }

    getCodeOfNode(node:Node):string
    {
        if (node)
        {
            return this.code.substring(node.start, node.end);
        }
    }
    
    /** Filter statement on a given filters */
    filterStatements()
    {
        const FILTERS:Array<StatementFilter> = [
            // { pattern: '\n', operation: (statement) => statement.trim().replace('\n', '') }, // clean new lines and spaces
            { pattern: 'Geom()' }, // filter out the geom init code
        ];

        this.statements = this.statements.filter( s => !FILTERS.some(f => s.code.includes(f.pattern) ) )
    }

    removeDeclarations()
    {
        const declarations = ['let', 'var', 'const'];

        declarations.forEach( declarationCode => 
        {
            let regex = new RegExp(`(^| )${declarationCode}(?= |=)`, 'g');
            this.statements.forEach( statement =>
            {
                statement.code = statement.code.replace(regex, ''); 
            })
        });  
    } 

    addComponentCodeDeclarations(componentCode:string):string
    {
        // Parse code to AST tree using acorn
        // We are looking for Expression Statement on Variables that are not declared on local scope, thus probably overriding global variables 
        const NODE_TYPES = ['VariableDeclaration', 'ExpressionStatement'];

        let componentTree = Parser.parse(componentCode, this.ACORN_OPTIONS);
        let localVariables:Array<string> = [];
        let codeMutations:Array<any> = [];
        
        // ANY TO AVOID TS ERRORS
        (componentTree as any).body.forEach(
            node => {
                if(NODE_TYPES.includes(node.type))
                {
                    if(node.type === 'VariableDeclaration')
                    {
                        // keep track of local variable declarations
                        localVariables = localVariables.concat(node.declarations.map( n => n.id.name));
                    }
                    else if(node.type === 'ExpressionStatement')
                    {
                        // check if expression is on variable not defined locally
                        let variableName = node.expression.left?.name;
                        if (variableName && !localVariables.includes(variableName))
                        {
                            // We got a assignment to a non-local variable
                            // Add let to variable
                            let origStatement = componentCode.substring(node.start, node.end);
                            let newStatement = `let ${origStatement}`;
                            codeMutations.push({ start: node.start, end: node.end, content: newStatement  })        
                        }
                    }
                    
                }
            });

        // now execute mutations on the code (and keep track of increase in indices)
        let charIndexInc = 0;
        const origComponentCode = componentCode;
        codeMutations.forEach(mutation =>
        {   
            componentCode = componentCode.substring(0,mutation.start+charIndexInc) + mutation.content + componentCode.substring(mutation.end+charIndexInc);
            charIndexInc = componentCode.length - origComponentCode.length;
        });

        return componentCode;
    }

    /** Preload special statements like $import and $load which need to fetch data */
    async preloadSpecialStatements()
    {
        // For reasons of async we create a queue system
        for (let s = 0; s < this.statements.length; s++)
        {
            let curStatement = this.statements[s];


            if(this.isImportStatement(curStatement))
            {
                let importStatement = this.parseImportStatement(curStatement);

                if(importStatement)
                {
                    this.importStatements.push(importStatement); // save references to import statements
                    let importedScript = await this.fetchImportScript(importStatement);
                    this.transformImportStatement(importStatement, importedScript);
                }
                else {
                    console.error(`CodeParser::transformImports: Could not parse import statement: "${curStatement}"`)
                }
            }
            else if (this.isLoadStatement(curStatement))
            {
                // load the source with io
                let loadStatement = curStatement.code.match(this.LOAD_RE);

                if (loadStatement)
                {
                    let source = loadStatement[2];
                    if (source)
                    {
                        await this.io.load(source); // put in cache
                    }
                }
            }
        }

        return this.statements; // return all statements
    }

    transformImportStatement(importStatement:ImportStatement, importedScript:ScriptVersion)
    {
        // ImportStatement contains: code, name, versionTag, paramValues and the original statement
        // We need to alter that original statement and replace its code with the real code from imported script
      
        if (!importedScript)
        {
            // !!!! TODO ERROR MESSAGE !!!!
            console.error(`CodeParser::transformImportStatement: Cannot find import script "${importStatement.name}"`)
        }
        else 
        {
            // transform import statement into real code
            let code = this._generateImportedScriptRealCode(importedScript, importStatement);
            importStatement.statement.code = code; // replace code
        }
    }


    parseImportStatement(statement:Statement):ImportStatement
    {
        let m = statement.code.match(this.IMPORT_RE);
        
        if (!m)
        {
            console.error('CodeParser::parseImportStatement: Error in import statement!')
            // !!!! TODO ERROR MESSAGE !!!!
            return null;
        }

        try
        {
            let n = m[2].split(':')[0];
            let userName = n.split('/')[0];
            let name = n.split('/')[1];
            let tag = m[2].split(':')[1];
            // TODO: String parameters
            let jsonParams = (m[3]) ? m[3].replace('{', '{"').replace(/}/g,'"}').replace(/\:/g, '":"').replace(/,/g, '","') : ''; 
            
            let params = {};
            if (jsonParams)
            {
                try {
                    params = JSON.parse(jsonParams) as any; 
                }
                catch(e)
                {
                    console.error('parseImportStatement: Cannot parse params');
                    params = {};
                }
            }
            
            let importStatement:ImportStatement = {
                code: statement.code,
                userName: userName,
                name: name,
                versionTag: tag,
                paramValues: params,
                statement: statement, // reference to original statement
            }

            return importStatement;
        }
        catch(e)
        {
            // !!!! TODO: show failed import component 
            console.error(e);
            return null;
        }

    }

    /** Fetch component from cache or from servers */
    async fetchImportScript(importStatement:ImportStatement):Promise<ScriptVersion> // TODO: TS promise of ScriptVersion
    {
        // place in queue
        this.importedScriptQueue.push(importStatement);

        // script is already in cache
        if (await this.getImportScriptFromCache(importStatement.name) != null)
        {
            let script = await this.getImportScriptFromCache(importStatement.name);
            await this.handleFetchedImportScript(script);

            return script;
        }
        else 
        { // script is not in cache
            let url = `${this.config.API_URL}/${this.config.API_URL_SHARED_SCRIPT_NAME_AND_TAG}/${importStatement.userName}/${importStatement.name}:${importStatement.versionTag || 'latest'}`

            try
            {
                let r = await fetch(url, { 
                    method : 'GET',
                    headers: {
                        'Content-type': 'application/json',
                    },
                })

                let script = await this.handleFetchedImportScript(r);
                return script
            }
            catch(e)
            {
                this.handleFetchedImportScriptError(importStatement)
                return null;
            }
            
        }
            
    }

    async handleFetchedImportScript(response:any):Promise<ScriptVersion> // can be ScriptVersion or fetch response
    {
        let script:ScriptVersion = (response.json) ? (await response.json()).data as ScriptVersion : response as ScriptVersion; // NOTE: json() return another promise
        
        this.placeImportScriptInCache(script);
        this.manageImportScriptQueue();

        return script;
    }

    handleFetchedImportScriptError(importStatement:ImportStatement)
    {
        console.error(`CodeParser::handleFetchedImportScriptError: Import "${importStatement}" failed`);
        this.manageImportScriptQueue();
    }

    manageImportScriptQueue()
    {
        // pop one of the queue
        this.importedScriptQueue.pop();

        if (this.importedScriptQueue.length == 0)
        {
            console.info('CodeParser::checkImportScriptQueueDone: All import components loaded!')
        }
    }

    placeImportScriptInCache(script:ScriptVersion)
    {
        console.info(`CodeParser::placeImportScriptInCache: Succesfully places imported script in cache: "${script.file_name}"`);
        this.importedScriptCache[script.file_name] = script; // place in cache
    }

    /** Get import script from cache */
    async getImportScriptFromCache(name:string):Promise<ScriptVersion>
    {
        console.info(`CodeParser::getImportScriptFromCache: Fetching import script from cache: "${name}"`)
        // to have it consistent with fetch we return a promise
        let promise = new Promise((resolve, reject) => {
            resolve(this.importedScriptCache[name]);
        });

        return promise as any; // avoid TS error
    }

    /** Test is a given statement is a import statement */
    isImportStatement(statement:Statement):boolean
    {
        return statement.code.match(this.IMPORT_RE) !== null
    }

    isLoadStatement(statement:Statement):boolean
    {
        return statement.code.match(this.LOAD_RE) !== null;
    }
    
    isDocStatement(statement:Statement):boolean
    {
        return statement.code.match(this.DOC_RE) !== null
    }

    /** Output statements */
    async getStatements():Promise<Array<Statement>>
    {
        let statements = await this.preloadSpecialStatements(); // this takes a bit of time because of loading of components
        let promise = new Promise((resolve, reject) => 
        {
            resolve(statements);
        });

        return promise as Promise<Array<Statement>>;

    }

    /** Synchronous call to get statement without importing components */
    getStatementsWithoutImports():Array<Statement>
    {
        return this.statements;
    }

    _generateImportedScriptRealCode(importedScript:ScriptVersion, importStatement:ImportStatement)
    {
        let code = importedScript.code;

        code = this.addComponentCodeDeclarations(code); // make sure we have local assignments

        // clean geom references
        code = code.replace(/^[^g]+geom[\s]*=[\s]*new Geom()[^\n]+\n/, '') // replace creation of geom (if any)
        
        let codeParamsStr = '';
        if (importStatement.paramValues)
        {
            for (const [key,value] of Object.entries(importStatement.paramValues))
            {
                codeParamsStr += `let $${key} = ${value};\n`;
            }
        }

        let componentCode = `
        function $import(name, params)
        {
            // We use a layergroup to collect all incoming layers inside a parent layer
            let layerGroup = geom.layerGroup('${importStatement.name}');
            ${codeParamsStr}
            ${code}
            geom.endLayerGroup();
            // TODO: Fix objects that stay in scenegraph in layerGroup (even if they are hidden)
            let importedShapes = layerGroup.allShapesCollection(); 
            return importedShapes;
        }
        ${importStatement.code} // we can actually keep original import statement`

        return componentCode;
    }


}