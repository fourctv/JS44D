import { Injectable, ReflectiveInjector } from '@angular/core';
import { Base64 } from './base64';
import { Utf8 } from './utf8';

import { FourDInterface, FourDQuery } from './JSFourDInterface';
import { FourDModel } from './JSFourDModel';

/**
 * This class represents a Collection of FourDModels and provides functionality to populate the Collection, fetching records from a 4D Database
 */
@Injectable()
export class FourDCollection {

    //
    // FourDCollection properties
    //
    /** the model this collection is based on */
    public model: any;
    /** array of models in the collection */
    public models: Array<any> = [];
    /** default order by string */
    public orderBy: string;
    /** default query string */
    public queryString: FourDQuery = null;
    /** default filter to be applied on all queries */
    public filterOptions: string;

    /** the default list of field/column names to be populated on each Collection record data */
    public columns: Array<any> = [];

    /** holds current record from the current selection */
    public currentRecord: FourDModel;
    /** holds the total # of records found on the latest query */
    public totalRecordCount = 0;

    /** injected FourDInterface service */
    private fourD: FourDInterface;

    //
    // constructor: initialize collection properties
    //
    constructor() {
        // inject FourDInterface
        //const injector = ReflectiveInjector.resolveAndCreate([FourDInterface]);
        //this.fourD = injector.get(FourDInterface);
        this.fourD = FourDInterface.interfaceInstance;
    }

    /**
     * prepares the JSON field description to send to 4D, listing the columns to retrieve
     * 
     *  @param columns a string Array with the list of field/column names to retrieve for each record; if null, the default list of columns defined in the Collection will be retrieved
     * 
     *  @returns a JSON string listing the fields/columns to retrieve for each record
     */
    public getColumnListJSON(columns: Array<any>): string {
        if (!columns) { columns = this.columns; }
        const colList: Array<Object> = [];
        const modelDef = <any>(this.model);
        let theModel: FourDModel = <any>(new modelDef());
        let fld: any;
        for (const col of columns) {
            if (typeof (col) === 'string') {
                if (col.indexOf('.') > 0) { // is this a longname field?
                    colList.push({ name: col.substr(col.indexOf('.') + 1), field: col });
                } else { // nope, so let's see if we have it in our datamodel
                    fld = theModel.getFieldProperties(col);
                    if (fld) { // field in our datamodel, use its properties
                        if (fld.formula) {
                            colList.push({ name: fld.name, formula: fld.formula });
                        } else if (fld.longname) { colList.push({ name: fld.name, field: fld.longname }); }
                    }
                }
            } else if (col.field) {
                theModel = <any>(new modelDef());
                fld = theModel.getFieldProperties(col.field);
                if (fld) {
                    if (fld.formula) {
                        colList.push({ name: fld.name, formula: fld.formula });
                    } else if (fld.longname) { colList.push({ name: fld.name, field: fld.longname }); }
                }
            } else {
                if (col.formula) {
                    colList.push({ name: col.name, formula: col.formula });
                } else if (fld.longname) { colList.push({ name: col.name, field: col.longname }); }
            }
        }

        return JSON.stringify(colList);

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
     * @returns returns a Promise for the database operation, whose result is an Array of FourDModel records returned by 4D
     */
    public getRecords(query: FourDQuery = null, columns: Array<string> = null, startRec: number = 0, numOfRecords: number = -1, filter: string = null, orderby: string = null): Promise<Array<FourDModel>> {
        if (!query) {
            query = this.queryString;
        }
        if (columns) {
            this.columns = columns;
        }
        if (!filter || filter === '') {
            filter = this.filterOptions;
        }
        if (!orderby || orderby === '') {
            orderby = this.orderBy;
        }

        const body: any = { Username: FourDInterface.currentUser };
        const modelDef = <any>(this.model);
        let newModel: FourDModel = <any>(new modelDef());
        body.TableName = newModel.tableName;
        body.StartRec = startRec;
        body.NumRecs = numOfRecords;

        body.QueryString = JSON.stringify(query);
        body.Columns = Base64.encode(Utf8.utf8encode((columns) ? this.getColumnListJSON(columns) : this.getColumnListJSON(newModel.getColumnList())));

        if (filter) { body.FilterOptions = filter; }
        if (orderby) { body.OrderBy = orderby; }

        return new Promise((resolve, reject) => {
            // const me = this;
            this.fourD.call4DRESTMethod('REST_GetRecords', body)
                .subscribe(resultJSON => {
                    this.totalRecordCount = 0;
                    this.models = [];
                    if (resultJSON && resultJSON['selected'] && resultJSON['records']) {
                        this.totalRecordCount = resultJSON['selected'];
                        const recList: Array<any> = resultJSON['records'];
                        recList.forEach(record => {
                            newModel = <any>(new modelDef());
                            newModel.populateModelData(record);
                            newModel.clearRecordDirtyFlag();
                            this.models.push(newModel);
                        });
                    }

                    resolve(<any>this.models);
                },
                error => {
                    console.log('error:' + error);
                    reject(error);
                });
        });

    }

    /**
     * returns the length of the Collection, or the # of records loaded in
     */
    public get length(): number {
        return this.models.length;
    }


}

