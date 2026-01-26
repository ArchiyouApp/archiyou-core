/**
 *  workerUtils.ts
 *    Defining workers - from WebWorkers to Node JS workers often use the same functions
 *    These are bundled here
 */

import { ShapeCollection, Vector, Point, Bbox, Vertex, Edge, Wire, Face, Shell, Solid } from './internal';
import { BREP_METHODS_INTO_GLOBAL } from './internal' // constants.ts

 /** Setup the scope for execution. See also archiyou-app/GeomWorker.ts */
 export function makeShapeGlobals(oc:any, scope:any)
 {
     if(oc)
     {
         scope.Vector = Vector;
         scope.Point = Point;
         scope.Bbox = Bbox;
         scope.Edge = Edge;
         scope.Vertex = Vertex;
         scope.Wire = Wire;
         scope.Face = Face;
         scope.Shell = Shell;
         scope.Solid = Solid;
         scope.ShapeCollection = ShapeCollection;
     }
 }

 export function makeGeomMethodsGlobals(scope:any)
 {
     BREP_METHODS_INTO_GLOBAL.forEach(methodName => {
         let method = scope.brep[methodName];
         if (!method)
         {
             console.warn(`Could not find ${methodName} in Brep class. Check config: BREP_METHODS_INTO_GLOBAL`);
         }
         else {
             // avoid overwriting
             if (!scope[methodName])
             {
                scope[methodName] = method.bind(scope.brep);
             }
             scope[methodName.toLowerCase()] = method.bind(scope.brep);
         }
     })
 }

export function setParamVariables(scope:any, params:{[key:string]:any}) // { param1 : val, ... }
{
    const PARAM_SIGNIFIER = '$';
    
    if (typeof params === 'object')
    {
        for (const [name, value] of Object.entries(params) )
        {
            scope[PARAM_SIGNIFIER + name] = value;
        }
    }
}

export function clearParamVariables(scope:any, params?:{[key:string]:any})
{
    const PARAM_SIGNIFIER = '$';

    if (typeof params === 'object')
    {
        for (const [name, value] of Object.entries(params) )
        {
            if(scope[PARAM_SIGNIFIER + name])
            {
                delete scope[PARAM_SIGNIFIER + name];
            }
        }
    }
}
