import { Component, ElementRef, ViewContainerRef, AfterViewInit, Input } from '@angular/core';

import { ModalDialogInstance } from '../angular2-modal/models/ModalDialogInstance';
import { ICustomModal } from '../angular2-modal/models/ICustomModal';
import { ICustomModalComponent } from '../angular2-modal/models/ICustomModalComponent';
import { ModalConfig } from '../angular2-modal/models/ModalConfig';
import { FourDInterface } from '../js44D/JSFourDInterface';

@Component({
    selector: 'advanced-query',
    templateUrl: 'advancedQuery.html',
    styles: [`
    /* Main Navigation */
    
     
    ul#navigation {
        margin:0px auto;
        position:relative;
        float:left;
    }
     
    ul#navigation li {
        display:inline;
        float:left;
    
    }
     
    ul#navigation li h5 {
        padding:5px 5px 5px 15px;
        display:inline-block;
        margin: 5px 0 0 0;
        width: 100%;
    }
     
    ul#navigation li h5:hover {
        background:#f8f8f8;
        color:#282828;
    }
     
    
     
    ul#navigation li:hover > a {
        background:#fff;
    }
    /* Drop-Down Navigation */
    ul#navigation li:hover > ul
    {
    /*these 2 styles are very important,
    being the ones which make the drop-down to appear on hover */
        visibility:visible;
        opacity:1;
    }
     
    ul#navigation ul, ul#navigation ul li ul {
        list-style: none;
        margin-left: 10px;
        padding: 0;
    /*the next 2 styles are very important,
    being the ones which make the drop-down to stay hidden */
        visibility:hidden;
        opacity:0;
        position: absolute;
        z-index: 99999;
        width:180px;
        background:#ddd;
        box-shadow:1px 1px 3px #ccc;
    /* css3 transitions for smooth hover effect */
        -webkit-transition:opacity 0.2s linear, visibility 0.2s linear;
        -moz-transition:opacity 0.2s linear, visibility 0.2s linear;
        -o-transition:opacity 0.2s linear, visibility 0.2s linear;
        transition:opacity 0.2s linear, visibility 0.2s linear;
    }
     
    ul#navigation ul {
        top: 25px;
        left: 10px;
    }
     
    ul#navigation ul li ul {
        top: 0;
        left: 181px; /* strong related to width:180px; from above */
    }
     
    ul#navigation ul li {
        clear:both;
        width:100%;
        border:0 none;
        border-bottom:1px solid #c9c9c9;
    }
        
    `]
})

export class AdvancedQueryComponent implements ICustomModalComponent, AfterViewInit {
    public static dialogConfig: ModalConfig = <ModalConfig>{
        size: 'sm',
        selfCentered: true,
        isResizable: false,
        isModal: true,
        isBlocking: true,
        title: 'Advanced Query',
        width: 570, height: 100
    };

    @Input() public fieldList: Array<any> = [];
    @Input() public comparatorList = ['=', '!=', '>', '>=', '<', '<=', 'begins with', 'contains', 'ends with'];
    @Input() public queryFieldList = [{ id: 'query0', field: { type: 'string', name: '' }, comparator: '=', value: '', connector: 'And', queryTable: '', listOfFields: this.fieldList }];
    @Input() public relatedOneTables = [];

    private currentTable = '';
    private windowHeight = 100;
    private windowWidth = 570;

    public set modelContentData(v: any) {
        this.fieldList = [];
        v.model.fields.forEach(field => {
            if (!field.related && field.longname && field.longname !== '') { this.fieldList.push(field) }
        });
        this.currentTable = v.model.tableName;
        if (v.previousQuery) {
            this.queryFieldList = v.previousQuery;
        } else {
            this.queryFieldList = [{ id: 'query0', field: { type: 'string', name: '' }, comparator: '=', value: '', connector: 'And', queryTable: '', listOfFields: this.fieldList }];
        }
        this.relatedOneTables = [this.currentTable];
        for (let index = 0; index < this.fieldList.length; index++) {
            const element = this.fieldList[index];
            if (element.relatesTo && element.relatesTo !== '') {
                this.relatedOneTables.push(element.relatesTo.split('.')[0]);
            }

        }
    }

    constructor(private fourD: FourDInterface, public dialog: ModalDialogInstance) { }


    ngAfterViewInit() {
        this.dialog.setTitle('Advanced Query: ' + this.currentTable);
        this.windowHeight += 35 * (this.queryFieldList.length - 1);
        this.windowWidth = (this.queryFieldList.length > 1) ? 630 : 570;
        this.dialog.kendoDialog.setOptions({ height: this.windowHeight, width: this.windowWidth });
    }

    selectField(event, queryField) {
        if (event.target.selectedIndex > 0) {
            queryField.field = queryField.listOfFields[event.target.selectedIndex - 1];
        } else {
            queryField.field = { type: 'string', name: '' };
        }
    }

    isItemSelected(field: any, queryField: any): string {
        return (queryField.name === field.name) ? 'selected' : '';
    }

    doQuery() {
        const queryItems = [];
        this.queryFieldList.forEach(element => {
            if (element.field.name !== '' && element.comparator !== '') {
                const theField: any = element.field;
                if (element.comparator === '!=') { element.comparator = '#'; }
                const theValue = (theField.type === 'Date')?element.value.replace(/-/g,''):element.value;
                queryItems.push(theField.longname + ';' + element.comparator + ';' + theValue + ';' + element.connector);
            }
        });
        this.dialog.close({ query: queryItems, queryFields: this.queryFieldList });
    }

    moreLines() {
        const queryID = 'query' + this.queryFieldList.length;
        this.queryFieldList.push({ id: queryID, field: { type: 'string', name: '' }, comparator: '=', value: '', connector: ' And', queryTable: this.currentTable, listOfFields: this.fieldList }); // add a new query line
        this.windowHeight += 35;
        this.windowWidth = (this.queryFieldList.length > 1) ? 630 : 570;
        this.dialog.kendoDialog.setOptions({ height: this.windowHeight, width: this.windowWidth });
    }

    lessLines() {
        this.queryFieldList.pop(); // remove last item
        this.windowHeight -= 35;
        this.windowWidth = (this.queryFieldList.length > 1) ? 630 : 570;
        this.dialog.kendoDialog.setOptions({ height: this.windowHeight, width: this.windowWidth });
    }

    showRelatedTable(event, queryField: any) {
        queryField.queryTable = event.target.textContent;
        this.fourD.call4DRESTMethod('REST_GetFieldsInTable', { TableName: queryField.queryTable })
            .subscribe(resultJSON => {
                queryField.listOfFields = resultJSON.fieldList;
            });
    }
}
