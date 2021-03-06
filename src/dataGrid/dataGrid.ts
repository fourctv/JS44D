// ****************************
// Datagrid Directive 
//    based on kendoui-grid: http://demos.telerik.com/kendo-ui/grid/index
// ****************************

import { Component, EventEmitter, ViewChild, AfterViewInit, Input, Output, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';


import { FourDModel } from '../js44D/JSFourDModel';
import { FourDCollection } from '../js44D/JSFourDCollection';
import { FourDInterface, FourDQuery } from '../js44D/JSFourDInterface';
import { LOCATION_INITIALIZED } from '../../node_modules/@angular/common';

@Component({
    selector: 'datagrid',
    template: `
    <div #theGrid style="height:100%;border-width: 0;">
    </div>`,
    providers: [HttpClient, FourDInterface]
})

export class DataGrid implements AfterViewInit {
    //
    // Declare kendui-grid configuration
    //
    /**
     * Grid columns definition, follows kendo-ui format
     */
    @Input() public columns: any[] = [];

    /**
     * defines if grid rows are selectable
     */
    @Input() public selectable = true;

    /**
     * defines how grid selection should work (defaults to single, row)
     */
    @Input() public selectionMode = 'single,row';

    /**
     * flag to indicate if grid is editable, individual columns can have their own setting (defaults to false)
     */
    @Input() public editable = 'false';

    /**
     * flag to indicate if grid is filterable, individual columns can have their own setting (defaults to true)
     */
    @Input() public filterable = true;

    /**
     * flag to indicate if grid is sortable, individual columns can have their own setting (defaults to true)
     */
    @Input() public sortable = { mode: 'multiple', allowUnsort: true, showIndexes: true };

    /**
     * flag to indicate if the column reordering is enabled (defaults to true)
     */
    @Input() public reorderable = true;

    /**
     * flag to indicate if the column menu should be active for all columns on the grid (defaults to true)
     */
    @Input() public columnMenu = true;

    /**
     * Grid height
     */
    @Input() public height = '100%';

    /**
     * Filename to use when exporting to Excel
     */
    @Input() public excelFilename: string = null;

    /**
     * Various pageable options
     */
    /**
     * enable the paging bar (default true)
     */
    @Input() public pageable = true;

    /**
     * enable refresh button on the paging bar (default true)
     */
    @Input() public pageableRefresh = true;

    /**
     * to display page sizes drop down on the paging toolbar (default true)
     */
    @Input() public pageableSizes = true;

    /**
     * defines max number of buttons to display on the paging toolbar (default 5) 
     */
    @Input() public pageableButtonCount = 5;

    /**
     * defines message pattern to display on the paging toolbar
     */
    @Input() public pageableMessage = '{0} - {1} of {2} items';
    @Input() public pageableMessageCustom = { display: this.pageableMessage };

    /**    
    * the associated data model for the records to be retrieved
    */
    @Input() set model(v: FourDModel) { this._model = v; if (this.dataProvider) { this.dataProvider.model = <any>v; } }
    get model(): FourDModel { return this._model; }

    /**
     * option to use lazyloading, leaving paging to be done on server side (defaults to true)
     */
    @Input() public useLazyLoading = true; // defaults to true


    /**
     * if using a FourDModel, this flag will optimize the loading of data, by bringing only the columns used on the grid
     * thus avoiding bringing data that is not used on the grid
     * only meaningful if using a dataClass
     */
    @Input() public optimizeGridLoading = false;

    /**
     * if using lazyloading, define the max # of records to retrieve from 4D
     */
    @Input() public pageSize = 50;

    /**
     * controls if header tooltip is enabled for all column headers
     * if a column definition includes a 'headerTemplate' or a 'headerAttributes' attribute, then generic header tooltip is disabled
     * that is to avoid conflict between this generic header tooltip and a possible user defined tooltip
     */
    @Input() public enableHeaderTooltip = true;

    /**
     * Callback function to determine the css class to aply to a row
     * this functions gets called for each row data, after datagrid row data is set
     * it must return a string that represents a css class
     * the function must take 2 arguments:
     * @rowData: is the row data toc test and validate
     * @element: is the HTML element, which can be use to set/change attributes
     * 
     */
    @Input() public setRowClass: (rowData: any, element:any) => string;

    /**
     * indicate that the grid should be resized when the browser window resizes (default is true)
     */
    @Input() public autoResize = true;

    //
    // events emitted by the DataGrid
    //
    @Output() initialized: EventEmitter<any> = new EventEmitter();
    @Output() rowSelected: EventEmitter<any> = new EventEmitter();
    @Output() recordSelected: EventEmitter<any> = new EventEmitter();
    @Output() loadDataComplete: EventEmitter<any> = new EventEmitter();

    //
    // private stuff
    //
    private _model: FourDModel = null;

    //
    // this is the datamodel interface to 4D backend
    //
    public dataProvider: FourDCollection; // this is the FourDCollection instalce used to bring in records

    //
    // this is the kendoui grid object
    //
    public gridObject: kendo.ui.Grid;

    //
    // define the dataSource used to populate/handle the grid's interface to 4D
    //
    private fourDTransport = {
        read: (options: kendo.data.DataSourceTransportOptions) => {
            // console.log(options);
            const modelDef = <any>(this.model);
            const newModel: FourDModel = <any>(new modelDef());
    
            const start = (options.data.pageSize && options.data.pageSize > 0 && (this.useLazyLoading || this.pageable)) ? options.data.skip : 0;
            const numrecs = (options.data.pageSize && options.data.pageSize > 0 && (this.useLazyLoading || this.pageable)) ? options.data.pageSize : -1;
            // now build filter if anything set on the grid
            let filter = null;
            if (options.data.filter) {
                filter = this.parseKendoFilters(options.data.filter); // update code to properly deal with multiple column filters
            }
    
            let gridOrderBy = this.dataProvider.orderBy; // defaults to the Collection Order By
            // if any sorting set on the grid, rebuild Order By using grid options
            if (options.data.sort && options.data.sort.length > 0) {
                gridOrderBy = '';
                options.data.sort.forEach((item: kendo.data.DataSourceSortItem) => {
                    gridOrderBy += (item.dir === 'asc') ? '>' : '<';
                    gridOrderBy += newModel.getLongname(item.field) + '%';
                });
            }
    
            let query: FourDQuery = this.dataProvider.queryString;
    
            if (filter) {
                if (this.dataProvider.queryString) {
                    query = { intersection: [query, filter] };
                } else {
                    query = filter;
                }
            }
            // let me = this;
            this.dataProvider.getRecords(query, (this.optimizeGridLoading) ? this.columns : null, start, numrecs, this.dataProvider.filterOptions, gridOrderBy)
                .then((reclist) => {
                    let data = [];
                    reclist.forEach(element => {
                        data.push(element.extractModelData())
                    });
                    options.success(data);
                    this.resize();
                    this.loadDataComplete.emit(data.length);
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
            } else { return options; }
        }

    }

    //
    // parse Kendo Grid filter and generate corresponding 4D Query
    //
    private parseKendoFilters(filter:kendo.data.DataSourceFilters):any {
        const modelDef = <any>(this.model);
        const newModel: FourDModel = <any>(new modelDef());

        let query:any = null;
        if (filter.filters && filter.filters.length > 0) { // make sure we do have filters
            switch (filter.logic) {
                case 'or':
                    query = {query:[]}
                    filter.filters.forEach((item:kendo.data.DataSourceFilterItem) => {
                        let comparator = '=';
                        switch (item.operator) {
                            case 'eq':
                                comparator = '=';
                                break;
                            case 'neq':
                                comparator = '#';
                                break;
                            case 'gte':
                                comparator = '>=';
                                break;
                            case 'gt':
                                comparator = '>';
                                break;
                            case 'lte':
                                comparator = '<=';
                                break;
                            case 'lt':
                                comparator = '<';
                                break;
                            case 'startswith':
                                comparator = 'begins with';
                                break;
                            case 'endswith':
                                comparator = 'ends with';
                                break;
                            case 'isempty':
                            case 'isnull':
                                comparator = '=';
                                item.value = '';
                                break;
                            case 'isnotnull':
                            case 'isnotempty':
                                comparator = '#';
                                item.value = '';
                                break;

                            default:
                                comparator = <any>item.operator;
                                break;
                        }
                        if (item.value instanceof Date) {
                            query.query.push(newModel.getLongname(item.field) + ';' + comparator + ';' + this.fourD.dateTo4DFormat(item.value) + ';OR');
                        } else {
                            query.query.push(newModel.getLongname(item.field) + ';' + comparator + ';' + item.value + ';OR');
                        }
                      });
                    break;
            
                case 'and':
                    if (filter.filters.length === 1) { // do we have a single filter?
                        if ((filter.filters[0])['filters']) {
                            query = this.parseKendoFilters(<any>filter.filters); // if filter is of an 'or' type
                        } else {
                            query = this.parseKendoFilters({logic: 'or', filters:<any>filter.filters}); // this is a single filter option
                        }
                    } else {
                        query = {intersection:[]};
                        filter.filters.forEach((item:any) => {
                            if (item.filters) {
                                query.intersection.push(this.parseKendoFilters(item)); // if filter is of an 'or' type
                            } else {
                                query.intersection.push(this.parseKendoFilters({ logic: 'or', filters: [item] })); // this is a single filter option
                            }
                        });
                    }
                    break;
                        
                    default:
                        query = this.parseKendoFilters({ logic: 'or', filters: <any>filter.filters }); // this is a single filter option
                    break;
            }
        }
        return query;
    }


    private dataSource = new kendo.data.DataSource({
        transport: this.fourDTransport,
        schema: {

            total: (response) => {
                // console.log('total');
                return this.dataProvider.totalRecordCount;
            }
        },
        serverPaging: true,
        serverSorting: this.pageable || this.useLazyLoading,
        serverFiltering: this.pageable || this.useLazyLoading,
        serverGrouping: this.pageable || this.useLazyLoading,
        pageSize: this.pageSize
    });

    /**
     * if using an external datasource, this field will hold it and be not null
     */
    private externalDataSource: kendo.data.DataSource = null;


    constructor(@Inject(HttpClient) private http: HttpClient, @Inject(FourDInterface) private fourD: FourDInterface) { }

    @ViewChild('theGrid') public theGrid: any;

    //
    // Declare data provider properties
    //
    set queryString(v: FourDQuery) { if (this.dataProvider) { this.dataProvider.queryString = v; } }
    set orderBy(v: string) { if (this.dataProvider) { this.dataProvider.orderBy = v; } }
    set filterQuery(v: string) { if (this.dataProvider) { this.dataProvider.filterOptions = v; } }

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
        } else { return null; }
    }
    set currentRecord(v: FourDModel) { this.dataProvider.currentRecord = v; }

    /**
     * record count on the current selection
     */
    get recordCount(): number { return (this.dataProvider) ? this.dataProvider.totalRecordCount : ((this.gridObject.dataSource) ? this.gridObject.dataSource.data().length : 0); }


    /**
     * after our view gets initialized, instantiate the grid and its dataProvider
     */
    ngAfterViewInit() {
        this.initializeGrid();

        $(this.theGrid.nativeElement).on('dblclick', 'tr.k-state-selected', ($event) => { this.dblClickRow($event); });

        this.initialized.emit();
    }

    /**
     * Populates the grid with the result of a 4D query
     * @param query: the query string to send to 4D
     * @param filter: filter options to send to 4D, to be applied to the query result
     * @param orderby: order by statement to send to 4D, defining the record sort order
     */
    loadData(query: FourDQuery = null, filter: string = null, orderby: string = null) {
        if (this.dataProvider) {
            if (query) { this.queryString = query; }
            if (filter) { this.filterQuery = filter; }
            if (orderby) { this.orderBy = orderby; }

            // if paging is enabled, make sure we go back to page 1, after reloading grid data
            if (this.pageable) {
                if (this.gridObject.pager.page() != 1) {
                    this.gridObject.pager.page(1); // this function reloads page 1, so no need to do a fetch!
                } else {
                    this.dataSource.fetch()
                        .then(() => {
                            this.resize(); // force grid refresh
                        });
                }
            } else {
                this.dataSource.fetch()
                    .then(() => {
                        this.resize(); // force grid refresh
                    });
            }
        }
    }

    setModel(newModel: FourDModel) {
        this.model = newModel;
        if (!this.dataProvider) {
            this.dataProvider = new FourDCollection(); // this is the data model used to bring in records
            this.dataProvider.model = this._model;
        }
    }

    setDataSource(data: Array<any>) {
        this.gridObject.dataSource.data(data);
        setTimeout(() => {
            this.resize(); // force grid refresh, but need to let grid redraw first, so give it a millisecond 
        }, 1);
    }

    setOptions(options: kendo.ui.GridOptions) {
        if (this.gridObject) { this.gridObject.setOptions(options); }
    }

    rowClicked(event) {
        // console.log('click',event);
        if (this.dataProvider && this.gridObject) {
            const item = this.gridObject.dataItem(this.gridObject.select());
            this.dataProvider.currentRecord = this.findRecordForThisItem(item);
            this.rowSelected.emit(this.dataProvider.currentRecord);
        } else {
            if (this.gridObject.select()) {
                this.rowSelected.emit(this.gridObject.dataItem(this.gridObject.select()));
            }
        }
    }

    dblClickRow(event) {
        // console.log('dblclick', event);
        if (this.dataProvider && this.dataProvider.currentRecord) {
            this.recordSelected.emit(this.dataProvider.currentRecord);
        } else {
            if (this.gridObject.select()) {
                this.recordSelected.emit(this.gridObject.dataItem(this.gridObject.select()));
            }
        }
    }


    refresh() {
        this.loadData();
    }

    resize() {
        if (this.gridObject && this.gridObject.element) this.gridObject.resize();  // make sure grid is active
        //
        // if a row class callback function is set, call it for each row
        //
        if (this.setRowClass) {
            setTimeout(() => {
                this.gridObject.dataSource.data().forEach(row => {
                    const element = $('tr[data-uid="' + row['uid'] + '"] ');
                    if (element) {
                        const newClass = this.setRowClass(row, element);
                        if (newClass && newClass != '') { // do we have a css class to assign?
                            element.addClass(newClass);
                        }
                    }
                });
            }, 1);
        }
    }

    /**
     * return currently selected grid row
     */
    selectedRow(): any {
        if (this.gridObject && this.gridObject.table) {
            if (this.gridObject.select()) {
                return this.gridObject.dataItem(this.gridObject.select());
            } else { return null; }
        } else { return null; }
    }

    /**
     * Update currently selected row with data from a 
     * @param newData updated data record to be used to update current selected row
     */
    updateSelectedRowData(newData?:FourDModel) {
        if (!newData) newData = this.currentRecord;
        let row:any = this.selectedRow();
        if (row && newData) {
            this.columns.forEach(col => {
                if (col.field) {
                    row[col.field] = newData[col.field]
                }
            });
            this.gridObject.refresh();
        }
    }


    /**
     * select a specific row on the grid
     * @param index row index to select
     * @param scrollTo flag to indicate if the grid should auto scroll to the selected row
     */
    selectThisRow(index, scrollTo = true) {
        if (index <= this.recordCount) {
            if (this.selectionMode.includes('single')) { // if selection mode is single row, then clear currently selected row
                const cur = this.gridObject.select();
                if (cur.length > 0) {
                    let row = $(cur[0]);
                    if (row.hasClass("k-state-selected")) {
                        row.removeClass("k-state-selected"); // this is a trick to unselect a row!! weird!!
                    }
                }
            }
            if (index > 0) {
                this.gridObject.select('tr:eq(' + (index - 1) + ')');
                if (scrollTo) {
                    const scrollContentOffset = this.gridObject.element.find("tbody").offset().top;
                    const selectContentOffset = this.gridObject.select().offset().top;
                    const distance = selectContentOffset - scrollContentOffset;
                    this.gridObject.element.find(".k-grid-content").animate({ scrollTop: distance }, 0);
                }
                if (this.dataProvider) {
                    const item = this.gridObject.dataItem(this.gridObject.select());
                    this.dataProvider.currentRecord = this.findRecordForThisItem(item);
                }
            }
        }
    }

    /**
     * clear current grid selection
     */
    clearCurrentSelection():void {
        const cur = this.gridObject.select();
        if (cur.length > 0) {
            let row = $(cur[0]);
            if (row.hasClass("k-state-selected")) {
                row.removeClass("k-state-selected"); // this is a trick to unselect a row!! weird!!
            }
        }
        this.currentRecord = null;
    }

    /**
     * return currently selected grid row index
     */
    selectedRowIndex(): number {
        if (this.gridObject && this.gridObject.table) {
            if (this.gridObject.select()) {
                let ret = -1;
                const rows = this.gridObject.select();
                if (rows.length > 0) {
                    ret = rows[0]['rowIndex'];
                } else {
                    const item = this.gridObject.dataItem(this.gridObject.select());
                    if (this.dataProvider) {
                        this.dataProvider.models.forEach((element, index) => {
                            if (element['_recnum'] === item['_recnum']) { ret = index; }
                        });
                    } else if ((<any>this.gridObject).dataItems().length > 0 && this._model && this._model.primaryKey_ && this._model.primaryKey_ !== '') {
                        (<any>this.gridObject).dataItems().forEach((element, index) => {
                            if (element[this._model.primaryKey_] === item[this._model.primaryKey_]) { ret = index; }
                        });
                    }
                }

                return ret;
            } else { return -1; }
        } else { return -1; }
    }

    /**
     * return currently selected rows indices, if multiple selection allowed
     */
    selectedRows(): Array<number> {
        if (this.gridObject) {
            const rows = this.gridObject.select();
            let selectedRecords = [];
            for (let index = 0; index < rows.length; index++) {
                selectedRecords.push(rows[index]['rowIndex']);
            };

            return selectedRecords;

        } else {
            return [];
        }
    }

    /**
     * return currently selected records, if multiple selection allowed
     */
    selectedRecords(): Array<FourDModel> {
        if (this.gridObject) {
            const rows = this.gridObject.select();
            let selectedRecs = [];
            if (this.dataProvider) {
                for (let index = 0; index < rows.length; index++) {
                    let rowIndex = rows[index]['rowIndex'];
                    selectedRecs.push(this.dataProvider.models[rowIndex]);
                };
            } else {
                for (let index = 0; index < rows.length; index++) {
                    selectedRecs.push(this.gridObject.dataItem(rows[index]));
                };
            }

            return selectedRecs;
        } else {
            return [];
        }
    }

    /**
     * Export grid data to Excel
     */
    exportGridToExcel() {
        if (this.excelFilename) {
            this.gridObject.setOptions({ excel: { fileName: this.excelFilename } });
        }
        if (this.externalDataSource) {
            // if an external datasource is set, use its transport
            this.gridObject.setDataSource(this.externalDataSource);
        }

        this.gridObject.saveAsExcel();
    }

    /**
     * Find grid item in the data provider
     */
    findRecordForThisItem(item: any): FourDModel {
        if (!item) { return null; } // nothing selected...

        let ret = null;
        if (this.dataProvider) {
            this.dataProvider.models.forEach(element => {
                if (element['_recnum'] === item['_recnum']) { ret = element; }
            });
        } else if ((<any>this.gridObject).dataItems().length > 0 && this._model && this._model.primaryKey_ && this._model.primaryKey_ !== '') {
            (<any>this.gridObject).dataItems().forEach(element => {
                if (element[this._model.primaryKey_] === item[this._model.primaryKey_]) { ret = element; }
            });

        }
        return ret;
    }

    /**
     * Remove row from grid
     */
    removeRow(row: number) {
        if (this.dataProvider && this.dataProvider.models.length > row) {
            // if we have a data provider and a valid row index 
            this.dataProvider.models.splice(row, 1);
        } else if ((<any>this.gridObject).dataItems().length > row) {
            (<any>this.gridObject).dataItems().splice(row, 1);
            this.gridObject.refresh();
        }
    }

    setColumnConfig(columns) {
        if (this.gridObject) this.gridObject.destroy();
        $(this.theGrid.nativeElement).empty();
        // $(this.theGrid.nativeElement).remove();

        if (this.dataProvider) this.dataProvider.columns = this.columns;
        this.columns = columns;
        this.initializeGrid();
    }

    setExternalDataSource(dataSource, columns) {
        if (this.theGrid && this.gridObject) {
            this.gridObject.destroy();
            $(this.theGrid.nativeElement).empty();

            this.externalDataSource = dataSource;
            this.columns = columns;
            this.initializeGrid();
        }
    }

    getDataProvider() { return this.dataProvider; }


    private initializeGrid() {
        if (this._model) {
            this.dataProvider = new FourDCollection(); // this is the data model used to bring in records
            this.dataProvider.model = this._model;
            this.dataProvider.columns = this.columns;
        }

        if (this.pageable) this.useLazyLoading = false; // need to do this to avoid confusion and cause awkward grid behaviour

        if (this.enableHeaderTooltip) { 
            // if we are enabling header tooltip generically, we need to include specific headerAttributes, in case there are none
            for (const col of this.columns) {
                if (!col.hasOwnProperty('headerTemplate') && col.hasOwnProperty('title') && !col.hidden) {
                    // ignore columns with their own headerTemplate
                    if (col.hasOwnProperty('headerAttributes')) {
                        if (!col.headerAttributes.hasOwnProperty('title')) {
                            col.headerAttributes.title = col.title;
                        }
                    } else {
                        col.headerAttributes = {title: col.title}
                    }
                }
            }
        }

        if (this.filterable && this.dataProvider && this.dataSource && this._model) {
            let schemaModel:any = {fields :{}};
            const modelDef = <any>(this._model);
            const recModel: FourDModel = <any>(new modelDef());
            this.columns.forEach(element => {
                if (element.field) {
                    const field = recModel.getFieldProperties(element.field);
                    if (field) {
                        switch (field.type) {
                            case 'date':
                            case 'Date':
                                schemaModel.fields[element.field] = {type:'date'};
                                break;
                        
                            case 'boolean':
                                schemaModel.fields[element.field] = {type:'boolean'};
                                break;
                        
                            case 'number':
                                schemaModel.fields[element.field] = {type:'number'};
                                break;
                        
                            default:
                                break;
                        }
                    }
                }
            });

            let newDS = new kendo.data.DataSource({
                transport: this.fourDTransport,
                schema: {
                    model: schemaModel,
                    total: (response) => {
                        // console.log('total');
                        return this.dataProvider.totalRecordCount;
                    }
                },
                serverPaging: true,
                serverSorting: this.pageable || this.useLazyLoading,
                serverFiltering: this.pageable || this.useLazyLoading,
                serverGrouping: this.pageable || this.useLazyLoading,
                pageSize: this.pageSize
            });

            if (this.externalDataSource) {
                // if an external datasource is set, use its transport
                newDS['transport'] = this.externalDataSource['transport'];
            }
            this.dataSource = newDS;
        }

        $(this.theGrid.nativeElement).kendoGrid(<any>{
            dataSource: (this.dataProvider) ? this.dataSource : null,
            excel: { allPages: true, filterable: true },
            change: ($event) => { this.rowClicked($event); },
            autoBind: false,
            pageable: (this.pageable) ? {
                refresh: this.pageableRefresh,
                pageSize: this.pageSize,
                pageSizes: this.pageableSizes,
                buttonCount: this.pageableButtonCount,
                messages: this.pageableMessageCustom
            } : false,
            scrollable: (this.useLazyLoading)?{ virtual: this.useLazyLoading }:true,
            resizable: true,
            selectable: (this.selectable) ? this.selectionMode : false,
            editable: this.editable,
            filterable: this.filterable,
            sortable: this.sortable,
            height: this.height,
            reorderable: this.reorderable,
            columnMenu: this.columnMenu,
            columns: this.columns
        });

        this.gridObject = $(this.theGrid.nativeElement).data('kendoGrid');

        if (this.autoResize) {
            window.onresize = () => {this.resize();}
        }
    }
}
