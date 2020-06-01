import { Injectable } from '@angular/core';
import { Base64 } from './base64';
import { Utf8 } from './utf8';


import { FourDInterface, FourDQuery } from './JSFourDInterface';
import { FourDCollection } from './JSFourDCollection';

/**
 * This is the description for each field in a Data Model
 */
export interface IFieldDescription {
    /** the field name, must be unique in the Data Model */
    name: string;
    /** the field dot long name, in the format 'table.field', applicable if a database field */
    longname: string;
    /** the field type, possible values are: string, number, Number, Date, time, boolean, blob, json, picture */
    type: string;
    /** if field is a calculated value, this is a 4D expresstion that returns the field contents */
    formula: string;
    /** if field is a subtable <i>(related many table)</i>, this is the FourDModel that represents records in that table */
    subTable: FourDModel;
    /** not used */
    className: string;
    /** if field is a subtable, this is the foreign key field in the main table */
    joinFK: string;
    /** if field is a subtable, this is the primary key field in the related many table */
    joinPK: string;
    /** indicates field comes from a related table */
    isrelated: boolean;
    /** if field is a foreign key that relates to a one table, this is the related one field name in dot long format */
    relatesTo: string;
    /** indicates field is read only, and can't me modified */
    readonly: boolean;
    /** the choice list associated to the field */
    list: string;
    /** field is a required field, cannot be empty or null */
    required: boolean;
    /** indicates that the field is indexed on 4D side */
    indexed: boolean;
    /** field is unique */
    unique: boolean;
    /** if an alpha field, the field length as defined in the 4D Structure */
    length: number;
}

/**
 * Individual 4D Datamodel that replicates a 4D Table's structure and provides a CRUD API to 4D data
 */
@Injectable()
export class FourDModel {
    /** 4D's Table name */
    public tableName = '';
    /** 4D's table number */
    public tableNumber = 0;
    /** Table's primary key field name */
    public primaryKey_: string;

    /** record number field/attribute name, usually '_recnum' */
    public idAttribute = '_recnum';

    /** Table definition, array describing all fields in the Data Model and how they map to the 4D Structure */
    public fields: Array<IFieldDescription> = [];

    /** callback method to be executed on 4D side before a Save operation */
    public fourdSaveCallbackMethod_: string;
    /** callback method to be executed on 4D side before a Delete operation */
    public fourdDeleteCallbackMethod_: string;

    // injected FourDInterface service
    public fourD: FourDInterface;

    // -----------------------
    // Private variables
    // -----------------------
    // current record number
    private _recnum = -3;
    // keeps all attributes for the current model
    private _attributes: any = {};
    // keep a list of modified fields, to optimize Updates, only modified data is set to 4D
    private _modified: any = {};


    /** 
     * constructor: initialize model properties
    */
    constructor() {
        // inject FourDInterface
        this.fourD = FourDInterface.interfaceInstance;
    }


    /**
     * Get a field value
     */
    get(field: string): any {
        return this._attributes[field];
    }

    /**
     * Set a field value, updates field modified flag
     */
    set(field: string, value: any) {
        if (this.getFieldProperties(field)) {
            if (this.getFieldDescription(field).type === 'Date') {
                if (typeof (value) === 'string' && value !== '') {
                    value = new Date(value.replace(/-/g, '\/'));
                }
            } else if (this.getFieldDescription(field).type === 'Time') {
                if (typeof (value) === 'string' && value !== '') {
                    const hh = +value.substr(0,2);
                    const mm = +value.substr(3,2);
                    const ss = +value.substr(6,2);
                    value = new Date(0,0,0,hh,mm,ss);
                }
            }
            if (this._attributes.hasOwnProperty(field)) {
                // we are updating an attribute
                if (this._attributes[field] !== value) {
                    // make sure value is indeed changing...
                    this._attributes[field] = value;
                    this._modified[field] = true; // mark field as modified
                }
            } else {
                // setting a new attribute
                this._attributes[field] = value;
                this._modified[field] = true; // mark field as modified
            }
        } else {
            this._attributes[field] = value;
        }
    }

    /**
     * Returns the description for a given field
     * 
     * @param fieldName the field name to get properties for
     * 
     * @returns the field name properties, an IFieldDescription instance
     * 
     */
    getFieldProperties(fieldName): IFieldDescription {
        let ret: IFieldDescription = null;
        for (const col of this.fields) {
            if (col.name === fieldName) { ret = col; }
        };
        return ret;
    }


    /**
     * Clears up all record fields
     */
    clearRecord() {
        for (const field of this.fields) {
            switch (field.type) {
                case 'date':
                case 'Date':
                    this[field.name] = null;
                    break;

                case 'time':
                case 'Time':
                    this[field.name] = null;
                    break;

                case 'boolean':
                    this[field.name] = false;
                    break;

                case 'string':
                case 'text':
                    this[field.name] = '';
                    break;

                case 'number':
                    this[field.name] = 0;
                    break;

                case 'json':
                    this[field.name] = {};
                    break;

                case 'blob':
                case 'picture':
                    this[field.name] = null;
                    break;

                default:
                    this[field.name] = '';
                    break;
            }
        };

    }

    /**
     * Serializes record data into its JSON representation as used in 4D
     *
     * @param mode can be 'insert' or 'update', if mode is 'update' the JSON string will contain only fields that have been modified
     * @param noAudit 'no audit' flag to be sent to 4D, if 'true' record audit log will be disabled 
     * 
     * @returns record contents as JSON string
     *
     */
    recordToJSON(mode: string, noAudit: boolean): string {
        const recordData: any = { table: this.tableName, recnum: this.recordNumber };
        // set callback methods
        if (this.fourdSaveCallbackMethod_) {
            recordData['saveCallback'] = this.fourdSaveCallbackMethod_; // set save callback method if set
        }

        recordData['noAudit'] = noAudit;    // disable audit log for this record

        if ((mode === 'update') && this.hasOwnProperty('TimeStamp')) {
            recordData['timeStamp'] = this['TimeStamp'];
        } // if updating, add current record's timestamp attribute

        recordData['fields'] = {}; // initialize fields propriety
        for (const field of this.fields) {
            const fieldName: string = field.name;
            if (!this.isCalculatedField(field) &&
                !this.isSubtable(field) &&
                !this.isRelatedField(field) &&
                (!this.isReadOnly(field) || (mode === 'insert')) &&			// May/15/09 send all non-read only fields, empty or not
                (this.isModifiedField(fieldName) || (mode === 'insert'))) { 	// Nov 18/09 send ONLY fields that have indeed been modified
                let value = '';
                if (((this[fieldName] !== null) && (this[fieldName] !== undefined)) || (field.type === 'boolean')) {
                    // send back only fields that do have some value and that belong to the table
                    // ignore calculated or related fields
                    switch (field.type) {
                        case 'Date':
                        case 'date':
                            if (typeof(this[fieldName]) === 'string') {
                                recordData['fields'][field.longname] = this[fieldName]; 
                            } else {
                                const dateValue: Date = this[fieldName];
                                value = dateValue.getFullYear().toString();
                                if (dateValue.getMonth() < 9) { value += '0'; }
                                value += (dateValue.getMonth() + 1).toString();
                                if (dateValue.getDate() < 10) { value += '0'; }
                                value += dateValue.getDate().toString();
                                recordData['fields'][field.longname] = value;
                            }
                            break;

                        case 'time':
                        case 'Time':
                            const timeValue:Date = this[fieldName];
                            value = this.fourD.timeTo4DFormat(timeValue);
                            recordData['fields'][field.longname] = value;
                            break;

                        case 'number':
                        case 'Number':
                            recordData['fields'][field.longname] = +this[fieldName];
                            break;

                        case 'boolean':
                            recordData['fields'][field.longname] = (this[fieldName]) ? true : false;
                            break;

                        case 'string':
                        case 'text':
                            if (typeof (this[fieldName]) === 'string') {
                                // if text, trim extra whitespace
                                recordData['fields'][field.longname] = this[fieldName].trim();
                            } else {
                                recordData['fields'][field.longname] = this[fieldName].toString();
                            }
                            break;

                        case 'json':
                            recordData['fields'][field.longname] = JSON.stringify(this[fieldName]);
                            break;

                        case 'blob':
                        case 'picture':
                            /* TODO: add support for encoding BLOB fields */
                            /*
                             if (this[fieldName] != null) { // encode byte array does not handle null!
                             var ba:ByteArray = this[fieldName] as ByteArray
                             value = '<![CDATA['+Base64.encodeByteArray(ba)+']]>'; // if blob, wrap data inside a cdata
                             }
                             */
                            recordData['fields'][field.longname] = this[fieldName];
                            break;

                        default:
                            recordData['fields'][field.longname] = this[fieldName];
                            break;
                    }
                }


            }
        };

        return JSON.stringify(recordData);

    }


    /**
     * Retrieve a record from 4D and populates the Data Model.
     *
     * @param recordNumber the record # to retrieve (optional, it defaults to the currentRecordNumber property)
     * @param recordID primary key value for the record to retrieve (optional, it defaults to the currentRecordNumber property)
     *    if specified the record is retrieved by querying on its primary key field
     * @param query query string for the record to retrieve (optional, it defaults to the currentRecordNumber property)
     * 
     * @returns returns a Promise for the database operation, whose result is the FourDModel instance
     *
     *
     */
    public getRecord(recordNumber: number = null, recordID: string = null, query: FourDQuery = null): Promise<FourDModel> {
        if (query) {
            // if we have a query, use it...
        } else if (recordID && FourDInterface.fourdAPIVersion < '1.18.06.17a') { // get record using its record ID
            // build query for record
            if (!this.primaryKey_) {
                // uh-oh no primary key field for this record, duh!
                alert('No Primary Key specified for ' + this.tableName);
            } else {
                // getting a record based on its primary key
                query = { query: [this.tableName + '.' + this.primaryKey_ + ';=;' + recordID] }; // build query on record id
            }

        } else if (recordNumber >= 0 || this.recordNumber >= 0 || (recordID && FourDInterface.fourdAPIVersion >= '1.18.06.17a' && this.primaryKey_)) {
            // if we have a record number, use it directly then
            if (recordNumber >= 0) { this.recordNumber = recordNumber; }

            // build request body with record number to retrieve
            const body: any = { Username: FourDInterface.currentUser };
            body.TableName = this.tableName;
            if (recordID) {
                body.RecordID = recordID; // if querying record using record ID...             
            } else {
                body.RecordNum = this.recordNumber;
            }
            body.VariablesList = Base64.encode(Utf8.utf8encode(this.getColumnListJSON()));

            return new Promise((resolve, reject) => {
                // const me = this;
                this.fourD.call4DRESTMethod('REST_LoadData', body)
                    .subscribe(resultJSON => {
                        this.clearRecord();
                        this.populateModelData(resultJSON);
                        this.clearRecordDirtyFlag();
                        resolve(this);
                    },
                        error => {
                            console.log('error:' + JSON.stringify(error));
                            reject(error);
                        });
            });

        } else { 
            return new Promise((resolve, reject) => {
                reject('No current record number set, and no query specified!');
            });

        }

        const theModel: any = this.constructor.valueOf();
        const records: FourDCollection = new FourDCollection();
        records.model = theModel;
        const me = this;

        // first we send to query to 4D to get all records that match the query criteria
        // then if at lest 1 record is returned by 4D, we use it's record number to refresh to complete record contents
        return new Promise((resolve, reject) => {
            records.getRecords(query, [this.primaryKey_])
                .then((reclist) => {
                    if (records.models.length > 0) {
                        me.recordNumber = records.models[0].recordNumber; // set the record number and refresh it
                        me.refresh().then((rec) => { rec.clearRecordDirtyFlag(); resolve(me); }).catch((error) => { reject(error); });
                    } else { reject('recordNotFound'); }
                })
                .catch((error) => { reject(error); });
        });


    }

    /**
     * Refresh current record, grab a fresh copy from 4D
     *
     * @returns returns a Promise for the database operation, whose result is the FourDModel instance
     *
     */
    public refresh(): Promise<FourDModel> {
        if (this.recordNumber >= 0) {
            return this.getRecord(this.recordNumber);
        } else {
            return new Promise((resolve, reject) => {
                reject('No current record number set!');
            });
        }

    }


    /**
     * Insert a new record in the database.
     *
     * @returns returns a Promise for the database operation, whose result is the FourDModel instance. <p><i>the primary key property is set after the record is inserted</i></p>
     *
     */
    public insertRecord(): Promise<string> {
        const body: any = { Username: FourDInterface.currentUser };
        body.TableName = this.tableName;
        body.RecordNum = this.recordNumber;
        if (this.fourdSaveCallbackMethod_) { body.CallBackMethod = this.fourdSaveCallbackMethod_; }
        body.Action = 'add';
        body.RecordData = Base64.encode(Utf8.utf8encode(this.recordToJSON('add', false)));

        return new Promise((resolve, reject) => {
            const me = this;
            this.fourD.call4DRESTMethod('REST_PostData', body)
                .subscribe(resultJSON => {
                    if (resultJSON.returnCode === 'OK') {
                        // insert record went OK, retrieve calculated return code & record ID
                        me.recordNumber = resultJSON['recordNum'];
                        if (me.primaryKey_ && me.primaryKey_ !== '') { me[me.primaryKey_] = resultJSON['recordID']; }
                        me.clearRecordDirtyFlag(); // clean up modified fields
                        resolve(<any>me);
                    } else { reject(resultJSON.returnCode); }
                },
                    error => {
                        console.log('error:' + JSON.stringify(error));
                        reject(error.text());
                    });
        });


    }

    /**
     * Update record in the database.
     *
     * @returns returns a Promise for the database operation, whose result is the FourDModel instance
     *
     */
    public updateRecord(): Promise<string> {
        if (this.recordNumber >= 0) {
            const body: any = { Username: FourDInterface.currentUser };
            body.TableName = this.tableName;
            body.RecordNum = this.recordNumber;
            if (this.fourdSaveCallbackMethod_) { body.CallBackMethod = this.fourdSaveCallbackMethod_; }
            body.Action = 'update';
            body.RecordData = Base64.encode(Utf8.utf8encode(this.recordToJSON('update', false)));

            return new Promise((resolve, reject) => {
                const me = this;
                this.fourD.call4DRESTMethod('REST_PostData', body)
                    .subscribe(resultJSON => {
                        if (resultJSON.returnCode === 'OK') {
                            // update record went OK
                            me.clearRecordDirtyFlag(); // clean up modified fields
                            resolve(<any>me);
                        } else { reject(resultJSON.returnCode); }
                    },
                        error => {
                            console.log('error:' + JSON.stringify(error));
                            reject(error);
                        });
            });


        } else {
            return new Promise((resolve, reject) => {
                reject('No current record number set!');
            });
        }
    }

    /**
     * Delete record from the database
     *
     * @param cascade true|false indicates if 4D should perform a cascade delete (optional, default=false)
     *
     * @returns returns a Promise for the database operation, whose result is the FourDModel instance
     *
     */
    public deleteRecord(cascade: boolean = false): Promise<string> {
        if (this.recordNumber >= 0) {
            const body: any = { Username: FourDInterface.currentUser };
            body.TableName = this.tableName;
            body.RecordNum = this.recordNumber;
            if (this.fourdDeleteCallbackMethod_) { body.CallBackMethod = this.fourdDeleteCallbackMethod_; }
            body.Action = 'delete';
            if (cascade) { body.cascadeDelete = cascade; }

            return new Promise((resolve, reject) => {
                const me = this;
                this.fourD.call4DRESTMethod('REST_PostData', body)
                    .subscribe(resultJSON => {
                        if (resultJSON.returnCode === 'OK') {
                            // delete record went OK
                            resolve(<any>me);
                        } else { reject(resultJSON.returnCode); }
                    },
                        error => {
                            console.log('error:' + JSON.stringify(error));
                            reject(error);
                        });
            });



        } else {
            return new Promise((resolve, reject) => {
                reject('No current record number set, and no query specified!');
            });
        }

    }

    /**
     * Populates model with attributes/properties from a json Object
     *
     *  @param recordData json object whose properties will be used to populate the Data Model
     */
    public populateModelData(recordData: any) {
        if (recordData.hasOwnProperty('_recnum')) { this.recordNumber = recordData['_recnum']; }
        for (const field in recordData) {
            if (field !== '_recnum' && this.getFieldProperties(field)) {
                switch (this.getFieldProperties(field).type ) {
                    case 'json':
                        this[field] = (recordData[field] && recordData[field] != '')?JSON.parse(recordData[field]):{}; 
                        break;
                
                    default:
                        this[field] = recordData[field];
                        break;
                }
            }
        }

    }

    public extractModelData(): any {
        let data = { _recnum: this._recnum };
        for (const field of this.fields) {
            data[field.name] = this[field.name];
        }

        return data;
    }

    /**
     * Retrieves a list of records using a query string
     *
     *  @param query the FourDQuery object that defines the query to be used for retrieving from 4D
     * 	@param columns custom column list to retrieve, JSON array of the columns to retrieve. <p>if informed, only the columns listed will be retrieved instead of the whole record</p>
     * 	@param startRec the starting record number to retrieve, used for paging.
     * 	@param numOfRecords the number of records to retrieve, the default -1 will retrieve all records in the resulting query.
     *  @param filter optional, FourDQuery to further filter records to he retrieved
     *  @param orderby optional order By clause to retrieve records in a set order. <p> in the format:</p><p>    &gt;table.field : to sort records by table.field in ascending order</p><p>    &lt;table.field : to sort records by table.field in descending order</p>
     *
     *
     * @returns returns a Promise for the database operation, whose result is a FourDCollection with the query results
     */
    public getRecords(query: FourDQuery = null,
        columns: Array<string> = null,
        startRec: number = 0, numOfRecords: number = -1,
        filter: string = null,
        orderby: string = null): Promise<FourDCollection> {
        const theModel: any = this.constructor.valueOf();
        const records: FourDCollection = new FourDCollection();
        records.model = theModel;
        return new Promise((resolve, reject) => {
            records.getRecords(query, (columns) ? columns : this.getColumnList(), startRec, numOfRecords, filter, orderby)
                .then((reclist) => { resolve(records); })
                .catch((error) => { reject(error); });
        });

    }

    /**
     * Retrieves a set of variables or 4D execute formula values
     * 
     * @param values an Array of objects with the following format: {formula: 'a 4d formula', value:'the resulting value returned by 4D'}
     * @param method the name of a 4D method to be called before processing the formulas
     *
     * @returns returns a Promise for the database operation, whose result is the values Array populated by 4D
     */
    public getValuesFrom4D(values: Array<any>, method: string = ''): Promise<Array<any>> {
        const body: any = { VariablesList: Base64.encode(Utf8.utf8encode(JSON.stringify(values))) };
        if (method && method != '') {
            body.CallbackMethod = method;
        }
        return new Promise((resolve, reject) => {
            // const me = this;
            this.fourD.call4DRESTMethod('REST_GetValues', body)
                .subscribe(result => {
                    resolve(result);
                },
                    error => {
                        console.log('error:' + JSON.stringify(error));
                        reject(error);
                    });
        });

    }
    /**
     * Get the current record's record number
     * 
     *  @returns current record number (4D's record number, equivalent to ROWID)
     *
     */
    public get recordNumber(): number {
        return this._recnum;
    }
    public set recordNumber(v: number) { this._recnum = v; }

    /**
     * Checks to see if a record is currently loaded
     *
     * @returns true if a record is loaded into this FourDModel instance
     *
     */
    public isRecordLoaded(): boolean {
        return (this.recordNumber >= 0);
    }


    /**
     * Clears record modified flag.
     * 
     * This can be used when one changes a record programmatically, but does not want to set the record modified flag.
     * For example on record initialization.
     *
     */
    public clearRecordDirtyFlag() {
        this._modified = {};					// clear modified fields list
    }


    /**
     * Check if current record has been modified.
     *
     * @returns true indicates that record contents have been modified.
     *
     */
    public recordIsDirty(): boolean {
        for (const field of this.fields) {
            if (this._modified.hasOwnProperty(field.name)) { return true; }
        }
        return false;
    }


    /**
     * Prepares the record's JSON field description to send to 4D
     * 
     * @returns JSON string representing all fields in the Data Model
     */
    public getColumnListJSON(): string {
        const colList: Array<any> = [];
        const fields: Array<IFieldDescription> = this.fields;
        for (const col of fields) {
            if (col.formula) {
                colList.push({ name: col.name, formula: col.formula });
            } else if (col.subTable) {
                const subFields: Array<any> = [];
                for (const sub of col.subTable.fields) {
                    if (sub.formula) { // add support for formulas in subfields
                        subFields.push({ name: sub.name, formula: sub.formula });
                    } else {
                        subFields.push({ name: sub.name, field: sub.longname });
                    }
                };
                colList.push({
                    name: col.name,
                    subTable: col.subTable.tableName,
                    joinFK: col.joinFK,
                    joinPK: col.joinPK,
                    subFields: subFields
                });

            } else if (col.longname) { colList.push({ name: col.name, field: col.longname }); }
        }

        return JSON.stringify(colList);

    }

    /**
     * Gets a list of fields in the Data Model
     * 
     * @param includeSubTables if 'true', includes fields in subtables defined in the Data Model
     * 
     * @returns an array with all fields defined for this data model
     */
    public getColumnList(includeSubTables: boolean = false): Array<any> {
        const cols: Array<any> = [];
        const fields: Array<IFieldDescription> = this.fields;
        for (const col of fields) {
            if (!this.isSubtable(col) || includeSubTables) {
                if (col.formula) {
                    cols.push(col);
                } else { cols.push(col.name); }
            }
        };
        return cols;
    }

    /**
     * Returns a field's longname, given its field name
     * 
     * @param fieldName the field name
     * 
     * @returns the field dot longname, as 'table.field'
     */
    public getLongname(fieldName: string): string {
        for (const field of this.fields) {
            if (field.name === fieldName) { return field.longname; }
        }

        // not found, assume table.field
        return this.tableName + '.' + fieldName;
    }

    // -----------------------
    // Private methods
    // -----------------------

    /**
     * Returns a field's data model description
     * 
     * @param fieldName the field name
     * 
     * @returns the field's iFieldDescription
     */
    private getFieldDescription(fieldName: string): IFieldDescription {
        for (const field of this.fields) {
            if (field.name === fieldName) { return field; }
        }

        return null;
    }

    /**
     * Checks to see if a field is from a related table
     *
     * @param field field description for the Class definition
     * @return true if field is on a related table
     *
     */
    private isRelatedField(field: IFieldDescription): boolean {
        return field.isrelated;
    }

    /**
     * Checks to see if a field contents have been modified
     *
     * @param field field/property name
     * @returns true if field has been modified
     *
     */
    private isModifiedField(field: string): boolean {
        return this._modified.hasOwnProperty(field);
    }

    /**
     * Checks to see if a field is a calculated field
     *
     * @param field field description from the Data Model
     * 
     * @returns true if field is formula, a calculated field
     *
     */
    private isCalculatedField(field: IFieldDescription): boolean {
        return (field.formula !== undefined);
    }

    /**
     * Checks to see if a field is a related many subtable
     *
     * @param field field description from the Data Model
     * @returna true if field is a related many subtable
     *
     */
    private isSubtable(field: IFieldDescription): boolean {
        return (field.subTable !== undefined);
    }

    /**
     * Checks to see if a field is read only
     *
     * @param field field description from the Data Model
     * @returns true if field is read only
     *
     */
    private isReadOnly(field: IFieldDescription): boolean {
        return field.readonly;
    }



}

