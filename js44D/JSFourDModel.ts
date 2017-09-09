import { Injectable, ReflectiveInjector } from '@angular/core';
import * as base64 from 'base-64';
import * as utf8 from 'utf8/utf8';

//import { LogService } from '../../core/services/logging/log.service';
//import { Config } from '../../core/utils/config';

import { FourDInterface, FourDQuery } from './JSFourDInterface';
import { FourDCollection } from './JSFourDCollection';

interface IFieldDescription {
    name: string;
    longname: string;
    type: string;
    formula: string;
    subTable: FourDModel;
    className: string;
    joinFK: string;
    joinPK: string;
    isrelated: boolean;
    readonly: boolean;
    list: string;
    required: boolean;
}

/**
 * Individual 4D Datamodel that replicates a 4D Table's structure and provides a CRUD API to 4D data
 */
@Injectable()
export class FourDModel {
    /** 4D's Table name */
    public tableName: string = '';
    /** 4D's table number*/
    public tableNumber: number = 0;
    /** Tabl's primary key field name */
    public primaryKey_: string;

    public idAttribute: string = '_recnum';

    public fields: Array<IFieldDescription> = [];

    /**
     * callback methods to be executed on 4D side before a Save or Delete operation
     */
    public fourdSaveCallbackMethod_: string;
    public fourdDeleteCallbackMethod_: string;

    //-----------------------
    // Private variables
    //-----------------------
    // current record number
    private _recnum: number = -3;
    // keeps all attributes for the current model
    private _attributes: Object = {};
    // keep a list of modified fields, to optimize Updates, only modified data is set to 4D
    private _modified: Object = {};

    // injected FourDInterface service
    private fourD: FourDInterface;

    // the generic log service
    //private log: LogService;

    /** 
     * constructor: initialize model properties
     * @param tableName: 4D's table name
     * @param fields: an array of field descriptions
     * @param primaryKey: table's primary key field name
     * @param tableNumber: 4D's table number
    */
    constructor(/*tableName?: string, fields?: Array<IFieldDescription>, primaryKey?: string, tableNumber?: number*/) {
        /*
        if (tableName) this.tableName = tableName;
        if (fields) this.fields = fields;
        if (primaryKey) this.primaryKey_ = primaryKey;
        if (tableNumber) this.tableNumber = tableNumber;
        */
        // inject FourDInterface
        let injector = ReflectiveInjector.resolveAndCreate([FourDInterface]);
        this.fourD = injector.get(FourDInterface);
        //this.log = FourDInterface.log;
    }


    /**
     * get a field value
     */
    get(field: string): any {
        return this._attributes[field];
    }

    /**
     * set a field value
     */
    set(field: string, value: any) {
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
    }

    /**
     * return the description for a given field
     * 
     * @param fieldName: the field name to get properties for
     */
    getFieldProperties(fieldName): IFieldDescription {
        let ret: IFieldDescription = null;
        for (let col of this.fields) {
            if (col.name === fieldName) ret = col;
        };
        return ret;
    }


    /**
     * clear up all record fields
     */
    clearRecord() {
        for (let field of this.fields) {
            switch (field.type) {
                case 'date':
                    this[field.name] = '';
                    break;

                case 'time':
                    this[field.name] = '';
                    break;

                case 'boolean':
                    this[field.name] = false;
                    break;

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
     * serialize record data into its JSON representation as used in 4D
     *
     * @return record as JSON string
     *
     */
    recordToJSON(mode: string, noAudit: boolean):string {
        let recordData: Object = {table:this.tableName, recnum:this.recordNumber};
        // set callback methods
        if (this.fourdSaveCallbackMethod_) recordData['saveCallback']= this.fourdSaveCallbackMethod_ ; // set save callback method if set

        if (noAudit) recordData['noAudit']=true;				// disable audit log for this record

        if ((mode === 'update') && this.hasOwnProperty('TimeStamp')) {
            recordData['timeStamp']=this['TimeStamp'];
        } // if updating, add current record's timestamp attribute

        recordData['fields'] = {}; // initialize fields propriety
        for (let field of this.fields) {
            var fieldName: string = field.name;
            if (!this.isCalculatedField(field) &&
                !this.isSubtable(field) &&
                !this.isRelatedField(field) &&
                (!this.isReadOnly(field) || (mode === 'insert')) &&			// May/15/09 send all non-read only fields, empty or not
                (this.isModifiedField(fieldName) || (mode === 'insert'))) { 	// Nov 18/09 send ONLY fields that have indeed been modified
                var value = '';
                if ((this[fieldName] !== null) || (field.type !== 'boolean')) {
                    // send back only fields that do have some value and that belong to the table
                    // ignore calculated or related fields
                    switch (field.type) {
                        case 'Date':
                        case 'date':
                            let dateValue: Date = this[fieldName];
                            value = dateValue.getFullYear().toString();
                            if (dateValue.getMonth()<9) value +='0';
                            value+= (dateValue.getMonth()+1).toString();
                            if (dateValue.getDate()<10) value +='0';
                            value+= dateValue.getDate().toString();
                            recordData['fields'][field.longname]=value;
                            break;

                        case 'time':
                            recordData['fields'][field.longname] = this[fieldName];
                            break;

                        case 'number':
                            recordData['fields'][field.longname] = Number(this[fieldName]);
                            break;

                        case 'boolean':
                            recordData['fields'][field.longname] = this[fieldName];
                            break;

                        case 'string':
                        case 'text':
                            recordData['fields'][field.longname] = this[fieldName].trim(); // if text, wrap data inside a cdata, triming extra whitespace
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
                            break;

                        default:
                            recordData['fields'][field.longname]=this[fieldName];
                            break;
                    }
                }
 
                
            }
        };

        //this.log.debug(recordData);
        return JSON.stringify(recordData);
        
    }


    /**
     * Retrieve a record from 4D and populate its instance variables.
     *  
     * @param recordNumber the record # to retrieve (optional, it defaults to the currentRecordNumber property)
     * @param recordID primary key value for the record to retrieve (optional, it defaults to the currentRecordNumber property)
     *    if specified the record is retrieved by querying on its primary key field
     * @param query query string for the record to retrieve (optional, it defaults to the currentRecordNumber property)
     * 
     * @return returns a Promise for the database operation
     * 
     * 
     */
    public getRecord(recordNumber: number = null, recordID: string = null, query: FourDQuery = null): Promise<FourDModel> {
        if (recordNumber || this.recordNumber >= 0) {
            if (recordNumber) this.recordNumber = recordNumber;

            // build request body with record number to retrieve
            let body: any = { Username: FourDInterface.currentUser };
            body.TableName = this.tableName;
            body.RecordNum = this.recordNumber;
            body.VariablesList = base64.encode(utf8.encode(this.getColumnListJSON()));

            return new Promise((resolve, reject) => {
                let me = this;
                this.fourD.call4DRESTMethod('REST_LoadData', body)
                    .subscribe(
                    response => {
                        let jsonData = response.json();
                        /*
                        if (Config.IS_MOBILE_NATIVE()) {
                            // on nativescript
                            jsonData = JSON.parse(jsonData);
                        }
                        */
                        //this.log.debug(jsonData);
                        me.clearRecord();
                        me.populateModelData(jsonData);
                        me.clearRecordDirtyFlag();
                        resolve(me);
                    },
                    error => {
                        //this.log.debug('error:' + error.text());
                        console.log('error:' + error.text());
                        reject(error.text());
                    });
            });

        } else if (recordID) { // get record using its record ID
            if (!this.primaryKey_) {
                // uh-oh no primary key field for this record, duh!
                alert('No Primary Key specified for ' + this.tableName);
            } else {
                // getting a record based on its primary key
                query = {query:[this.tableName + '.' + this.primaryKey_ + ';=;' + recordID]}; // build query on record id
            }

        } else if (!query) { // get record based on a query string
            return new Promise((resolve, reject) => {
                reject('No current record number set, and no query specified!');
            });

        }

        let theModel: any = this.constructor.valueOf();
        let records: FourDCollection = new FourDCollection();
        records.model = theModel;
        let me = this;

        // first we send to query to 4D to get all records that match the query criteria
        // then if at lest 1 record is returned by 4D, we use it's record number to refresh to complete record contents
        return new Promise((resolve, reject) => {
            records.getRecords(query, [this.primaryKey_])
                .then((reclist) => {
                    if (records.models.length > 0) {
                        me.recordNumber = records.models[0].recordNumber; // set the record number and refresh it
                        me.refresh().then((rec) => { rec.clearRecordDirtyFlag(); resolve(me); }).catch((error) => { reject(error); });
                    } else reject('recordNotFound');
                })
                .catch((error) => { reject(error); });
        });


    }

    /**
     * Refresh current record, grab a fresh copy from 4D
     * 
         * @return returns a Promise for the database operation
     * 
     */
    public refresh(): Promise<FourDModel> {
        if (this.recordNumber >= 0) {
            return this.getRecord(this.recordNumber);
        } else return new Promise((resolve, reject) => {
            reject('No current record number set!');
        });

    }


    /**
     * insert a new record in the database.
     *  
         * @return returns a Promise for the database operation
     * 
     * <p><i>the primary key property is set after the record is inserted</i></p>
     * 
     */
    public insertRecord(): Promise<string> {
        let body: any = { Username: FourDInterface.currentUser };
        body.TableName = this.tableName;
        body.RecordNum = this.recordNumber;
        if (this.fourdSaveCallbackMethod_) body.CallBackMethod = this.fourdSaveCallbackMethod_;
        body.Action = 'add';
        body.RecordData = base64.encode(utf8.encode(this.recordToJSON('add', false)));

        return new Promise((resolve, reject) => {
            let me = this;
            this.fourD.call4DRESTMethod('REST_PostData', body)
                .subscribe(
                response => {
                    let jsonData = response.json();
                    /*
                    if (Config.IS_MOBILE_NATIVE()) {
                        // on nativescript
                        jsonData = JSON.parse(jsonData);
                    }
                    */
                    if (jsonData.returnCode === 'OK') {
                        // insert record went OK, retrieve calculated return code & record ID
                        me.recordNumber = jsonData['_recnum'];
                        if (me.primaryKey_ && me.primaryKey_ !== '') me[me.primaryKey_] = jsonData['recordID'];
                        me.clearRecordDirtyFlag(); // clean up modified fields
                        resolve(<any>me);
                    } else reject(jsonData.returnCode);
                },
                error => {
                    //this.log.debug('error:' + error.text());
                    console.log('error:' + error.text());
                    reject(error.text());
                });
        });


    }

    /**
 * update record in the database.
 *  
     * @return returns a Promise for the database operation
 * 
 */
    public updateRecord(): Promise<string> {
        if (this.recordNumber >= 0) {
            let body: any = { Username: FourDInterface.currentUser };
            body.TableName = this.tableName;
            body.RecordNum = this.recordNumber;
            if (this.fourdSaveCallbackMethod_) body.CallBackMethod = this.fourdSaveCallbackMethod_;
            body.Action = 'update';
            body.RecordData = base64.encode(utf8.encode(this.recordToJSON('update', false)));

            return new Promise((resolve, reject) => {
                let me = this;
                this.fourD.call4DRESTMethod('REST_PostData', body)
                    .subscribe(
                    response => {
                        let jsonData = response.json();
                        /*
                        if (Config.IS_MOBILE_NATIVE()) {
                            // on nativescript
                            jsonData = JSON.parse(jsonData);
                        }
                        */
                        if (jsonData.returnCode === 'OK') {
                            // update record went OK
                            me.clearRecordDirtyFlag(); // clean up modified fields
                            resolve(<any>me);
                        } else reject(jsonData.returnCode);
                    },
                    error => {
                        //this.log.debug('error:' + error.text());
                        console.log('error:' + error.text());
                        reject(error.text());
                    });
            });


        } else return new Promise((resolve, reject) => {
            reject('No current record number set!');
        });
    }

    /**
 * delete current record
 *  
 * @param cascade true|false indicates if 4D should perform a cascade delete (optional, default=false).
 * 
     * @return returns a Promise for the database operation
 * 
 */
    public deleteRecord(cascade: boolean = false): Promise<string> {
        if (this.recordNumber >= 0) {
            let body: any = { Username: FourDInterface.currentUser };
            body.TableName = this.tableName;
            body.RecordNum = this.recordNumber;
            if (this.fourdDeleteCallbackMethod_) body.CallBackMethod = this.fourdDeleteCallbackMethod_;
            body.Action = 'delete';
            if (cascade) body.cascadeDelete = cascade;

            return new Promise((resolve, reject) => {
                let me = this;
                this.fourD.call4DRESTMethod('REST_PostData', body)
                    .subscribe(
                    response => {
                        let jsonData = response.json();
                        /*
                        if (Config.IS_MOBILE_NATIVE()) {
                            // on nativescript
                            jsonData = JSON.parse(jsonData);
                        }
                        */
                        if (jsonData.returnCode === 'OK') {
                            // delete record went OK
                            resolve(<any>me);
                        } else reject(jsonData.returnCode);
                    },
                    error => {
                        //this.log.debug('error:' + error.text());
                        console.log('error:' + error.text());
                        reject(error.text());
                    });
            });



        } else return new Promise((resolve, reject) => {
            reject('No current record number set, and no query specified!');
        });

    }

    /**
     * Populates model from attributes/properties on a json Object
     * 
     *  @param recordData json object whoe properties will be used to populate model
     */
    public populateModelData(recordData: Object) {
        if (recordData.hasOwnProperty('_recnum')) this.recordNumber = recordData['_recnum'];
        for (var field in recordData) {
            if (field !== '_recnum' && recordData.hasOwnProperty(field)) {
                if (this.getFieldProperties(field) && this.getFieldProperties(field).type === 'json') this[field] = JSON.parse(recordData[field])
                else this[field] = recordData[field];
            }
        }

    }

    /**
     * Retrieves a list of records using a query string 
     * 
     * @param query
     * 	@param columnList custom column list to retrieve, JSON listing the columns to retrieve.
     * <p>if informed, only the columns listed will be retrieved instead of the whole record</p>
     * 
     * 	@param startRec the starting record number to retrieve, used for paging.
     * 	@param numOfRecords the number of records to retrieve, the default -1 will retrieve all records in the resulting query.
     *  @param filterOptions
     *  @param orderBy optional order By clause to retrieve records in a set order.
     * <p> in the format:</p>
     *    &gt;table.field : to sort records by table.field in ascending order
     *    &lt;table.field : to sort records by table.field in descending order
     * 
     * 
     * @return returns a Promise for the database operation
     */
    public getRecords(query: FourDQuery = null, columns: Array<string> = null, startRec: number = 0, numOfRecords: number = -1, filter: string = null, orderby: string = null): Promise<FourDCollection> {
        let theModel: any = this.constructor.valueOf();
        let records: FourDCollection = new FourDCollection();
        records.model = theModel;
        return new Promise((resolve, reject) => {
            records.getRecords(query, (columns) ? columns : this.getColumnList(), startRec, numOfRecords, filter, orderby)
                .then((reclist) => { resolve(records); })
                .catch((error) => { reject(error); });
        });

    }

    /**
     * @public
       * @return current record number (4D's record number, equivalent to ROWID)
     *
     */
    public get recordNumber(): number {
        return this._recnum;
    }
    public set recordNumber(v: number) { this._recnum = v; }

    /**
     * @public
     * Checks to see if a record is currently loaded
     *
     * @param field field description for the Class definition
     * @return true if field is on a related table
     *
     */
    public isRecordLoaded(): boolean {
        return (this.recordNumber >= 0);
    }


    /**
     * clear record modified flag. 
     * This can be used when one changes a record programmatically, but does not want to set the record modified flag.
     * Fon exampe on records initialization
     * 
     */
    public clearRecordDirtyFlag() {
        this._modified = {};					// clear modified fields list
    }


    /**
     * test to see if current record has been modified.
     *  
     * @return true indicates that some of the record's properties/fields has been modified.
     * 
     */
    public recordIsDirty(): boolean {
        for (let field of this.fields) {
            if (this._modified.hasOwnProperty(field.name)) return true;
        }
        return false;
    }


    /**
     * prepares the record's JSON field description to send to 4D
     */
    public getColumnListJSON(): string {
        let colList: Array<Object> = [];
        let fields: Array<IFieldDescription> = this.fields;
        for (let col of fields) {
            if (col.formula) {
                colList.push({ name: col.name, formula: col.formula });
            } else if (col.subTable) {
                let subFields: Array<Object> = [];
                for (let sub of col.subTable.fields) {
                    subFields.push({ name: sub.name, field: sub.longname });
                };
                colList.push({ name: col.name, subTable: col.subTable.tableName, joinFK: col.joinFK, joinPK: col.joinPK, subFields: subFields });

            } else colList.push({ name: col.name, field: col.longname });
        }

        return JSON.stringify(colList);

    }

    /**
     * returns an array with all fields defined for this data model
     */
    public getColumnList(includeSubTables: boolean = false): Array<any> {
        let cols: Array<any> = [];
        let fields: Array<IFieldDescription> = this.fields;
        for (let col of fields) {
            if (!this.isSubtable(col) || includeSubTables) {
                if (col.formula) {
                    cols.push(col);
                } else cols.push(col.name);
            }
        };
        return cols;
    }

    /**
     * Returns a field's longname, given its field name
     * @param fieldName the field name
     */
    public getLongname(fieldName:string):string {
        for (let field of this.fields) {
            if (field.name === fieldName) return field.longname;
        }

        // not found, assume table.field
        return this.tableName + '.' + fieldName;
    }

    //-----------------------
    // Private methods
    //-----------------------

    /**
     * @private
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
     * @private
     * Checks to see if a field contents has been modified
     *
     * @param field field/property name
     * @return true if field has been modified
     *
     */
    private isModifiedField(field: string): boolean {
        return this._modified.hasOwnProperty(field);
    }

    /**
     * @private
     * Checks to see if a field is a calculated field
     *
     * @param field field description for the Class definition
     * @return true if field is on a related table
     *
     */
    private isCalculatedField(field: IFieldDescription): boolean {
        return (field.formula !== undefined);
    }

    /**
     * @private
     * Checks to see if a field is a related many subtable
     *
     * @param field field description for the Class definition
     * @return true if field is a related many subtabletable
     *
     */
    private isSubtable(field: IFieldDescription): boolean {
        return (field.subTable !== undefined);
    }

    /**
     * @private
     * Checks to see if a field is read only
     *
     * @param field field description for the Class definition
     * @return true if field is read only
     *
     */
    private isReadOnly(field: IFieldDescription): boolean {
        return field.readonly;
    }



}

