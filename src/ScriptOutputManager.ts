/** 
 *  ScriptOutputManager.ts
 * 
 *  Archiyou allows granular control over what the user might need from the script
 *  This is essential for complicated parametric models and assemblies
 * 
 *  Script execution and outputs are organized as follows:
 *  - Every script has one or more pipelines: These are basically functions with some management on top.
 *      - One can define a pipeline with:
 *        pipeline(<name>, <function>); See Geom.pipeline and Pipeline class
 *      - If there is no implicit pipeline defined we call that the default pipeline, which is always run
 *      - Any non-default pipelines are only run on request from the user
 * 
 *  Outputs are organized primary based on the pipelines. Every pipeline outputs the following categories.
 *   There is always only one model (which is the active Scene) but these categories have multiple entities with unique names.
 *   Any entity can be outputted in different formats (with format options). This is an overview:
 * 
 *  - model
 *      - formats: buffer(for editor viewer), glb, step, stl, svg (More are coming!)
 *  - metrics
 *      - formats: json, xlsx (...)
 *  - tables
 *      - formats: json, xlsx (...)
 *  - docs
 *      - formats: pdf (...)
 * 
 *  For requesting a specific output we use output paths (a bit like urls): 
 * 
 *  {pipeline}/{category}/?<entity>/{format}?{format options}
 * 
 *  So for example:
 *   - default/model/glb?data=true - run default pipeline and export scene as GLTF binary while exporting extra data
 *   - cnc/model/dxf?flatten
 *   - default/metrics/internal - internal are the rawPath internal values (used for in-scope communition)
 *   - default/tables/parts/xlsx
 *   - default/docs/spec/pdf
 *  
 *  Wildcards * are also possible:
*/    
//   - default/metrics/*/xlsx
//   - default/docs/*/pdf
//   - default/tables/*/xsl
//   - default/*  - everything of default pipeline in all available formats
//   - *  - everything (if user is allowed)
 /*
 *  We process output requests based on the above paths.
 *   1. Any wildcards are resolved (using a script meta property containing the available pipelines, metrics, tables and docs )
 *   2. All the requested data is extracted from the execution scope (see Runner.ts)
 *
 */

 import { ScriptOutputPath, isScriptOutputPathData } from './internal'
 import type { ScriptOutputCategory, ScriptOutputFormatModel, ScriptOutputFormatMetric,
            ScriptOutputFormatTable, ScriptOutputFormatDoc, ScriptMeta,
            RunnerScriptExecutionRequest,
            RunnerScriptExecutionResult, 
  } from './internal'


 export class ScriptOutputManager
 {
    requestedOutputPaths: Array<ScriptOutputPath> = [] // unresolved output requests paths
    resolvedOutputsPaths: Array<ScriptOutputPath> = []  // resolved output requests paths

    constructor()
    {
        
    }

    /** Load incoming request that contains output request paths 
     *  Any warnings will be places inside result.warnings
     *  @returns number of valid (resolved) output paths generated 
    */
    public loadRequest(request:RunnerScriptExecutionRequest, result?:RunnerScriptExecutionResult, resolve:boolean=true):this
    {
        const requestedOutputPaths = Array.isArray(request.outputs) ? request.outputs : [];
        if(requestedOutputPaths.length === 0)
        { 
            console.warn(`ScriptOutputManager::loadRequest(): Request has no output paths!`);
            return this;
        }
        requestedOutputPaths.forEach( (path) => 
        {
            const output = new ScriptOutputPath(path);
            if(output.valid)
            {
                this.requestedOutputPaths.push(output);
            }
            else 
            {
                const warningMsg = `ScriptOutputManager::loadRequest(): Ignoring invalid output path: "${path}"`;
                
                console.warn(warningMsg);
                // Only add warning on result object if given
                if(result)
                {
                    if(!result.warnings) result.warnings = [];
                    result.warnings.push(warningMsg);
                }
            }
        });

        if(!resolve)
        {
            // Don't resolve, just copy requested to resolved
            // This is used to get outputs from components, where wildcards for entities are not needed
            // Because everything is exported
            this.resolvedOutputsPaths = this.requestedOutputPaths.map(p => p.internalize());
            return this;
        }
        else {
            // Resolve wildcards in the requested outputs
            this.resolvedOutputsPaths = []; // reset
            const meta = result?.meta || {} as ScriptMeta;
            this.requestedOutputPaths.forEach( (output) => 
            {
                const { resolved, warnings } = output.resolveVerbose(meta);
                this.resolvedOutputsPaths.push(...resolved); // resolving can return multiple paths
                
                // Any warnings (like invalid entity names) are placed in result.warnings
                if(result)
                {
                    if(!result.warnings) result.warnings = [];
                    result.warnings.push(...warnings);
                }
            });
        }
       

        return this;
    }

    /** If we want to manage outputs of a execution result without resolving paths 
     * This also ties outputs to the path objects for easy access
    */
    public fromResult(result:RunnerScriptExecutionResult):this
    {
        this.requestedOutputPaths = [];
        this.resolvedOutputsPaths = [];

        if(!result && typeof result !== 'object'){ throw new Error(`ScriptOutputManager::fromResult(): Invalid result object!`)};

        if(result?.outputs && Array.isArray(result.outputs))
        {
            result.outputs.forEach(
                (out) => 
                {
                    if(isScriptOutputPathData(out.path))
                    {
                        const outputPathObj = new ScriptOutputPath().fromData(out.path);
                        if(outputPathObj)
                        {
                            outputPathObj.setOutputData(out.output); // tie output data to path object
                            this.resolvedOutputsPaths.push(outputPathObj);
                        }
                    }
                });
            console.info(`ScriptOutputManager::fromResult: Loaded ${this.resolvedOutputsPaths.length} output paths from result: "${this.resolvedOutputsPaths.map(o => o.resolvedPath).join(', ')}"`);
        }

        return this;
    }
        
    //// GET RESULTS FROM PARSED OUTPUTS ////

    public getPipelines():Array<string>
    {
        return Array.from(new Set(this.resolvedOutputsPaths.map(o => o.pipeline)));
    }

    public getOutputsByPipeline(pipeline:string):Array<ScriptOutputPath>
    {
        return this.resolvedOutputsPaths.filter(o => o.pipeline === pipeline);
    }
    
    public getOutputsByPipelineCategory(pipeline:string, category:ScriptOutputCategory):Array<ScriptOutputPath>
    {
        return this.resolvedOutputsPaths.filter(o => o.pipeline === pipeline && o.category === category);
    }

    public getOutputsByPipelineEntityFormats(pipeline:string, category:ScriptOutputCategory, formats:Array<string>):Array<ScriptOutputPath>
    {
        return this.resolvedOutputsPaths.filter(o => o.pipeline === pipeline && o.category === category && formats.includes(o.format as string) );
    }


 }



