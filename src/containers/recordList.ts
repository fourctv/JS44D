import { Component, ContentChild, ElementRef, ViewContainerRef, AfterContentInit, Input } from '@angular/core';

import { QueryBand } from './queryBand';
import { AdvancedQueryComponent } from './advancedQuery';
import { DataGrid } from '../dataGrid/dataGrid';
import { Modal } from '../angular2-modal/providers/Modal';
import { ICustomModalComponent } from '../angular2-modal/models/ICustomModalComponent';
import { ModalDialogInstance } from '../angular2-modal/models/ModalDialogInstance';
import { ModalConfig } from '../angular2-modal/models/ModalConfig';
import { ListSelectorDialog } from '../dialogs/listSelectorDialog';

@Component({
    selector: 'record-list',
    template: '<div class="recordList" (resize)="windowResized($event)"><ng-content></ng-content></div>',
    providers: [ListSelectorDialog, Modal]
})

export class RecordList implements AfterContentInit {

    /**
     * this is the associated record list dialog, if set we use it to handle window resize
     */
    @Input() public dialogInstance: ModalDialogInstance = null;

    /**
     * this is the associated record edit dialog, if set dbl-cliking a row or hitting the Add/Edit buttons will open it
     */
    @Input() public editWindow: ICustomModalComponent = null;

    /**
     * get the associated Query band and Datagrid object instances
     */
    @ContentChild(QueryBand) queryBand: QueryBand;
    @ContentChild(DataGrid) theGrid: DataGrid;

    /**
     * Save Edit Window Configuration
     */
    private _editWindowConfig: ModalConfig;

    private _previousQuery:Object;
    private _previousAdvancedQuery:any;

    //
    // We need access to a Modal dialog component, to open an associated Record Edit Form 
    //
    constructor(private modal: Modal, private elementRef: ElementRef, private viewRef:ViewContainerRef, private selectList:ListSelectorDialog) {
    }

    /**
     * AFter our view gets initialized, subscribe to various events on the Query band and the Grid
     */
    ngAfterContentInit() {
        // if we have a query band, then subscribe to the query refresh and export to excel buttons
        if (this.queryBand) {
            // if user hits Refresh button, call grid refresh method
            this.queryBand.queryRefresh.subscribe((query: Object) => { this.refreshGrid(query); });
            // if user hits Advanced Query button, call advanced query method
            if (this.queryBand.enableQBE) this.queryBand.queryFromQBE.subscribe((query: Object) => { this.showAdvancedQuery(); });
            // if user hits Set Management button, call corresponding method method
            if (this.queryBand.enableSETS) this.queryBand.queryManageSets.subscribe((action: string) => { this.doManageSets(action); });
            // it used hits Export to Excel, call grid's excel export method
            this.queryBand.queryExportGrid.subscribe(() => { if (this.theGrid) this.theGrid.exportGridToExcel(); });

            if (this.editWindow) {
                this.queryBand.queryAddRecord.subscribe(() => { this.showEditWindow('add'); });
                this.queryBand.queryEditRecord.subscribe(() => { this.showEditWindow('edit'); });
            }

            this.queryBand.queryDeleteRecord.subscribe(() => { this.deleteRecord(); });

        }

        // if we have a grid and an associated edit record form, subscribe to the record select event
        if (this.theGrid && this.editWindow) {
            this.theGrid.recordSelected.subscribe((record: any) => { this.showEditWindow('edit'); });
        }

        if (this.editWindow && this.editWindow['dialogConfig']) {
            this._editWindowConfig = this.editWindow['dialogConfig'];
        }

        if (this.dialogInstance) {
//            console.log(this.dialogInstance)
            let dialog:any= $(this.dialogInstance.contentRef.location.nativeElement).data('kendoWindow');
            dialog.resizing._draggable.userEvents.bind("release", (event) => {this.windowResized(event)});
        }
    }

    /**
     * Clear all previous queries
     */
    public clearQuery() {
        this._previousAdvancedQuery = null;
        this._previousQuery = null;
    }


    /**
     * Refresh teh Grid, run query on 4D side and get records to display
     * @param query: the query string to send to 4D to select records to display on the grid
     */
    public refreshGrid(query?: Object) {
        if (!query) query = this._previousQuery; // if no query given, try previous
        if (query && this.theGrid) this.theGrid.loadData(query);
        this._previousQuery = query; // save last queryDeleteRecord
    }


    /**
     * Intercept Dialog Window resize event and resize the Grid to fit the entire window
     * @param event 
     */
    public windowResized(event) {
        this.theGrid.resize(); // refresh datagrid to adjust it to the window size
    }

    /**
     * Show record edit window, to either edit or add a new record
     */
    private showEditWindow(mode: string) {
        // if editing a record, and we do have a record selected and an edit dialog does exist
        if (this.theGrid && this.editWindow && mode === 'edit' && this.theGrid.currentRecord) {
            if (this.theGrid.optimizeGridLoading) { // if we are optimizing the grid, then we need to refresh selected record
                kendo.ui.progress($(this.elementRef.nativeElement), true); // show loading progress icon
                this.theGrid.currentRecord.refresh().then(() => { // refresh current record
                    kendo.ui.progress($(this.elementRef.nativeElement), false); // clear loading progress icon
                    this.modal.openInside(<any>this.editWindow, this.viewRef, this.theGrid.currentRecord, this._editWindowConfig, true)
                        .then(result => {this.editWindowHandler(result);}); // open edit dialog
                });
            } else {
                // if not optimizing the grid loading, then we have a complete record loaded already
                this.modal.openInside(<any>this.editWindow, this.viewRef, this.theGrid.currentRecord, this._editWindowConfig, true)
                    .then(result => {this.editWindowHandler(result);}); // open edit dialog
            }
        }

        if (this.theGrid && this.editWindow && mode === 'add') {
            // if we are adding a new record
            let modelDef = <any>(this.theGrid.model);
            let newModel = <any>(new modelDef());
            this.modal.openInside(<any>this.editWindow, this.viewRef, newModel, this._editWindowConfig, true); // open edit dialog
        }
    }

    /** 
     * Delete Selected Record(s)
     */
    private deleteRecord() {
        if (this.theGrid && this.theGrid.currentRecord) {
            if (confirm((this.queryBand.cascadeDeleteRecord)?'Really delete selected record and all its associated data records?':'Really delete selected record?')) {
                this.theGrid.currentRecord.deleteRecord(this.queryBand.cascadeDeleteRecord)
                    .then((message) => { alert('Record Deleted'); this.queryBand.doRefresh(); })
                    .catch((reason) => { alert(reason); });
            }
        }
    }

    /**
     * private method to deal with edit window close
     */
    private editWindowHandler(result:string) {
        if (result === 'recordSaved') this.refreshGrid();
    }

    /**
     * deal with advanced Query dialog
     */
    private showAdvancedQuery() {
        let advancedQuery = AdvancedQueryComponent;
        let modelDef = <any>(this.theGrid.model);
        let newModel = <any>(new modelDef());
        this.modal.openInside(AdvancedQueryComponent, this.viewRef, {previousQuery: this._previousAdvancedQuery, model:(newModel.tableName !== '')?newModel:(<any>this.theGrid.model).prototype}, advancedQuery['dialogConfig'])
            .then((result:any) => {
                if (result.query.length > 0) {
                    this._previousAdvancedQuery = result.queryFields;
                    this.refreshGrid({query:result.query}); // open edit dialog
                }
            });

    }

    /**
     * Handle Manage Sets dropdown menu and act upon user selected action
     */
    private doManageSets(action:string) {
        let modelDef = <any>(this.theGrid.model);
        let newModel = <any>(new modelDef());
        let tableName = (newModel.tableName !== '')?newModel.tableName:(<any>this.theGrid.model).prototype.tableName; 
        let pk = (newModel.tableName !== '')?newModel.primaryKey_:(<any>this.theGrid.model).prototype.primaryKey_;
        let gridRows = this.theGrid.getDataProvider().models;

        switch (action) {
            case 'selectHighlited':
                if (pk && pk !== '') {
                    let selectedRows = this.theGrid.selectedRows();
                    let selectedRecords = [];
                    for (var index = 0; index < selectedRows.length; index++) {
                        let rowIndex:any = selectedRows[index];
                        selectedRecords.push(gridRows[rowIndex][pk]);
                    };
                    this.restoreSet(selectedRecords);
                }

                break;
        
            case 'saveSearch':
                kendo.prompt("Please, enter a name for this Search:", "").then((searchName) => {
                    if (searchName !== '') {
                        let savedSearches = JSON.parse(localStorage.getItem(tableName+'_savedSearches')) || [];
                        savedSearches.push({name:searchName, search:this._previousQuery});
                        localStorage.setItem(tableName+'_savedSearches', JSON.stringify(savedSearches));
                    }
                }, function () {
                    // cancelled...
                })
                 break;

            case 'saveSet':
                if (pk && pk !== '' && gridRows.length > 0) {
                    kendo.prompt("Please, enter a name for this Record Set:", "").then((setName) => {
                        if (setName !== '') {
                            let savedSets = JSON.parse(localStorage.getItem(tableName+'_savedSets')) || [];

                            let gridRows = this.theGrid.getDataProvider().models;
                            let selectedRecords = [];
                            for (var index = 0; index < gridRows.length; index++) {
                                selectedRecords.push(gridRows[index][pk]);
                            };

                            savedSets.push({name:setName, set:selectedRecords});
                            localStorage.setItem(tableName+'_savedSets', JSON.stringify(savedSets));
                        }
                    }, function () {
                        // cancelled...
                    })
                }
                break;
        
            case 'reuseSearch':
                let savedSearches:Array<any> = JSON.parse(localStorage.getItem(tableName+'_savedSearches')) || [];
                let searchList = [];
                savedSearches.forEach(element => {
                    searchList.push(element.name);
                });
                if (searchList.length > 0) {
                    this.selectList.title = 'Select Saved Search';
                    this.selectList.show(searchList)
                    .then(result => {
                        let query = savedSearches[result].search;
                        this.refreshGrid(query);
                    }); // open list selector dialog
                }
                break;
        
            case 'restoreSet':
                let savedSets:Array<any> = JSON.parse(localStorage.getItem(tableName+'_savedSets')) || [];
                let setList = [];
                savedSets.forEach(element => {
                    setList.push(element.name);
                });
                if (setList.length > 0) {
                    this.selectList.title = 'Select Saved Set';
                    this.selectList.show(setList)
                    .then(result => {
                        let set = savedSets[result].set;
                        this.restoreSet(set);
                    }); // open list selector dialog
                }
                break;
        
            case 'combineSearches':
                
                break;
        
            case 'manageSearches':
                savedSearches = JSON.parse(localStorage.getItem(tableName+'_savedSearches')) || [];
                searchList = [];
                savedSearches.forEach(element => {
                    searchList.push(element.name);
                });
                if (searchList.length > 0) {
                    this.selectList.title = 'Delete Saved Search';
                    this.selectList.show(searchList,null,'items deleted immediately','Delete')
                    .then(result => {
                        savedSearches.splice(result,1);
                        localStorage.setItem(tableName+'_savedSearches', JSON.stringify(savedSearches));                        
                    }); // open list selector dialog
                }
                
                break;
        
            case 'manageSets':
                savedSets = JSON.parse(localStorage.getItem(tableName+'_savedSets')) || [];
                setList = [];
                savedSets.forEach(element => {
                    setList.push(element.name);
                });
                if (setList.length > 0) {
                    this.selectList.title = 'Delete Saved Set';
                    this.selectList.show(setList,null,'items deleted immediately','Delete')
                    .then(result => {
                        savedSets.splice(result,1);
                        localStorage.setItem(tableName+'_savedSets', JSON.stringify(savedSets));
                    }); // open list selector dialog
                }                
                break;
        }
    }

    private restoreSet(records:Array<number>) {
        let modelDef = <any>(this.theGrid.model);
        let newModel = <any>(new modelDef());
        let tableName = (newModel.tableName !== '')?newModel.tableName:(<any>this.theGrid.model).prototype.tableName;
        let pkField = (newModel.tableName !== '')?newModel.primaryKey_:(<any>this.theGrid.model).prototype.primaryKey_;
        if (pkField && pkField !== '' && tableName && tableName !== '') {
            let queryItems = [];
            records.forEach(id => {
                queryItems.push(tableName+'.'+pkField+';=;'+id+';OR');
            });
            this.refreshGrid({query:queryItems});
         }

   }
}
