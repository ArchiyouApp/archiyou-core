/**
 *  RunnerOps.ts
 *   Class for some common operations
 * 
 */

export class RunnerOps
{
    constructor()
    {
        
    }

    /**
     * Saves a Blob, ArrayBuffer, Uint8Array, or string to the local file system.
     * @param data - The data to save (Blob, ArrayBuffer, Uint8Array, or string).
     * @param filePath - The path where the file should be saved.
     * @param overwrite - Whether to overwrite existing files (default: true).
     */
    async saveBlobToFile(data: Blob|ArrayBuffer|Uint8Array|string, filePath: string, overwrite:boolean=true): Promise<string|undefined> 
    {
        console.info(`saveBlobToFile::saveBlobToFile(): Saving data to ${filePath}`);

        // Avoid problems in browser contexts
        const FS_LIB = 'fs'; // avoid problems with older build systems preparsing import(..) statements
        const PATH_LIB = 'path'
        const fs  = (await import(FS_LIB))?.default;
        const path = (await import(PATH_LIB))?.default;
        
        let buffer: Buffer | string;     

        if(typeof data === 'string')
        {
            // Handle text content - write directly as string
            buffer = data;
        }
        else if(data instanceof Blob)
        {
            // Convert the Blob to a Buffer
            const arrayBuffer = await data.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
        }
        else if(data instanceof ArrayBuffer || data instanceof Uint8Array)
        {
            // Convert the ArrayBuffer to a Buffer
            buffer = Buffer.from(data as any);
        }
        else
        {
            throw new Error('saveBlobToFile::saveBlobToFile(): Unsupported data type. Expected Blob, ArrayBuffer, Uint8Array, or string.');
        }

        // Ensure the directory exists
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Check if the file exists and handle overwrite flag
        if (fs.existsSync(filePath) && !overwrite)
        {
            console.warn(`saveBlobToFile::saveBlobToFile(): File already exists at ${filePath} and overwrite is set to false. Skipping save.`);
            return;
        }

        // Write the buffer/string to the file
        // Node.js fs.writeFileSync handles both Buffer and string automatically
        fs.writeFileSync(filePath, buffer, typeof data === 'string' ? 'utf8' : undefined);

        const fullPath = path.resolve(filePath);
        console.info(`RunnerOps::saveBlobToFile(): File saved to ${fullPath}`);

        return fullPath;
    }
}
