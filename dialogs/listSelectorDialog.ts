import { Component, ContentChild, ElementRef, ViewContainerRef, OnInit, Input } from '@angular/core';

import { Modal } from '../angular2-modal/providers/Modal';
import { ModalDialogInstance } from '../angular2-modal/models/ModalDialogInstance';
import { ICustomModalComponent } from '../angular2-modal/models/ICustomModalComponent';
import { ModalConfig } from '../angular2-modal/models/ModalConfig';

@Component({
    selector: 'list-selector',
    moduleId: module.id,
    template: `
        <div style="display:flex;flex-direction:column;margin:10px;height:calc(100% - 30px);">
            <select size="20" class="largeFieldEntry" style="height:90%;padding:5px;margin-bottom:10px;" (change)="changeSelection($event)" (dblclick)="ok($event)">
                <option *ngFor='let item of itemsList; let i=index' value="{{item}}" title="{{tipsList[i]}}" class="selectorItem">{{item}}</option>
            </select>
            <button class="regularButton" style="width:70px;align-self:flex-end;margin-right:5px;" (click)="ok($event)">Select</button>
        </div>
   `,
    providers: [Modal]
})

export class ListSelectorDialog implements ICustomModalComponent {
    public static dialogConfig: ModalConfig = <ModalConfig>{size: 'sm', 
            selfCentered:true,
            isResizable: true,
            isModal: true,
            isBlocking: true,
            title:'Select...',
            width:400, height:350};

    @Input() public itemsList:string[] = [];
    @Input() public tipsList:string[] = [];
   
    public set height(v) {this.config.height = v};
    public set width(v) {this.config.width = v};
    public set title(v) {this.config.title = v};


    public set modelContentData(v) {
        this.itemsList = v.list;
        this.tipsList = v.tips;
    }

    private config :ModalConfig;

    private selectedIndex = -1;


    constructor(public dialog: ModalDialogInstance, private modal:Modal) {
        this.config = ListSelectorDialog.dialogConfig;
    }

    /**
     * Show Me - show the list selector dialog and return a Promise
     */
    public show(list:string[], tips?:string[]):Promise<string> {
        if (!tips) tips = list;
        return this.modal.open(ListSelectorDialog, {list:list, tips:tips}, this.config);
    }

    changeSelection(ev) {
        this.selectedIndex = ev.target.selectedIndex;
    }

    ok($event) {
        $event.stopPropagation();
        this.dialog.close(this.selectedIndex);
    }

}

