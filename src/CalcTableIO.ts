/**
 *  CalcTableIO.ts
 *
 *   Export calculation table data to various formats and platforms like Excel and Google Sheets
 *   
 *   NOTE: For now Excel is at Table.exportExcel()
 *   
 *   Setup:
 *    
 *    Google Sheets:
 *    - Create service account credential JSON and supply local path to table IO
 *    - Create a shared drive and create a folder in it for the sheets to be created in
 *    - Please setup the following subfolders: db, exports
 *    
 * 
 *     
 */

import { Table } from "./internal";

import type { drive_v3, sheets_v4 } from "googleapis";
import type { GoogleSpreadsheet, GoogleSpreadsheetCell } from "google-spreadsheet";  // Docs: https://theoephraim.github.io/node-google-spreadsheet/

//// LOCAL TYPES ////
type GoogleDriveFile = drive_v3.Schema$File;
type GoogleDriveItem = GoogleDriveFile & { type: 'folder' | 'file' };
type GoogleWorkspaceExportFormat = 'text'|'csv'|'html'|'xlsx'|'pdf'|'docx'|'pptx'|'odt'|'ods'|'odp'|'rtf';
type GoogleSheetNamedRange = sheets_v4.Schema$NamedRange;

export class TableIO
{
    //// SETTINGS ////
    GOOGLE_KEYFILE_PATH = './secrets/archiyoudb-f474df5307aa.json' // defaults path to google API credentials - relative to main script
    // NOTE: Set root Google Drive folder ID in env GOOGLE_DRIVE_ROOT_ID
    FORMULA_IMPORTRANGE = /IMPORTRANGE\(\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\)/i;
    GOOGLE_SHEETS_BASE_URL = 'https://docs.google.com/spreadsheets/d/';

    //// END SETTINGS ////

    _table:Table;
    // google modules
    _googleModule:any; // Google module - will be dynamically loaded
    _googleSpreadsheetModule:any; // Google Spreadsheet module: will be dynamically loaded
    _googleAuth:any; // Google auth module
    _googleDriveId:string; // Google Drive folder ID to create files in

    constructor(table?:Table)
    {
        this._table = table;
    }

    //// EXCEL ////

    /** Export table to Excel format */
    async exportExcel(table:Table):Promise<ArrayBuffer>
    {
        // Use table method for now
        return table.toExcel();
    }

    //// GOOGLE SHEETS ////

    async exportGoogleSheets(table:Table, email:string, key:string):Promise<void>
    {


    }
    
    //// GENERAL GOOGLE DRIVER OPERATIONS ////

    /** Load Google module and authenticate  */
    async initGoogle(keyfilePath?:string, driveId?:string):Promise<this>
    {
        keyfilePath = keyfilePath || this.GOOGLE_KEYFILE_PATH; // defaults
        driveId = driveId || process.env.GOOGLE_DRIVE_FOLDER_ID;

        console.info(`TableIO::initGoogle(): Initializing Google Sheets API and connecting with keyfile (${keyfilePath}) and driveId=${driveId}...`);

        if(!keyfilePath || typeof keyfilePath !== 'string'){ throw new Error('Google Sheets key file path is required for authentication. Normally this is a keyfile in accessable from main script directory!'); }
        if(!driveId || typeof driveId !== 'string'){ throw new Error('Google Drive ID is required to create Sheets in. Set env var GOOGLE_DRIVE_ROOT_ID'); }

        this._googleDriveId = driveId;

        // Dynamically load to avoid to have it always. If you want to use it, make sure to install googleapis package
        const GOOGLE_LIB = 'googleapis';
        
        try {
            const googleModule = await import(GOOGLE_LIB);
            this._googleModule = googleModule.google as typeof import('googleapis').google;
            console.info('CalcTableIO::initGoogle(): Google APIs module loaded successfully.');
        } catch (error) 
        {
            throw new Error(`Google APIs not available. Please install ${GOOGLE_LIB} package to use Google Sheets export.`);
        }

        console.info('CalcTableIO::initGoogle(): Setting up Google authentication...');

        const auth = new this._googleModule.auth.GoogleAuth(
        {
            // NOTE: API keys don't work here, need to use service account with email and private key
            // TODO: lose the keyfile for users to set their own credentials
            keyFile: keyfilePath,
            scopes: [
                'https://www.googleapis.com/auth/drive', // To create new files - this needs to be above spreadsheets scope
                'https://www.googleapis.com/auth/drive.file',
                'https://www.googleapis.com/auth/drive.readonly',
                'https://www.googleapis.com/auth/spreadsheets',
            ],
        });
        this._googleAuth = await auth.getClient(); // JWT info


        console.info(`TableIO::initGoogle(): Google Sheets authentication successful`);

        return this;
    }

    checkGoogleInitialized()
    {
        if(!this._googleModule)
        {
            throw new Error(`TableIO::_googleModule not initialized. Call initGoogle() first.`);
        }
        if(!this._googleAuth)
        {
            throw new Error(`TableIO::_googleAuth not initialized. Call initGoogle() first with keyfile and shared drive id`);
        }
    }

    /** Create new Google Sheet document and return its id */
    async createGoogleSheet(title:string, folderPath:string):Promise<string>
    {
        this.checkGoogleInitialized();
        console.info(`TableIO: Creating new Google Sheet document: ${title}...`);

        // NOTE: We use Drive API to create new file in specific folder
        // IMPORTANT: Set up a shared drive and create a folder in it and set in config
        const drive = this._googleModule.drive({ version: 'v3', auth: this._googleAuth });
        
        const fileMetadata = {
            name: title,
            mimeType: 'application/vnd.google-apps.spreadsheet',
            parents: [this._googleDriveId], // The folder ID is specified here
        };

        try {
            console.info(`📄 Creating spreadsheet "${title}" in folder: ${this._googleDriveFolderId}...`);

            const response = await drive.files.create({
                resource: fileMetadata,
                supportsAllDrives: true, // needed for shared drives
                fields: 'id, name, webViewLink', // Specify which fields to return
            });

            // NOTE:Sheets can have the same names in Drive
            // TODO: remove if already exists
            const newSheet = response.data;
            console.info(`Create Google Sheet: ${newSheet.name} at ${newSheet.webViewLink}`);

            return newSheet;
        } 
        catch (error) 
        {
            console.error('Error uploading file:', error.message);
            throw error;
        }
    }

    async _googleListFolder(folderId: string): Promise<Array<GoogleDriveItem>>
    {
        console.info(`Getting content of folder with id "${folderId}"`);

        const drive = this._googleModule.drive({ version: 'v3', auth: this._googleAuth });

        const response = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false`, // don't list trashed files
            fields: 'files(id, name, mimeType, parents, createdTime, modifiedTime, size)',
            orderBy: 'name',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
            corpora: 'drive',
            driveId: this._googleDriveId,
        });
        
        const items = response.data.files || [];
        
        // Add type field and process the results, matching the inline interface
        return items.map((item: any) => ({
            id: item.id,
            name: item.name,
            mimeType: item.mimeType,
            createdTime: item.createdTime,
            modifiedTime: item.modifiedTime,
            size: item.size,
            type: item.mimeType === 'application/vnd.google-apps.folder' ? 'folder' : 'file',
        }));
    }

    /** List a folder specific by path
    * Get files and folders from Google Drive based on path
    * @param path - Path relative to the main folder (e.g., './', 'subfolder1', 'subfolder1/subfolder2')
    * @returns Array of file/folder objects with id, name, type, and mimeType
    */
    async _googleListPath(path:string='.'): Promise<Array<GoogleDriveItem>>
    {        
        // Normalize path - remove leading/trailing slashes and split
        const cleanPath = path.replace(/^\.?\/+|\/+$/g, '');
        const pathParts = cleanPath 
                                ? cleanPath.split('/').filter(part => part.length > 0 && part !== '.') 
                                : [];

        let currentFolderId = this._googleDriveId;
        
        // Navigate through path parts to find the target folder
        if(pathParts.length > 0)
        {
            for (const folderName of pathParts)
            {
                
                console.info(`TableIO::_googleListPath() 📂 Navigating to folder: ${folderName} in parent: ${currentFolderId}`);
                
                const folderItems = await this._googleListFolder(currentFolderId);
                const folders = folderItems
                                    .filter(item => item.type === 'folder' 
                                        && item.name === folderName);

                if (!folders || folders.length === 0)
                {
                    throw new Error(`TableIO::_googleListPath():⛔ Folder '${folderName}' not found in path '${path}'`);
                }
                if (folders.length > 1)
                {
                    console.warn(`TableIO::_googleListPath(): 📂 Multiple folders named '${folderName}' found, using the first one`);
                }
                currentFolderId = folders[0].id;
            }
        }
        // Now normally list the contents of the target folder
        return await this._googleListFolder(currentFolderId);   
    }
    
    /** Get file or folder by path, return undefined if not exists
     *  @param path - Path relative to the main folder (e.g., './', 'subfolder1/file.txt')
     *  @returns File or Folder item
     */
    async _googleGetPathItem(path: string): Promise<GoogleDriveItem|undefined>
    {
        // We use last part of the path as the target name
        const cleanPath = path.replace(/^\.?\/+|\/+$/g, '');
        const pathParts = cleanPath ? cleanPath.split('/').filter(part => part.length > 0) : [];
    
        const targetName = pathParts.pop();
        const parentPath = pathParts.length > 0 ? './' + pathParts.join('/') : '.'; 

        console.info(`Getting item "${targetName}" from path "${parentPath}"`);

        if (!targetName)
        {
            throw new Error('Invalid path specified');
        }
        const parentItems = await this._googleListPath(parentPath);

        const targetItem = parentItems.find(item => item.name === targetName);
        return targetItem;
    }

    /** Copy a Google Drive item to a new location given as path
     *  NOTE: Please make sure the folders exist!
     */
    async copyGoogleItem(item: GoogleDriveItem, itemNewPath: string):Promise<GoogleDriveItem>
    {
        this.checkGoogleInitialized();
        if (typeof itemNewPath !== 'string'){ throw new Error('CalcTableIO::copyGoogleItem(): Invalid path specified');}    
        if(itemNewPath.endsWith('/')){ throw new Error('CalcTableIO::copyGoogleItem(): Target path must include the new file name, not end with a slash.');}

        const targetFolderName = itemNewPath.split('/').slice(0, -1).join('/');
        const targetFolderItem = await this._googleGetPathItem(targetFolderName);
        const targetFileName = itemNewPath.split('/').pop(); // last one

        if (!targetFolderItem || targetFolderItem.type !== 'folder')
        {
            throw new Error(`TableIO::copyGoogleItem(): Target folder not found: ${targetFolderName}`);
        }

        // Create a copy in the target folder
        
        const drive = this._googleModule.drive({ version: 'v3', auth: this._googleAuth });
        const copy = await drive.files.copy({
            fileId: item.id,
            supportsAllDrives: true, // ESSENTIAL for shared drives
            requestBody: {
                name: targetFileName,
                parents: [targetFolderItem.id],
            }
        });
        console.info(`TableIO::copyGoogleItem(): Copied "${item.name}" to "${itemNewPath}"`);

        return copy.data;
    }

    /** Get content of item by path
     *  If path is file get file contents
     *  If path is folder get list of items in folder
     */
    private async _googleGetContentPath(path: string): Promise<string|ArrayBuffer|Array<GoogleDriveItem>|undefined>
    {
        const item = await this._googleGetPathItem(path);
        if (!item)
        {
            console.warn(`Item at path "${path}" not found.`);
            return undefined;
        }
        return this._googleGetItemContent(item);
    }

    /** Get content of a file or folder */
    private async _googleGetItemContent(item: GoogleDriveItem): Promise<string|ArrayBuffer|Array<GoogleDriveItem>>
    {
        console.info(`Getting content of item with id "${item.id}" and type "${item.type}"`);

        // If item is folder
        if (item.type === 'folder')
        {
            return this._googleListFolder(item.id);
        }
        else {
            return this._googleGetItemFileContent(item);
        }

    }

    /** Get content of a file based on its mimeType */
    private async _googleGetItemFileContent(item: GoogleDriveItem, format?: GoogleWorkspaceExportFormat): Promise<ArrayBuffer | string>
    {
        console.info(`Getting file content of item "${item.name}" (${item.mimeType})`);

        const drive = this._googleModule.drive({ version: 'v3', auth: this._googleAuth });

        // Check if it's a Google Workspace file (needs export)
        if (this._isGoogleWorkspaceFile(item)) 
        {
            if(!format) throw new Error('Export format must be specified for Google Workspace files.');
            return this._exportGoogleWorkspaceFile(item, format);
        }
        
        // Regular file (direct download)
        return this._downloadRegularFile(item);
    }

    private _isGoogleWorkspaceFile(item: GoogleDriveItem): boolean 
    {
        return item.mimeType.startsWith('application/vnd.google-apps.');
    }

    /** Export Google Workspace files to downloadable formats */
    private async _exportGoogleWorkspaceFile(item: GoogleDriveItem, format: GoogleWorkspaceExportFormat): Promise<ArrayBuffer>
    {
        console.info(`Exporting Google Workspace file: ${item.name}`);

        const EXPORT_MAP: Record<string, Partial<Record<GoogleWorkspaceExportFormat,string>> > = 
        {
            'application/vnd.google-apps.document': 
            { 
                text: 'text/plain',
                pdf: 'application/pdfthis.checkGoogleInitialized();',
                docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                odt: 'application/vnd.oasis.opendocument.text',
                html: 'text/html',
                rtf: 'application/rtf',
            },
            'application/vnd.google-apps.spreadsheet': 
            { 
                xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                ods: 'application/x-vnd.oasis.opendocument.spreadsheet',
                csv: 'text/csv',
                pdf: 'application/pdf',
            },
            'application/vnd.google-apps.presentation': 
            { 
                pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                pdf: 'application/pdf',
                odp: 'application/vnd.oasis.opendocument.presentation',
            },
            // Add more mappings as needed
        };
        
        // Determine export format based on file type
        const exportMimeType = EXPORT_MAP[item.mimeType]?.[format];
        
        if (!exportMimeType)
        {
            throw new Error(`Cannot export file type: ${item.mimeType}`);
        }
        
        const drive = this._googleModule.drive({ version: 'v3', auth: this._googleAuth });
        const response = await drive.files.export(
            {
                fileId: item.id,
                mimeType: exportMimeType,
            },
            { responseType: 'arraybuffer' }
        );
        
        return response.data;
    }

    /** Download regular (non-Google Workspace) files */
    private async _downloadRegularFile(item: GoogleDriveItem): Promise<ArrayBuffer>
    {
        const drive = this._googleModule.drive({ version: 'v3', auth: this._googleAuth });

        console.info(`Downloading regular file: ${item.name} (${item.mimeType})`);
        
        try {
            const response = await drive.files.get(
                {
                    fileId: item.id,
                    alt: 'media' // This tells the API to return the file content instead of metadata
                },
                { 
                    responseType: 'arraybuffer',
                    supportsAllDrives: true // Support shared drives
                }
            );
            
            console.info(`✅ Downloaded ${item.name} (${response.data.byteLength} bytes)`);
            return response.data;
        }
        catch (error: any) {
            console.error(`❌ Error downloading file ${item.name}:`, error.message);
            
            // Handle specific error cases
            if (error.message?.includes('fileNotDownloadable')) {
                throw new Error(`File "${item.name}" cannot be downloaded. It may be a Google Workspace file that requires export instead.`);
            }
            
            if (error.message?.includes('forbidden') || error.message?.includes('403')) {
                throw new Error(`Access denied to file "${item.name}". Check permissions.`);
            }
            
            if (error.message?.includes('notFound') || error.message?.includes('404')) {
                throw new Error(`File "${item.name}" not found or has been deleted.`);
            }
            
            throw error;
        }
    }

    //// GOOGLE SPREADSHEET ////

    /* Open existing Google Sheet by its ID 
        The id is visible in the URL when you open the sheet in browser
        e.g., https://docs.google.com/spreadsheets/d/ SHEET_ID_HERE /edit

        A google sheet can contain multiple worksheets (tabs)
    */
    async openGoogleSheet(sheetId:string):Promise<GoogleSpreadsheet>
    { 
        this.checkGoogleInitialized();
        
        if(!sheetId || typeof sheetId !== 'string')
        {
            throw new Error('Invalid sheet ID. Please provide a valid string.');
        }       
        if(!this._googleSpreadsheetModule)
        {
            await this._initGoogleSpreadsheet();
        }

        try {
            const sheet = new this._googleSpreadsheetModule
                .GoogleSpreadsheet(sheetId, this._googleAuth) as GoogleSpreadsheet;

            await sheet.loadInfo(); // loads document properties and worksheets
            console.info(`Opened Google Spreadsheet: "${sheet.title}" with ${sheet.sheetCount} worksheets: "${sheet.sheetsByIndex.map(s=>s.title).join('","')}"`);
            return sheet
        }
        catch (error)
        {
            throw new Error(`TableIO::openGoogleSheet(): Can't open Google Sheet with ID "${sheetId}": "${error.message}"`);
        }   
    }

    /** Powertool that creates a copy of a template sheet
     *  then fills in the inputs, resolve any IMPORTRANGE formulas, and returns the id of a new sheet
     */
    async googleSheetFromTemplate(templateSheetPath:string, newSheetPath:string, inputs: Record<string, any>, makePublic:boolean=true, returnUrl:boolean=false):Promise<string>
    {
        // Init google module(s) if not there
        if(!this._googleModule && !this._googleAuth)
        {
            await this.initGoogle();
        }
        
        this.checkGoogleInitialized();

        const templateSheetItem = await this._googleGetPathItem(templateSheetPath);
        if(!templateSheetItem) throw new Error(`TableIO::googleSheetFromTemplate(): Template sheet not found at path: ${templateSheetPath}`);

        const newSheetItem = await this.copyGoogleItem(templateSheetItem, newSheetPath);

        // Open and fill in inputs
        const newSheet = await this.openGoogleSheet(newSheetItem.id);
        await this.googleSheetSetInputs(newSheet, inputs);

        // Resolve any IMPORTRANGE formulas
        await this.googleSheetResolveImportRangeFormulas(newSheet);

        // Also make it public (with link)
        if(makePublic)
        {
            this.googleDriveSetPermissions(newSheet, 'writer', 'anyone');
        }

        return (returnUrl ? this.GOOGLE_SHEETS_BASE_URL : '') + newSheetItem.id;
    }

    /** Load module google-spreadsheet dynamically */
    async _initGoogleSpreadsheet()
    {
        const GOOGLE_SPREADSHEET_LIB = 'google-spreadsheet';

        try {
            const gsModule = await import(GOOGLE_SPREADSHEET_LIB);
            this._googleSpreadsheetModule= gsModule as typeof import('google-spreadsheet');
            console.info('CalcTableIO: Google Spreadsheet module loaded successfully.');
        } catch (error) 
        {
            throw new Error(`Google Spreadsheet module not available. Please install ${GOOGLE_SPREADSHEET_LIB} package to use Google Sheets export.`);
        }
    }

    /** Get named ranges from a Google Sheet
     *  Named ranges are predefined ranges of cells that can be referenced by name
     *  NOTE: Named ranges are global to the spreadsheet, not per worksheet
     *  @param sheet - Google Spreadsheet object
     *  @returns Array of named ranges with their details
     *  @example
     *    [
     *      {
     *        namedRangeId: 'g34lb4bdpigh',
     *        name: 'MyNamedRange',
     *        range: {
     *            sheetId: 0,
     *            startRowIndex: 1,
     *            endRowIndex: 5,
     *            startColumnIndex: 1,
     *            endColumnIndex: 3
     *        }
     *      },
     *      ...
     *  ]
     *
     *  NOTE: Because google-spreadsheet doesn't support named ranges yet, we implement it using Google API directly
     *  
     */
    async _googleSheetGetNamedRanges(sheet: GoogleSpreadsheet):Promise<Array<GoogleSheetNamedRange>>
    {
        try {
            // Using Google Sheets API directly (in some docs it says sheet.axios, but it's sheetsApi)
            const response = await sheet.sheetsApi.get(`?fields=namedRanges`);
            const namedRanges = (await response.json() as any)?.namedRanges || [];
            return namedRanges as Array<GoogleSheetNamedRange>;
        } 
        catch (error) 
        {
            console.error(`Error fetching named ranges: ${error.message}`);
            throw error;
        }
    }

    /** Set and save inputs on a Google Sheet 
     *  We use named ranges to set inputs (inputs.<<name>>)
     *  So make sure to define named ranges in the sheet like inputs.width, inputs.depth, etc.
     *  @param inputs - Record of named range to values
     *  
    */
    async googleSheetSetInputs(sheet:GoogleSpreadsheet, inputs: Record<string, any>)
    {
        if(!inputs || typeof inputs !== 'object')
        {
            throw new Error('CalcCalcTableIO::_googleWorkSheetSetInputs(): Please supply a Record<string, any> of inputs to set.');
        }

        // First get inputs from named ranges
        const inputNamedRanges = (await this._googleSheetGetNamedRanges(sheet)).filter(nr=>nr.name.startsWith('inputs.'));

        // First get worksheets to load cells for
        const worksheetIds = Array.from(new Set(inputNamedRanges.map(nr => nr.range?.sheetId ?? 0)));
        for (let id of worksheetIds)
        {
            console.info(`CalcCalcTableIO::_googleSheetSetInputs(): Loading cells for worksheet id: "${id}"`);
            await sheet.sheetsById[id].loadCells(); // load cells into cache
            // TODO: filters?
        }

        // Now set inputs
        const validInputNames = inputNamedRanges.map(nr=>nr.name.replace('inputs.',''));
        for (let [inputName, inputValue] of Object.entries(inputs))
        {
            if (!validInputNames.includes(inputName))
            {
                console.warn(`TableIO::_googleWorkSheetSetInputs(): Input "${inputName}" is not a valid input name, skipping.`);
                continue;
            }
            // Now get cell and set value
            const inputNamedRange = inputNamedRanges.find(nr => nr.name === `inputs.${inputName}`);
            
            if (!inputNamedRange) // just to make sure
            {
                console.warn(`TableIO::_googleWorkSheetSetInputs(): Named range for input "${inputName}" not found, skipping.`);
                continue;
            }
            
            const sheetId = inputNamedRange.range?.sheetId ?? 0; // API leaves out sheetId when 0
            const worksheet = sheet.sheetsById[sheetId];
            if (!worksheet)
            {
                console.warn(`Worksheet with id "${sheetId}" not found for input "${inputName}", skipping.`);
                continue;
            }

            const startRow = inputNamedRange.range.startRowIndex || 0;
            const startCol = inputNamedRange.range.startColumnIndex || 0;
            
            const cell = await worksheet.getCell(startRow, startCol);
            console.info(`TableIO::_googleWorkSheetSetInputs(): Setting input "${inputName}" at cell [${startRow}, ${startCol}] to value: ${inputValue}`);
            cell.value = inputValue;

        }
        // Save all changes
        for (let id of worksheetIds)
        {
            console.info(`TableIO::_googleWorkSheetSetInputs(): Saving changes for worksheet id: "${id}"`);
            await sheet.sheetsById[id].saveUpdatedCells();
        }
    }


    /** Replace any references to other sheets (using IMPORTRANGE)
     *  with actual data from the referenced sheets
     *  For now search all worksheets for IMPORTRANGE formulas
     *  
     *  @param sheet - Google Spreadsheet object
     *  @param worksheets - Optional array of worksheet names to process, if empty process all. Case insensitive.
     */
    async googleSheetResolveImportRangeFormulas(sheet:GoogleSpreadsheet, worksheets: Array<string>=[])
    {
        console.info(`TableIO::googleSheetResolveImportRangeFormulas(): Resolving IMPORTRANGE formulas...`);
        // Determine which worksheets to process
        if(!Array.isArray(worksheets)) worksheets = [];
        worksheets = worksheets.map(name => name.trim().toLowerCase()).filter(name => name.length > 0);

        const worksheetsToProcess = Object.entries(sheet.sheetsByTitle)
                                .map(([name, ws]) => 
                                    {
                                        if(worksheets.length === 0 || worksheets.includes(name.toLowerCase()))
                                        {
                                            return ws; // either no worksheet is given by user, or it's in the list
                                        }
                                        return null;
                                    }).filter(ws => ws); 

        
        const externalSheetCache: Record<string, GoogleSpreadsheet> = {}; // Cache of opened external sheets by sheetId
        const externalNameRangeCache: Record<string, Array<GoogleSheetNamedRange>> = {}; // Cache of named ranges by sheetId
        const externalWorksheetLoaded: Record<string, boolean> = {}; // Cache of worksheets by sheetId and worksheetId

        for (const worksheet of worksheetsToProcess)
        {
            await worksheet.loadCells(); // Do this first to load all cells

            await this._googleWorksheetIterateCells(
                worksheet, 
                async (cell, row, col) => 
                {
                    if (cell.formula && cell.formula.includes('IMPORTRANGE'))
                    {
                        console.info(`TableIO::googleSheetResolveImportRangeFormulas(): Found IMPORTRANGE in cell ${cell.a1Address}: ${cell.formula}`);
                        
                        const { sheetId: lookupSheetId, range } = this._googleWorksheetImportRangeArgs(cell.formula) || {};
                        console.log(lookupSheetId, range);

                        if (lookupSheetId && range)
                        {
                            console.info(`TableIO::googleSheetResolveImportRangeFormulas(): Resolving IMPORTRANGE in cell ${cell.a1Address}: targetSheetId="${lookupSheetId}", range="${range}"`);

                            const externalSheet = externalSheetCache[lookupSheetId] || (await this.openGoogleSheet(lookupSheetId));
                            externalSheetCache[lookupSheetId] = externalSheet; // cache it
                            const namedRanges = externalNameRangeCache[lookupSheetId] || (await this._googleSheetGetNamedRanges(externalSheet));
                            externalNameRangeCache[lookupSheetId] = namedRanges; // cache it

                            // Find the named range
                            const lookupNamedRange = namedRanges.find(nr => nr.name === range);
                            if (!lookupNamedRange)
                            {
                                console.warn(`TableIO::googleSheetResolveImportRangeFormulas(): Named range "${range}" not found in external sheet "${externalSheet.title}" (${lookupSheetId}), skipping.`);
                                return;
                            }
                            else 
                            {
                                // Now get value from the named range
                                const targetSheetId = lookupNamedRange.range?.sheetId || 0;
                                const targetWorksheet = externalSheet.sheetsById[targetSheetId];
                                if (!targetWorksheet)
                                {
                                    console.warn(`TableIO::googleSheetResolveImportRangeFormulas(): Worksheet with id "${targetSheetId}" not found in external sheet "${externalSheet.title}". Skipping.`);
                                    return;
                                }
                                // check cache if we need to load cells
                                const worksheetCacheKey = `${lookupSheetId}_${targetSheetId}`;
                                if (!externalWorksheetLoaded[worksheetCacheKey])
                                {
                                    await targetWorksheet.loadCells(); // load cells, only once
                                    externalWorksheetLoaded[worksheetCacheKey] = true;
                                }

                                const targetCell = targetWorksheet.getCell(lookupNamedRange.range?.startRowIndex, lookupNamedRange.range?.startColumnIndex);
                                
                                // Replace the IMPORTRANGE(...) entry of the formula with the actual value
                                cell.formula = cell.formula.replace(this.FORMULA_IMPORTRANGE, targetCell.value as string);

                                console.info(`TableIO::googleSheetResolveImportRangeFormulas(): Replaced IMPORTRANGE in cell ${cell.a1Address} with value from external named range "${range}": ${targetCell.value}`);

                            }
                        }
                    }
                });

            // update all cells
            await worksheet.saveUpdatedCells();
        }

    }

    _googleWorksheetImportRangeArgs(formula:string):{ sheetId: string; range: string }|null
    {
        const importrangeRegex = this.FORMULA_IMPORTRANGE;
        const match = formula.match(importrangeRegex);
        if (match && match.length === 3)
        {
            return {
                sheetId: match[1].replace('https://docs.google.com/spreadsheets/d/', ''), // remove url parts
                range: match[2],
            };
        }
        return null;
    }

    async _googleWorksheetIterateCells(worksheet, callback: (cell:GoogleSpreadsheetCell, row:number, col:number) => void)
    {
        for (let row = 0; row < worksheet.rowCount; row++) {
            for (let col = 0; col < worksheet.columnCount; col++)
            {
                const cell = worksheet.getCell(row, col) as GoogleSpreadsheetCell;
                await callback(cell, row, col);
            }
        }
    }

    //// MANAGE RIGHTS ////

    /** Set permissions on a Google Drive file using Drive API directly */
    async googleDriveSetPermissions(sheet: GoogleSpreadsheet, role: 'reader'|'writer'|'commenter', type: 'user'|'group'|'domain'|'anyone', emailAddress?: string): Promise<void>
    {
        this.checkGoogleInitialized();
        
        const drive = this._googleModule.drive({ version: 'v3', auth: this._googleAuth });
        
        const permission = {
            role: role,
            type: type,
            ...(emailAddress && { emailAddress }) // Add email if provided for user/group types
        };
        
        try {
            const response = await drive.permissions.create({
                fileId: sheet.spreadsheetId,
                supportsAllDrives: true, // Essential for shared drives
                sendNotificationEmail: false, // Optional: don't send email notifications
                resource: permission
            });

            console.info(`✅ TableIO::googleDriveSetPermissions(): set: ${type} Role "${role}" applied to file ${sheet.spreadsheetId}`);
            return response.data;
        }
        catch (error: any) {
            console.error(`TableIO::googleDriveSetPermissions(): Error setting permissions on file ${sheet.spreadsheetId}:`, error.message);
            throw error;
        }
    }

    /** Remove public access from a Google Drive file */
    async googleDriveRemovePublicAccess(sheet: GoogleSpreadsheet): Promise<void>
    {
        this.checkGoogleInitialized();
        
        const drive = this._googleModule.drive({ version: 'v3', auth: this._googleAuth });
        
        try {
            // First, list all permissions to find the public one
            const permissionsResponse = await drive.permissions.list({
                fileId: sheet.spreadsheetId,
                supportsAllDrives: true
            });
            
            const publicPermission = permissionsResponse.data.permissions?.find(p => p.type === 'anyone');
            
            if (publicPermission && publicPermission.id) {
                await drive.permissions.delete({
                    fileId: sheet.spreadsheetId,
                    permissionId: publicPermission.id,
                    supportsAllDrives: true
                });

                console.info(`✅ Removed public access from file ${sheet.spreadsheetId}`);
            } else {
                console.info(`ℹ️ File ${sheet.spreadsheetId} is not publicly accessible`);
            }
        }
        catch (error: any) {
            console.error(`❌ Error removing public access from file ${sheet.spreadsheetId}:`, error.message);
            throw error;
        }
    }

    

}