/** Abstraction over native console
 *  To create extra categories and capture messages in WebWorker or Compute Worker
 */

import JSONfn from 'json-fn';

import { ConsoleMessage, ConsoleMessageType } from './types'

export class Console
{
    output = null; // Vuex store, console, webworker instance or a local array [ null ]
    buffer:Array<ConsoleMessage> = []; // If we cannot output somewhere put in buffer
    _originalConsole = null // avoid circular references 

    constructor(output:any)
    {
        this.connect(output);
        this.info(`**** INIT AY CONSOLE - MODE: ${this._getOutputType()} ****`);
        // this.component = curScope.prototype.name;
    }

    /** Binds either to Vuex store, WebWorker, direct console or an internal array */
    connect(output:any = null) 
    {
        this._originalConsole = console; // We can always use this to output directly to original console
        this.output = output;
    }

    /** Reset the Console, removing all previous messages */
    reset()
    {
        switch(this._getOutputType())
        {
            case 'store':
                this.output.commit('clearConsoleMessages');
                break;
            case 'buffer':
                this.buffer = [];
                break;
        }
    }

    _getOutputType():string
    {
        if( this.output.hasOwnProperty('commit'))
        {
            return 'store';
        }
        else if (this.output.hasOwnProperty('assert'))
        {
            return 'console';
        }
        else if (this.output.hasOwnProperty('postMessage'))
        {
            return 'webworker'
        }
        else
        {
            // internal storage of messages
            return 'buffer';
        }
    }

    /** pass the message allong */
    sendMessage(message:ConsoleMessage)
    {
        // directly output to console
        const MESSAGE_TO_CONSOLE_TYPE = { 
            info : 'info',
            geom : 'info',
            user : 'warn',
            warn : 'warn',
            error : 'error',
            exec : 'info',
        }

        switch(this._getOutputType())
        {
            case 'store':
                this.output.commit('pushConsoleMessage', message);
                break;

            case 'console':
                let origConsoleFunc = MESSAGE_TO_CONSOLE_TYPE[message.type] || 'log';
                try {
                    this._originalConsole[origConsoleFunc](message.message); // IMPORTANT: don't use output here, because it can lead to unending loops
                }
                catch(e) 
                {
                    console.error(`Console::sendMessage: Could not output data: ${message.message}: ${e}`);
                }
                break;

            case 'webworker':
                this.output.postMessage({ type : 'console', payload : {  message : message }});
                break;

            default: // put in buffer
                this.buffer.push(message);
                this._originalConsole[MESSAGE_TO_CONSOLE_TYPE[message.type] || 'log'](message.message); // also put into normal console for debug

        }
    }

    newMessage(type:ConsoleMessageType, message:any)
    {
        // NOTE: we allow in console mode to output non-strings - for example Objects
        
        //this._originalConsole.log(type, message, this._getOutputType()) // example of debug output

        let msgStr = (typeof message === 'string' || this._getOutputType() == 'console') ? message as any :  this.stringifyMessage(message);
        let newMessage:ConsoleMessage = { type: type, time : this._currentTime() , from: null, message : msgStr  };
        this.sendMessage(newMessage);
    }

    stringifyMessage(message:any):string
    {
        if (message === null || message === undefined)
        {
            return 'undefined';
        }
        
        // Use serialization methods toString of Shapes
        let serializatedObj = null;

        try
        {
           serializatedObj = message.toString();
        }
        catch(e)
        {
            console.warn(`Console.stringifyMessage: Could not simply stringify`)
        }
        
        if (!serializatedObj)
        {
            try {
                serializatedObj = JSONfn.stringify(message);
            }
            catch(e)
            {
                console.error(`stringifyMessage: Serious error exporting Object to JSON: ${e}`);
                return null;
            }
        }

        return serializatedObj;
    }

    info(message:any)
    {
        this.newMessage('info', message);
    }

    log(message:any)
    {
        this.newMessage('info', message);
    }

    /** Make a user message */
    user(message:any)
    {
        this.newMessage('user', message);
    }

    /** log an error */
    error(message:any)
    {
        this.newMessage('error', message);
    }

    warn(message:any)
    {
        this.newMessage('warn', message);
    }

    /** Creation of geometry */
    geom(message:any)
    {
        this.newMessage('geom', message);
    }

    /** Messages about statement execution */
    exec(message:any)
    {
        this.newMessage('exec', message);
    }

    _currentTime()
    {
        let t = new Date();
        return `${t.toLocaleTimeString()}.${t.getMilliseconds()}`;
    }

    getBufferedMessages(types?:any|Array<ConsoleMessageType>)
    {
        types = (Array.isArray(types) ? 
                    (types.length > 0) ? types : undefined 
                    : undefined)
        return (!types) ? this.buffer
                    : this.buffer.filter(m => types.includes(m.type))
    }

}