/**
 *  CalcTableExporter.ts
 *  
 *   Export calculation table data to various formats and platforms like Excel and Google Sheets
 *   
 *   NOTE: For now Excel is at Table.exportExcel()
 *     
 */

import { Table } from "./internal";

export class TableExporter
{
    _table:Table;
    _google:any; // Google module
    _googleAuth:any; // Google auth module
    _googleDriveFolderId:string; // Google Drive folder ID to create files in

    constructor(table:Table)
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

    /** Load Google module and  */
    async _initGoogle(keyfilePath:string, folderId:string):Promise<this>
    {
        if(!keyfilePath || typeof keyfilePath !== 'string'){ throw new Error('Google Sheets key file path is required for authentication.'); }
        if(!folderId || typeof folderId !== 'string'){ throw new Error('Google Drive folder ID is required to create Sheets in.'); }

        this._googleDriveFolderId = folderId;

        // Dynamically load to avoid to have it always. If you want to use it, make sure to install googleapis package
        const GOOGLE_LIB = 'googleapis';

        console.info('TableExporter: Initializing Google Sheets modules...');
        
        try {
            this._google = (await import(GOOGLE_LIB)).google;
        } catch (error) 
        {
            throw new Error(`Google APIs not available. Please install ${GOOGLE_LIB} package to use Google Sheets export.`);
        }

        console.info('TableExporter: Setting up Google Sheets authentication...');

        const auth = new this._google.auth.GoogleAuth(
        {
            // NOTE: API keys don't work here, need to use service account with email and private key
            keyFile: keyfilePath,
            scopes: [
                'https://www.googleapis.com/auth/drive', // To create new files - this needs to be above spreadsheets scope
                'https://www.googleapis.com/auth/spreadsheets',
            ],
            subject: 'info@archiyou.com' // Optional: to impersonate a user in the domain (for G Suite accounts)
        });
        this._googleAuth = await auth.getClient(); // JWT info


        console.info(`TableExporter: Google Sheets authentication successful`);

        return this;
    }

    /** Create new Google Sheet document and return its id */
    async createGoogleSheet(title:string):Promise<string>
    {
        console.info(`TableExporter: Creating new Google Sheet document: ${title}...`);

        // NOTE: We use Drive API to create new file in specific folder
        // IMPORTANT: Set up a shared drive and create a folder in it and set in config
        const drive = this._google.drive({ version: 'v3', auth: this._googleAuth });
        

        const fileMetadata = {
            name: title,
            mimeType: 'application/vnd.google-apps.spreadsheet',
            parents: [this._googleDriveFolderId], // The folder ID is specified here
        };

        try {
            console.log(`Creating spreadsheet "${title}" in folder: ${this._googleDriveFolderId}...`);

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
}