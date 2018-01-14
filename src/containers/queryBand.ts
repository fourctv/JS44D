import { Directive, Component, EventEmitter, ElementRef, ContentChild, Input } from '@angular/core';

@Directive({
    selector: 'queryband'
})
export class QueryBandDirective {
    /**
     * Get access to the embedded custom query band
     */
    @ContentChild('customQueryBand') theCustomQuery: any;

}
@Directive({
    selector: 'custombuttonbar'
})
export class CustomButtonBarDirective { }


@Component({
    selector: 'query-band',
    template: `
    <div dropdown class="btn-group btn-group-md query-band">
        <a role="button" class="btn" (click)="switchState()"><span class="glyphicon" [ngClass]="openStateIcon"></span></a>
        <a role="button" class="btn" [ngClass]="enableButton('QBE')" (click)="doQBE()"><span class="quickFinder-icon quickFinder-query-icon" title="advanced query"></span></a>
        <a role="button" class="btn" [ngClass]="enableButton('QFF')" (click)="doQFF()"><span class="quickFinder-icon quickFinder-qff-icon" title="query using a text file"></span></a>
        <a role="button" class="btn" [ngClass]="enableButton('Sets')" (click)="false" dropdownToggle><span class="quickFinder-icon quickFinder-manageSets-icon" title="search sets management"></span></a>
            <ul *dropdownMenu class="dropdown-menu">
                <li role="menuitem"><a class="dropdown-item" (click)="doManageSets('selectHighlited')">Select Highlighted</a></li>
                <li class="divider dropdown-divider"></li>
                <li role="menuitem"><a class="dropdown-item" (click)="doManageSets('reuseSearch')">Reuse a Saved Search</a></li>
                <li role="menuitem"><a class="dropdown-item" (click)="doManageSets('restoreSet')">Restore a Saved Record Set</a></li>
                <!-- <li role="menuitem"><a class="dropdown-item" (click)="doManageSets('combineSearches')">Combine Searches</a></li> -->
                <li class="divider dropdown-divider"></li>
                <li *ngIf="doWehaveAQuery()" role="menuitem"><a class="dropdown-item" (click)="doManageSets('saveSearch')">Save Current Search</a></li>
                <li role="menuitem"><a class="dropdown-item" (click)="doManageSets('saveSet')">Save Record Set</a></li>
                <li class="divider dropdown-divider"></li>
                <li role="menuitem"><a class="dropdown-item" (click)="doManageSets('manageSearches')">Manage Saved Searches</a></li>
                <li role="menuitem"><a class="dropdown-item" (click)="doManageSets('manageSets')">Manage Saved Sets</a></li>
            </ul>
        <a role="button" class="btn" (click)="doRefresh()"><span class="quickFinder-icon quickFinder-refresh-icon" title="refresh query"></span></a>
        <!-- <a role="button" class="btn" [ngClass]="enableButton('Sort')" (click)="doSort()"><span class="quickFinder-icon quickFinder-sort-icon" title="multi-column sort"></span></a> -->
        <a role="button" class="btn" (click)="doClear()"><span class="quickFinder-icon quickFinder-clear-icon" title="clear query form"></span></a>
        <a role="button" class="btn" [ngClass]="enableButton('Export')" (click)="doExportGrid()"><span class="quickFinder-icon quickFinder-export-icon" title="export grid data"></span></a>

        <div class="custom-button-bar">
            <ng-content select="custombuttonbar"></ng-content>
            <button type="button" class="regularButton mat-raised-button mat-primary" color="primary" style="width:70px;margin-left: 5px;" (click)="doAddRecord()" [ngClass]="enableButton('ADD')">Add</button>
            <button type="button" class="regularButton mat-raised-button mat-primary" color="primary" style="width:70px;margin-left: 5px;" (click)="doEditRecord()" [ngClass]="enableButton('EDIT')">Edit</button>
            <button type="button" class="regularButton mat-raised-button mat-warn" color="warn" style="width:70px;margin-left: 5px;" (click)="doDeleteRecord()" [ngClass]="enableButton('DEL')">Delete</button>
        </div>
    </div>
    <div [hidden]="!queryBandIsOpen" class="custom-query-band">
        <ng-content select="queryband"></ng-content>
    </div>

    `,
    styles: [`
    .quickFinder-icon {
        border-color: transparent;
        width: 24px;
        height: 24px;
        display:inline-block;
    }
    
    .hidden {
        display:none;
    }
       
    .query-band {
        width:100%;
        padding-top:5px;
        height:40px;
    }

    .custom-query-band {
        margin-bottom:10px;
        margin-left:5px;
        margin-top:5px;
        padding: 5px;
        border: 2px;
        border-style: groove;
        border-radius: 5px;
    }

    .custom-button-bar {
        position:absolute;
        right:20px;
    }
    `]
})

export class QueryBand {

    /**
     * enable QBE button, default is true
     **/
    @Input() public enableQBE = true;

    /**
     * enable QFF (query from file) button, default is false
     **/
    @Input() public enableQFF = false;

    /**
     * enable Save/Load Searches/Set buttons, default is true
     **/
    @Input() public enableSETS = true;

    /**
     * enable Combine Searches buttons, default is true
     **/
    @Input() public enableCombiSearch = true;

    /**
     * enable Multicolumn Sort button, default is false
     **/
    @Input() public enableSort = false;

    /**
     * enable Export To Excel button, default is true
     **/
    @Input() public enableExportGrid = true;

    /**
     * Enable Record Edit Button bar, default is false
     */
    @Input() public enableButtonBar = false;

    /**
     * Enable Add record button, default is false
     */
    @Input() public enableAddRecord = false;

    /**
     * Enable Edit record button, default is true
     */
    @Input() public enableEditRecord = true;

    /**
     * Enable Delete record button, default is false
     */
    @Input() public enableDeleteRecord = false;

    /**
     * Cascade Delete record if Delete is enabled, default is false
     */
    @Input() public cascadeDeleteRecord = false;

    //
    // Events emitted by the QueryBand
    //
    queryFromQBE: EventEmitter<any> = new EventEmitter();
    queryFromFile: EventEmitter<any> = new EventEmitter();
    queryRefresh: EventEmitter<any> = new EventEmitter();
    querySortGrid: EventEmitter<any> = new EventEmitter();
    queryExportGrid: EventEmitter<any> = new EventEmitter();

    queryManageSets: EventEmitter<any> = new EventEmitter();

    //
    // Events emitted by the QueryBand's Button Bar
    //
    queryAddRecord: EventEmitter<any> = new EventEmitter();
    queryEditRecord: EventEmitter<any> = new EventEmitter();
    queryDeleteRecord: EventEmitter<any> = new EventEmitter();

    //
    // Internal variables
    //
    public openStateIcon = 'glyphicon-triangle-right';

    public queryBandIsOpen = false;

    /**
     * Get access to the embedded custom query band
     */
    @ContentChild(QueryBandDirective) theQueryBand: any;

    constructor(private elementRef: ElementRef) {
    }


    public switchState() {
        this.queryBandIsOpen = !this.queryBandIsOpen;
        this.openStateIcon = (this.queryBandIsOpen) ? 'glyphicon-triangle-bottom' : 'glyphicon-triangle-right';
    }

    public enableButton(btn: string): string {
        switch (btn) {
            case 'QBE':
                return (this.enableQBE) ? '' : 'hidden';

            case 'QFF':
                return (this.enableQFF) ? '' : 'hidden';

            case 'Sets':
                return (this.enableSETS) ? '' : 'hidden';

            case 'Sort':
                return (this.enableSort) ? '' : 'hidden';

            case 'Export':
                return (this.enableExportGrid) ? '' : 'hidden';

            case 'ADD':
                return (this.enableButtonBar && this.enableAddRecord) ? '' : 'hidden';

            case 'EDIT':
                return (this.enableButtonBar && this.enableEditRecord) ? '' : 'hidden';

            case 'DEL':
                return (this.enableButtonBar && this.enableDeleteRecord) ? '' : 'hidden';
        }

        return '';
    }

    public doQBE() {
        this.queryFromQBE.emit();
    }

    public doQFF() {
        this.queryFromFile.emit(null);
    }

    public doManageSets(action) {
        this.queryManageSets.emit(action);
    }

    public doRefresh() {
        if (this.theQueryBand.theCustomQuery) { this.queryRefresh.emit(this.theQueryBand.theCustomQuery.currentQuery); }
    }

    public doSort() {
        this.querySortGrid.emit(null);
    }

    public doClear() {
        const theForm: any = $(this.elementRef.nativeElement.getElementsByTagName('form'));
        if (theForm && theForm.length > 0) { theForm[0].reset(); }
    }

    public doExportGrid() {
        this.queryExportGrid.emit(null);
    }

    public doAddRecord() {
        this.queryAddRecord.emit(null);
    }

    public doEditRecord() {
        this.queryEditRecord.emit(null);
    }

    public doDeleteRecord() {
        this.queryDeleteRecord.emit(null);
    }

    public doWehaveAQuery(): boolean {
        return (this.theQueryBand.theCustomQuery.currentQuery && this.theQueryBand.theCustomQuery.currentQuery !== '');
    }
}
