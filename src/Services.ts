/**
 * 
 *  API Wrapper for Archiyou services
 *  
 *  - conversion between different data formats
 *  - TODO: more
 */

/** API wrapper for Archiyou services */
export class Services 
{
    private _baseUrl: string;
    private _timeout: number;
    private _headers: Record<string, string>;
    
    private _nodeFormDataModule: any;
    private _nodeFormFetchModule: any;

    constructor(baseUrl: string = 'http://localhost:3000/', timeout: number = 30000) {
        this._baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
        this._timeout = timeout;
        this._headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'Archiyou-Services/1.0'
        };
    }

    /** Set authentication token */
    setAuthToken(token: string): this {
        this._headers['Authorization'] = `Bearer ${token}`;
        return this;
    }

    /** Set custom headers */
    setHeaders(headers: Record<string, string>): this {
        this._headers = { ...this._headers, ...headers };
        return this;
    }

    /** Check if the API service is up and running */
    async isUp(): Promise<boolean> {
        try {
            await this._request<ServiceHealthResponse>('/')
            return true;
        } 
        catch (error) 
        {
            console.warn(`Services::isUp(): Can't reach service at ${this._baseUrl}: ${error}`);
            return false;
        }
    }

    //// CONVERSION ////

    async getConversionFormats(): Promise<Array<ServiceConvertFormat>> 
    {
        const data = await this._request<{ formats: Array<ServiceConvertFormat> }>('/convert/formats');
        return data.formats;
    }

    /** Convert data from one format to another */
    async convert(data: ArrayBuffer|string, fromExt:string, toExt:string): Promise<ServiceConvertResponse> 
    {
        const startTime = Date.now();
        
        try {
            // Send data based on type
            let response: ArrayBuffer;
            if (data instanceof ArrayBuffer) 
            {
                // For binary data, send as multipart
                response = await this._uploadAndConvert(data, fromExt, toExt);
            } 
            else {
                // For text data, include in JSON payload
                const fullPayload = { data: data, from_ext: fromExt, to_ext: toExt };
                response = await this._request<ArrayBuffer>('/convert', 'POST', fullPayload, 'arrayBuffer');
            }

            const r = {
                success: true,
                data: response,
                metadata: {
                    originalSize: data instanceof ArrayBuffer ? data.byteLength : data?.length,
                    convertedSize: response.byteLength,
                    processingTime: Date.now() - startTime
                }
            };

            console.info(`Services::convert(): Conversion ${fromExt} [${Math.round(r.metadata?.originalSize/1000)}kb] → ${toExt} [${Math.round(r.metadata?.convertedSize/1000)}kb] successful in ${r.metadata?.processingTime}ms`);     
            return r;
        } 
        catch (error: any) 
        {
            const processingTime = Date.now() - startTime;
            
            return {
                success: false,
                error: error.message,
                metadata: {
                    originalSize: data instanceof ArrayBuffer ? data.byteLength : data.length,
                    convertedSize: 0,
                    processingTime: Date.now() - startTime
                }
            };
        }
    }

    isNode(): boolean {
        return (typeof process !== 'undefined') && (process.release?.name === 'node');
    }

    /** Upload binary data for conversion - works in both Node.js and browser */
    private async _uploadAndConvert(data: ArrayBuffer, fromExt: string, toExt: string): Promise<ArrayBuffer> 
    {
        if (this.isNode())
        {
            return this._uploadAndConvertNode(data, fromExt, toExt);
        } else {
            return this._uploadAndConvertBrowser(data, fromExt, toExt);
        }
    }

    private async _loadNodeModules(): Promise<any> 
    {
        try {
            if (!this._nodeFormDataModule)
            {
                this._nodeFormDataModule = (await import('form-data'))?.default;
            }
            if(!this._nodeFormFetchModule)
            {
                this._nodeFormFetchModule = (await import('node-fetch'))?.default;
            }
        } catch (error) {
            throw new Error(`Failed to load Node.js modules 'form-data' or 'node-fetch'. Make sure they are installed. Error: ${error}`);
        }

    }

    /** Node.js multipart upload */
    private async _uploadAndConvertNode(data: ArrayBuffer, fromExt: string, toExt: string): Promise<ArrayBuffer> 
    {
        console.info(`Services::_uploadAndConvertNode(): Using Node.js environment`);
        await this._loadNodeModules();

        const formData = new this._nodeFormDataModule();
        const buffer = Buffer.from(data);
        
        formData.append('file', buffer, {
            filename: `input.${fromExt}`,
            contentType: 'application/octet-stream'
        });
        formData.append('from_ext', fromExt);
        formData.append('to_ext', toExt);

        console.log('📤 Node.js FormData upload with node-fetch');

        const fetch = this._nodeFormFetchModule;

        const response = await fetch(`${this._baseUrl}/convert`, {
            method: 'POST',
            body: formData,
            headers: {
                ...formData.getHeaders(), // This is the key - proper headers with boundary
                ...(this._headers['Authorization'] && { 'Authorization': this._headers['Authorization'] }),
            },
        });
        
        if (!response.ok) 
        {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        return await response.arrayBuffer();
    }

    /** Browser multipart upload */
    private async _uploadAndConvertBrowser(data: ArrayBuffer, fromExt: string, toExt: string): Promise<ArrayBuffer> 
    {
        const formData = new FormData();
        
        formData.append('file', new Blob([data], { type: 'application/octet-stream' }), `input.${fromExt}`);
        formData.append('from_ext', fromExt);
        formData.append('to_ext', toExt);

        const config: RequestInit = {
            method: 'POST',
            body: formData,
            headers: {
                // Browser: Don't set Content-Type, let browser handle multipart boundary
                ...(this._headers['Authorization'] && { 'Authorization': this._headers['Authorization'] }),
                'User-Agent': this._headers['User-Agent']
            },
            signal: AbortSignal.timeout(this._timeout),
        };

        const response = await fetch(`${this._baseUrl}/convert`, config);
        
        if (!response.ok) 
        {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        return await response.arrayBuffer();
    }

    /** Get available conversion formats */
    async getSupportedFormats(): Promise<{ input: string[], output: string[] }> 
    {
        return await this._request<{ input: string[], output: string[] }>('/convert/formats');
    }


    //// BASE ////

    /** Make HTTP request with error handling */
    private async _request<T>(
        endpoint: string, 
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
        body?: any,
        responseType: 'json' | 'arrayBuffer' = 'json'
    ): Promise<T> {
        const url = `${this._baseUrl}${endpoint}`;
        
        const config: RequestInit = {
            method,
            headers: this._headers,
            signal: AbortSignal.timeout(this._timeout),
        };

        if (body) {
            if (body instanceof ArrayBuffer) {
                config.body = body;
                config.headers = { ...this._headers, 'Content-Type': 'application/octet-stream' };
            } else if (typeof body === 'string') {
                config.body = body;
                config.headers = { ...this._headers, 'Content-Type': 'text/plain' };
            } else {
                config.body = JSON.stringify(body);
            }
        }

        try {
            console.log(`🌐 API Request: ${method} ${url}`);
            
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            if (responseType === 'arrayBuffer') {
                return await response.arrayBuffer() as T;
            }
            
            return await response.json() as T;
        } 
        catch (error: any) 
        {
            console.error(`❌ API Error: ${method} ${url}`, error.message);
            
            if (error.name === 'AbortError') {
                throw new Error(`Request timeout after ${this._timeout}ms`);
            }
            
            throw error;
        }
    }
}


//// TYPES ////

export interface ServiceConvertFormat 
{
    name: string;
    ext: string; // primary
    description?: string;
    importable: boolean;
    exportable: boolean;
    tool: 'assimp'|'gdal'; // TODO: more
}

export interface ServiceConvertRequest {
    data: ArrayBuffer | string;
    fromFormat: string; // extension
    toFormat: string; // extension
}

export interface ServiceConvertResponse {
    success: boolean;
    data?: ArrayBuffer;
    error?: string;
    metadata?: {
        originalSize: number;
        convertedSize: number;
        processingTime: number;
    };
}

export interface ServiceHealthResponse {
    message: string;
}


