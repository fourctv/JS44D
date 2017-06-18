import { Injectable, ReflectiveInjector } from '@angular/core';
import * as base64 from 'base-64';
import * as utf8 from 'utf8/utf8';

//mport { LogService } from '../../core/services/logging/log.service';
//import { Config } from '../../core/utils/config';

import { FourDInterface, FourDQuery } from './JSFourDInterface';
import { FourDModel } from './JSFourDModel';

@Injectable()
export class FourDCollection {

    //
    // FourDCollection properties
    //
    public model:any; // the model this collection is based on
    public models:Array<any> = []; // array of models in the collection
    public orderBy: string;    // default order by string
    public queryString: FourDQuery = {query:['All']}; // default query string 
    public filterQuery: string; // default filter to be applied on all queries

    public columns: any[] = []; // columns to be populated on the Collection

    public currentRecord: FourDModel; // holds current record from the current selection
    public totalRecordCount: number = 0; // holds the total # of records found on the latst query
        
    public url: string = '/4DAction/REST_GetRecords';
        
    // injected FourDInterface service
    private fourD:FourDInterface;
    
    // the generic log service
    //private log:LogService;
        
    //
    // constructor: initialize collection properties
    //
    constructor(/*@Inject(FourDModel) model?: FourDModel, cols?: any[], query?: string, order?: string, filter?: string*/) {
//        this.model = <any>model;
//        this.columns = cols;
//        this.queryString = query;
//        this.filterQuery = filter;
         // inject FourDInterface
        let injector = ReflectiveInjector.resolveAndCreate([FourDInterface]);
        this.fourD = injector.get(FourDInterface);
        //this.log = FourDInterface.log;
  }

    /**
     * prepares the JSON field description to send to 4D, listing all columns to retrieve
     */
    public getColumnListJSON(columns:Array<any>): string {
        if (!columns) columns = this.columns;
        let colList: Array<Object> = [];
        for (let col of columns) {
            if (typeof (col) === 'string') {
                if (col.indexOf('.') > 0) { // is this a longname field?
                    colList.push({ name: col.substr(col.indexOf('.') + 1), field: col });
                } else { // nope, so let's see if we have it in our datamodel
                    let modelDef = <any>(this.model);
                    let theModel: FourDModel = <any>(new modelDef());
                    var fld = theModel.getFieldProperties(col);
                    if (fld) { // field in our datamodel, use its properties
                        if (fld.formula) {
                            colList.push({ name: fld.name, formula: fld.formula });
                        } else colList.push({ name: fld.name, field: fld.longname });
                     }
                }
            } else if (col.field) {
                let modelDef = <any>(this.model);
                let theModel: FourDModel = <any>(new modelDef());
                var fld = theModel.getFieldProperties(col.field);
                if (fld) {
                    if (fld.formula) {
                        colList.push({ name: fld.name, formula: fld.formula });
                        } else colList.push({ name: fld.name, field: fld.longname });
                }
            } else {
                if (col.formula) {
                    colList.push({ name: col.name, formula: col.formula });
                    } else colList.push({ name: col.name, field: col.longname });
            }
        }
 
        return JSON.stringify(colList);

    }

    /**
     * Retrieves a list of records using a query string 
     *  @param query
     * 	@param columnList custom column list to retrieve, JSON array of the columns to retrieve.
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
        if (!query) {
            query = this.queryString;
        }
        if (columns) {
            this.columns = columns;
        }
        if (!filter || filter === '') {
            filter = this.filterQuery;
        }
        if (!orderby || orderby === '') {
            orderby = this.orderBy;
        }
            
        /*
        return new Promise((resolve, reject) => {
            this.fetch().then((recList) => {resolve(recList);}).fail((error) => {reject(error);});
        });
        */

        let body: any = { Username: FourDInterface.currentUser };
        let modelDef = <any>(this.model);
        let newModel: FourDModel = <any>(new modelDef());
        body.TableName = newModel.tableName;
        body.StartRec = startRec;
        body.NumRecs = numOfRecords;

        body.QueryString = JSON.stringify(query);
        body.Columns = base64.encode(utf8.encode((columns)?this.getColumnListJSON(columns):this.getColumnListJSON(newModel.getColumnList())));

        if (filter) body.FilterOptions = filter;
        if (orderby) body.OrderBy = orderby;

        return new Promise((resolve, reject) => {
            let me = this;
            this.fourD.call4DRESTMethod('REST_GetRecords', body)
                .subscribe(
                response => {
                    me.totalRecordCount = 0;
                    me.models = [];
                    let jsonData:Object = response.json();
                    /*
                    if (Config.IS_MOBILE_NATIVE()) {
                        // on nativescript
                        jsonData = JSON.parse(jsonData);
                    }
                    */
                    if (jsonData && jsonData['selected'] && jsonData['records']) {
                        me.totalRecordCount = jsonData['selected'];
                        let recList: Array<any> = jsonData['records'];
                        recList.forEach(record => {
                            let modelDef = <any>(me.model);
                            let newModel: FourDModel = <any>(new modelDef());
                            newModel.populateModelData(record);
                            me.models.push(newModel);
                        });
                    }

                    resolve(me.models);
                },
                error => {
                    //this.log.debug('error:' + error.text());
                    console.log('error:' + error.text());
                    reject(error.text());
                });
        });

    }

    /**
     * returns the length of the Collection, or the # of records loaded in
     */
    public get length():number {
        return this.models.length;
    }


}

