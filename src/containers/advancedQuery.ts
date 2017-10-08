import { Component, ContentChild, ElementRef, ViewContainerRef, AfterViewInit, Input } from '@angular/core';

import { ModalDialogInstance } from '../angular2-modal/models/ModalDialogInstance';
import { ICustomModal } from '../angular2-modal/models/ICustomModal';
import { ICustomModalComponent } from '../angular2-modal/models/ICustomModalComponent';
import { ModalConfig } from '../angular2-modal/models/ModalConfig';
import { FourDInterface } from '../js44D/JSFourDInterface';

@Component({
    selector: 'advanced-query',
    moduleId: module.id,
    templateUrl: 'advancedQuery.html',
    styleUrls: ['advancedQuery.css']
})

export class AdvancedQueryComponent implements ICustomModalComponent, AfterViewInit {
    public static dialogConfig: ModalConfig = <ModalConfig>{size: 'sm',
            selfCentered:true,
            isResizable: false,
            isModal: true,
            isBlocking: true,
            title:'Advanced Query',
            width:570, height:100};

    @Input() public fieldList: Array<any> = [];
    @Input() public comparatorList = ['=','!=','>','>=','<','<=','begins with','contains','ends with'];
    @Input() public queryFieldList = [{id:'query0',field:{type:'string', name:''}, comparator:'=', value:'', connector:'And', queryTable:'', listOfFields:this.fieldList}];
    @Input() public relatedOneTables = [];

    private currentTable = '';
    private windowHeight = 100;
    private windowWidth = 570;

    public set modelContentData(v:any) {
        this.fieldList = [];
        v.model.fields.forEach(element => {
            if (!element.related && element.longname && element.longname != '') this.fieldList.push(element)
        });
        this.currentTable = v.model.tableName;
        if (v.previousQuery) {
            this.queryFieldList = v.previousQuery;
        } else {
            this.queryFieldList = [{id:'query0',field:{type:'string', name:''}, comparator:'=', value:'', connector:'And', queryTable:'', listOfFields:this.fieldList}];
        }
        this.relatedOneTables = [this.currentTable];
        for (var index = 0; index < this.fieldList.length; index++) {
            var element = this.fieldList[index];
            if (element.relatesTo && element.relatesTo !== '') {
                this.relatedOneTables.push(element.relatesTo.split('.')[0]);
            }

        }
   }

    constructor ( private fourD:FourDInterface, public dialog: ModalDialogInstance) {}


    ngAfterViewInit() {
        this.dialog.setTitle('Advanced Query: '+this.currentTable);
        this.windowHeight += 35*(this.queryFieldList.length - 1);
        this.windowWidth = (this.queryFieldList.length > 1)?630:570;
        this.dialog.kendoDialog.setOptions({height:this.windowHeight, width:this.windowWidth});
    }

    selectField(event,queryField) {
        if (event.target.selectedIndex > 0) {
            queryField.field = queryField.listOfFields[event.target.selectedIndex-1];
        } else {
            queryField.field  = {type:'string', name:''};
        }
    }

    isItemSelected(field:any, queryField: any): string {
        return (queryField.name === field.name) ? 'selected' : '';
    }

    doQuery() {
        let queryItems = [];
        this.queryFieldList.forEach(element => {
            if (element.field.name !== '' && element.comparator !== '') {
                let theField:any = element.field;
                if (element.comparator === '!=') element.comparator = '#';
                queryItems.push(theField.longname + ';' + element.comparator + ';' + element.value + ';' + element.connector);
            }
        });
        this.dialog.close({query:queryItems, queryFields:this.queryFieldList});
    }

    moreLines() {
        let queryID = 'query'+this.queryFieldList.length;
        this.queryFieldList.push({id:queryID,field:{type:'string', name:''}, comparator:'=', value:'', connector:'And', queryTable:this.currentTable, listOfFields:this.fieldList}); // add a new query line
        this.windowHeight += 35;
        this.windowWidth = (this.queryFieldList.length > 1)?630:570;
        this.dialog.kendoDialog.setOptions({height:this.windowHeight, width:this.windowWidth});
  }

    lessLines() {
        this.queryFieldList.pop(); // remove last item
        this.windowHeight -= 35;
        this.windowWidth = (this.queryFieldList.length > 1)?630:570;
        this.dialog.kendoDialog.setOptions({height:this.windowHeight, width:this.windowWidth});
    }

    showRelatedTable(event, queryField: any) {
        queryField.queryTable = event.target.textContent;
        this.fourD.call4DRESTMethod('REST_GetFieldsInTable',{TableName:queryField.queryTable})
        .subscribe(response => {
            let resultJSON = response.json();
            queryField.listOfFields = resultJSON.fieldList;
        });
    }
}
