import { Component, ContentChild, ElementRef, ViewContainerRef, AfterViewInit, Input } from '@angular/core';

import { ModalDialogInstance } from '../angular2-modal/models/ModalDialogInstance';
import { ICustomModal } from '../angular2-modal/models/ICustomModal';
import { ICustomModalComponent } from '../angular2-modal/models/ICustomModalComponent';
import { ModalConfig } from '../angular2-modal/models/ModalConfig';
import { FourDInterface } from '../js44D/JSFourDInterface';

@Component({
    selector: 'advanced-query',
    moduleId: module.id,
    template: `
    <form>
    <div *ngFor='let queryField of queryFieldList' style="display: inline-flex; margin: 5px; height: 30px;">
        <div style="align-self: center;">
            <nav id="nav">
                <ul id="navigation">
                    <li style="margin-left: -40px;"><h4 href="#" [hidden]="relatedOneTables.length < 2">&raquo;</h4>
                        <ul>
                            <li *ngFor='let relatedTable of relatedOneTables' (click)="showRelatedTable($event,queryField)"><h5>{{relatedTable}}</h5></li>
                        </ul>
                    </li>
                </ul>
            </nav>
        </div>
        <div style="margin-left: -25px; align-self: center;">
            <select  class='fourDDropdown' (change)='selectField($event,queryField)' [(value)]='queryField.field.name' style="width:250px;height:20px;">
                <option value=''></option>
                <option *ngFor='let field of queryField.listOfFields' value='{{field.name}}' [selected]='isItemSelected(field,queryField)'>{{field.longname}}</option>
            </select>       
        </div>
        <div style="margin-left: 5px; align-self: center;">
            <select   (change)='queryField.comparator = $event.target.value' [(value)]='queryField.comparator' style="height:20px;">
                <option *ngFor='let item of comparatorList' value='{{item}}' >{{item}}</option>
            </select>       
        </div>
        <div [ngSwitch]="queryField.field.type" style="margin-left: 5px; align-self: center;">
            <input *ngSwitchCase="'string'"  [name]="queryField.id" type="text" class="fieldEntry"  style="width:180px;height:20px;" [(ngModel)]="queryField.value"/>
            <input *ngSwitchCase="'Date'"  [name]="queryField.id" type="date" class="fieldEntry"  style="width:125px;height:20px;" [(ngModel)]="queryField.value"/>
            <input *ngSwitchCase="'Time'"  [name]="queryField.id" type="time" class="fieldEntry"  style="width:100px;height:20px;" [(ngModel)]="queryField.value"/>
            <input *ngSwitchCase="'number'"  [name]="queryField.id" type="number" class="fieldEntry"  style="width:80px;height:20px;" [(ngModel)]="queryField.value"/>
            <input *ngSwitchCase="'float'"  [name]="queryField.id" type="number" class="fieldEntry"  style="width:80px;height:20px;" [(ngModel)]="queryField.value"/>
            <input *ngSwitchCase="'boolean'"  [name]="queryField.id" type="checkbox" class="fieldEntry"  style="width:80px;height:20px;" [(ngModel)]="queryField.value"/>
        
        </div>
        <div style="margin-left: 5px; align-self: center;" [hidden]="queryFieldList.length < 2 || queryField.id === 'query0'">
            <select   (change)='queryField.connector = $event.target.value' [(value)]='queryField.connector' style="height:20px;">
                <option value='And' >And</option>
                <option value='Or' >Or</option>
            </select>       
        </div>
     </div>

    <div style="margin: 10px; width:550px; display: inline-flex;">
        <div style="flex-grow: 1;">
            <button class="regularButton" style="width:100px;" (click)="moreLines()">More...</button>
            <button class="regularButton" style="width:100px;" (click)="lessLines()" [hidden]="queryFieldList.length < 2">Less...</button>
        </div>
        <button class="regularButton" style="width:100px;" (click)="doQuery()">Query</button>
    </div>

</form>
    `,
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
                queryItems.push(theField.longname + ';' + element.comparator + ';' + element.value + ';' + element.connector);
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
