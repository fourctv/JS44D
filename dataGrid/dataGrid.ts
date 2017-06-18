//****************************
// Datagrid Directive 
//    based on kendoui-grid: http://demos.telerik.com/kendo-ui/grid/index
//****************************

import { Component, Injectable, EventEmitter, ViewChild, AfterViewInit, Input } from '@angular/core';


import { FourDModel } from '../js44D/JSFourDModel';
import { FourDCollection } from '../js44D/JSFourDCollection';
import { FourDQuery } from '../js44D/JSFourDInterface';

@Component({
    selector: 'datagrid',
    template: `
    <div #theGrid style="height:100%;">
    </div>`
})

@Injectable()
export class DataGrid implements AfterViewInit {
    //
    // Declare kendui-grid configuration
    //
    /**
     * Grid columns definition, follows kendo-ui format
     */
    @Input() public columns: any[] = [];
    
    /**
     * defined how grid selection should work (defaults to single, row)
     */
    @Input() public selectionMode: string = 'single,row';
    
    /**
     * flag to indicate if grid is editable, individual columns can have their own setting (defaults to false)
     */
    @Input() public editable: string = 'false';
    
    /**
     * flag to indicate if grid is filterable, individual columns can have their own setting (defaults to true)
     */
    @Input() public filterable: boolean = true;
    
    /**
     * flag to indicate if grid is sortable, individual columns can have their own setting (defaults to true)
     */
    @Input() public sortable: boolean = true;
       
    /**
     * flag to indicate if the column menu should be active for all columns on the grid (defaults to true)
     */
    @Input() public columnMenu: boolean = true;
 
    /**
     * Grid height
     */
    @Input() public height: string = '100%';
    
    /**
     * Filename to use when exporting to Excel
     */
    @Input() public excelFilename: string = null;

    /**
     * Various pageable options
     */
    /**
     * enable refresh button on the paging bar (default true)
     */
    @Input() public pageableRefresh:boolean = true;
    
    /**
     * to display page sizes drop down on the paging toolbar (default true)
     */
    @Input() public pageableSizes:boolean = true;
    
    /**
     * defines max number of buttons to display on the pahing toolbar (default 5) 
     */
    @Input() public pageableButtonCount:number = 5;
    
    /**
     * defines message to display on the paging toolbar
     */
    @Input() public pageableMessage:string = '{0} - {1} of {2} items';

    /**    
    * the associated data model for the records to be retrieved
    */
    @Input() set model(v: FourDModel) { this._model = v; if (this.dataProvider) this.dataProvider.model = <any>v; }
    get model(): FourDModel { return this._model; }

    /**
     * option to use lazyloading, leavig paging to be done on server side (defaults to true)
     */
    @Input() public useLazyLoading: boolean = true; // defaults to true
    
    		
    /**
     * if using a dataClass, this flag will optimize the loading of data, by bringing only the columns used on the grid
     * thus avoiding bringing data that is not used on the grid
     * only meaningful if using a dataClass
     */
    @Input() public optimizeGridLoading: boolean = false;

    /**
     * if using lazyloading, define the # of records to retrieve from 4D
     */
    @Input() public pageSize: number = 50;
    
    //
    // events emitted by the DataGrid
    //
    recordSelected: EventEmitter<any> = new EventEmitter();
    loadDataComplete: EventEmitter<any> = new EventEmitter();

    //
    // private stuff
    //
    private _model: FourDModel = null;

    //
    // this is the datamodel interface to 4D backend
    //
    private dataProvider: FourDCollection; // this is the Backbone model used to bring in records

    //
    // this is the kendoui grid object
    //
    private gridObject: kendo.ui.Grid;
    
    //
    // define the dataSource used to populate/handle the grid's interface to 4D
    //
    private dataSource = new kendo.data.DataSource({
        transport: {
            read: (options: kendo.data.DataSourceTransportOptions) => {
                //console.log(options);
                let modelDef = <any>(this.model);
                let newModel: FourDModel = <any>(new modelDef());

                let start = (options.data.pageSize && options.data.pageSize > 0 && this.useLazyLoading) ? options.data.skip : 0;
                let numrecs = (options.data.pageSize && options.data.pageSize > 0 && this.useLazyLoading) ? options.data.pageSize : -1;
                // now build filter if set
                let filter = [];
                if (options.data.filter) {

                    options.data.filter.filters.forEach((item: kendo.data.DataSourceFilterItem) => {
                        let comparator = '=';
                        switch (item.operator) {
                            case 'eq':
                                comparator = '=';
                                break;
                            case 'neq':
                                comparator = '#';
                                break;
                            case 'startswith':
                                comparator = 'begins with';
                                break;
                            case 'endswith':
                                comparator = 'ends with';
                                break;
                            case 'isempty':
                                comparator = '=';
                                item.value = '';
                                break;
                            case 'isnotempty':
                                comparator = '#';
                                item.value = '';
                                break;

                            default:
                                comparator = <any>item.operator;
                                break;
                        }
                        filter.push(newModel.tableName + '.' + item.field + ';' + comparator + ';' + item.value + ';' + options.data.filter.logic);
                    });
                }

                let orderby = '';
                if (options.data.sort && options.data.sort.length > 0) {
                    options.data.sort.forEach((item: kendo.data.DataSourceSortItem) => {
                        orderby += (item.dir === 'asc') ? '>' : '<';
                        orderby += newModel.tableName + '.' + item.field + '%';
                    });
                }

                let query:FourDQuery = this.dataProvider.queryString;

                if (filter.length >0) {
                    if (this.dataProvider.queryString) {
                        query = {intersection:[query, {query:filter}]};
                    } else {
                        query = {query:filter};
                    }
                }
                let me = this;
                this.dataProvider.getRecords(query, (this.optimizeGridLoading) ? this.columns : null, start, numrecs, this.dataProvider.filterQuery, orderby)
                    .then((reclist) => {
                        options.success(me.dataProvider.models);
                    });

            },
            destroy: (options) => {
                console.log('delete', options);
            },
            update: (options) => {
                console.log('update', options);
            },
            create: (options) => {
                console.log('create', options);
            },
            parameterMap: (options, operation) => {
                console.log('map', options);
                if (operation !== 'read' && options.models) {
                    return { models: kendo.stringify(options.models) };
                } else return options;
            }
        },
        schema: {

            total: (response) => {
                //console.log('total');
                return this.dataProvider.totalRecordCount;
            }
        },
        serverPaging: this.useLazyLoading,
        serverSorting: this.useLazyLoading,
        serverFiltering: this.useLazyLoading,
        serverGrouping: this.useLazyLoading,
        pageSize: this.pageSize
    });


    @ViewChild('theGrid') public theGrid: any;

    //
    // Declare data provider properties
    //
    set queryString(v: FourDQuery) { if (this.dataProvider) this.dataProvider.queryString = v; }
    set orderBy(v: string) { if (this.dataProvider) this.dataProvider.orderBy = v; }
    set filterQuery(v: string) { if (this.dataProvider) this.dataProvider.filterQuery = v; }

    /**
     * currently selected record on the grid
     */
    get currentRecord(): FourDModel {
        if (this.dataProvider && this.dataProvider.currentRecord) {
            if (this.dataProvider.currentRecord.tableName === '') {
                this.dataProvider.currentRecord.tableName = (<any>this.model).prototype.tableName;
                this.dataProvider.currentRecord.tableNumber = (<any>this.model).prototype.tableNumber;
                this.dataProvider.currentRecord.fields = (<any>this.model).prototype.fields;
            }
            return this.dataProvider.currentRecord;
        } else return null;
    }
    set currentRecord(v: FourDModel) { this.dataProvider.currentRecord = v; }

    /**
     * record count on the current selection
     */
    get recordCount(): number { return (this.dataProvider) ? this.dataProvider.totalRecordCount : 0; }


    /**
     * after our view gets initialized, instantiate the grid and its dataProvider
     */
    ngAfterViewInit() {
        this.initializeGrid();

        $(this.theGrid.nativeElement).on('dblclick', 'tr.k-state-selected', ($event) => { this.dblClickRow($event); });
    }

    /**
     * Populate the grid withthe result of a 4D query
     * @param query: the querys tring to send to 4D
     * @param filter: filter options to send to 4D, to the applies on the query result
     * @param orderby: order by statement to send to 4D, defining the record sort order
     */
    loadData(query: FourDQuery = null, filter: string = null, orderby: string = null) {
        if (this.dataProvider) {
            this.queryString = query;
            this.filterQuery = filter;
            this.orderBy = orderby;

            let me = this;
            this.dataSource.fetch()
                .then(() => {
                    //me.dataSource.data(me.dataProvider.models);
                    me.loadDataComplete.emit(me.dataProvider.models.length);
                });
        }
    }

    setDataSource(data: Array<any>) {
        this.gridObject.dataSource.data(data);
    }

    setOptions(options: kendo.ui.GridOptions) {
        if (this.gridObject) this.gridObject.setOptions(options);
    }

    rowClicked(event) {
        //console.log('click',event);
        if (this.dataProvider) {
            let item = this.gridObject.dataItem(this.gridObject.select());
            this.dataProvider.currentRecord = this.findRecordForThisItem(item);
        }
    }

    dblClickRow(event) {
        //console.log('dblclick', event);
        if (this.dataProvider && this.dataProvider.currentRecord) this.recordSelected.emit(this.dataProvider.currentRecord);
    }


    refresh() {
        this.gridObject.refresh();
    }

    /**
     * return currently selected grid row
     */
    selectedRow():Object {
        if (this.gridObject.table) {
            if (this.gridObject.select()) {
                return this.gridObject.dataItem(this.gridObject.select());
            } else return null; 
        } else return null; 
    }

    /**
     * return currently selected grid row index
     */
    selectedRowIndex():number {
        if (this.gridObject.table) {
            if (this.gridObject.select()) {
                let ret = -1;
                let item = this.gridObject.dataItem(this.gridObject.select());
                if (this.dataProvider) {
                    this.dataProvider.models.forEach((element,index) => {
                        if (element['_recnum'] === item['_recnum']) ret = index;
                    });
                } else if ((<any>this.gridObject).dataItems().length > 0 && this._model && this._model.primaryKey_ && this._model.primaryKey_ !== '') {
                        (<any>this.gridObject).dataItems().forEach((element,index) => {
                        if (element[this._model.primaryKey_] === item[this._model.primaryKey_]) ret = index;
                    });
                }

                return ret;
            } else return -1;    
        } else return -1;    
    }
    
    /**
     * return currently selected rows indices, if multiple selection allowed
     */
    selectedRows():Array<number> {
        let rows = this.gridObject.select();
        let selectedRecords = [];
        for (var index = 0; index < rows.length; index++) {
            selectedRecords.push(rows[index]['rowIndex']);
        };

        return selectedRecords;
    }

    /**
     * Export gird data to Excel
     */
    exportGridToExcel() {
        if (this.excelFilename) {
            this.gridObject.setOptions({ excel: { fileName: this.excelFilename } });
        }
        this.gridObject.saveAsExcel();
    }
    
    /**
     * Find grid item in the data provider
     */
    findRecordForThisItem(item: any): FourDModel {
        if (!item) return null; // nothing selected...

        let ret = null;
        if (this.dataProvider) {
            this.dataProvider.models.forEach(element => {
                if (element['_recnum'] === item['_recnum']) ret = element;
            });
        } else if ((<any>this.gridObject).dataItems().length > 0 && this._model && this._model.primaryKey_ && this._model.primaryKey_ !== '') {
            (<any>this.gridObject).dataItems().forEach(element => {
                if (element[this._model.primaryKey_] === item[this._model.primaryKey_]) ret = element;
            });

        }
        return ret;
    }

    /**
     * Remove row from grid
     */
    removeRow(row:number) {
        if (this.dataProvider && this.dataProvider.models.length > row) {
            // if we have a data provider and a valid row index 
            this.dataProvider.models.splice(row,1);
        } else if ((<any>this.gridObject).dataItems().length > row) {
            (<any>this.gridObject).dataItems().splice(row,1);
            this.gridObject.refresh();
        }
    }

    setColumnConfig(columns) {
        this.gridObject.destroy();
        $(this.theGrid.nativeElement).empty();
       // $(this.theGrid.nativeElement).remove();

        this.dataProvider.columns = this.columns;
        this.columns = columns;
        this.initializeGrid();
    }

    setExternalDataSource(dataSource, columns) {
        this.gridObject.destroy();
        $(this.theGrid.nativeElement).empty();
       // $(this.theGrid.nativeElement).remove();

        //this.dataProvider.columns = this.columns;
        this.dataSource = dataSource;
        this.columns = columns;
        this.initializeGrid();
    }

    getDataProvider() {return this.dataProvider;}


    private initializeGrid() {
        if (this._model) {
            this.dataProvider = new FourDCollection(); // this is the Backbone model used to bring in records
            this.dataProvider.model = this._model;
            this.dataProvider.columns = this.columns;
        }

        $(this.theGrid.nativeElement).kendoGrid({
            dataSource: (this.dataProvider) ? this.dataSource : null,
            excel: { allPages: true, filterable: true },
            change: ($event) => { this.rowClicked($event); },
            autoBind: false,
            pageable:{  refresh: this.pageableRefresh, 
                        pageSize: this.pageSize,
                        pageSizes: this.pageableSizes,  
                        buttonCount: this.pageableButtonCount,
                        messages: {display: this.pageableMessage}},
            //scrollable: { virtual: this.useLazyLoading },
            resizable: true,
            selectable: this.selectionMode,
            editable: this.editable,
            filterable: this.filterable,
            sortable: this.sortable,
            height: this.height,
            columnMenu: this.columnMenu,
            columns: this.columns
        });

        this.gridObject = $(this.theGrid.nativeElement).data('kendoGrid');

    }
}
