/**
 *  RunnerOps.ts
 *   Class for some common operations
 * 
 */

import * as fs from 'fs';
import * as path from 'path';


export class RunnerOps
{
    constructor()
    {
        
    }

    /**
     * Saves a Blob to the local file system.
     * @param blob - The Blob to save.
     * @param filePath - The path where the file should be saved.
     */
    async saveBlobToFile(blob: Blob, filePath: string, overwrite:boolean=true): Promise<void> 
    {
        // Convert the Blob to a Buffer
        const arrayBuffer = await blob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Ensure the directory exists
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Check if the file exists and handle overwrite flag
        if (fs.existsSync(filePath) && !overwrite) {
            console.warn(`saveBlobToFile::saveBlobToFile(): File already exists at ${filePath} and overwrite is set to false. Skipping save.`);
            return;
        }


        // Write the buffer to the file
        fs.writeFileSync(filePath, buffer);
        
        console.info(`File saved to ${filePath}`);
    }
}
