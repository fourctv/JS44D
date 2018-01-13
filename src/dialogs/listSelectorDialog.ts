import { Component, ContentChild, ElementRef, ViewContainerRef, OnInit, Input } from '@angular/core';

import { Modal } from '../angular2-modal/providers/Modal';
import { ModalDialogInstance } from '../angular2-modal/models/ModalDialogInstance';
import { ICustomModalComponent } from '../angular2-modal/models/ICustomModalComponent';
import { ModalConfig } from '../angular2-modal/models/ModalConfig';

@Component({
    selector: 'list-selector',
    template: `
        <div style="display:flex;flex-direction:column;margin:10px;height:calc(100% - 30px);">
            <select size="20" class="largeFieldEntry" style="height:90%;padding:5px;margin-bottom:10px;" (change)="changeSelection($event)" (dblclick)="ok($event)">
                <option *ngFor='let item of itemsList; let i=index' value="{{item}}" title="{{tipsList[i]}}" class="selectorItem">{{item}}</option>
            </select>
            <div >
                <label [hidden]="message == ''">{{message}}</label>
                <button class="regularButton mat-raised-button mat-primary" style="width:70px;float:right;margin-right:5px;" (click)="ok($event)">{{buttonText}}</button>
            </div>
        </div>
   `,
    providers: [Modal]
})

export class ListSelectorDialog implements ICustomModalComponent {
    public static dialogConfig: ModalConfig = <ModalConfig>{
        size: 'sm',
        selfCentered: true,
        isResizable: true,
        isModal: true,
        isBlocking: true,
        title: 'Select...',
        width: 400, height: 350
    };

    @Input() public itemsList: string[] = [];
    @Input() public tipsList: string[] = [];
    @Input() public buttonText = 'Select';
    @Input() public message = '';

    public set height(v) { this.config.height = v };
    public set width(v) { this.config.width = v };
    public set title(v) { this.config.title = v };


    public set modelContentData(v) {
        this.itemsList = v.list;
        this.tipsList = v.tips;
        if (v.buttonLabel) { this.buttonText = v.buttonLabel; }
        if (v.message) { this.message = v.message; }
    }

    private config: ModalConfig;

    private selectedIndex = -1;


    constructor(public dialog: ModalDialogInstance, private modal: Modal) {
        this.config = ListSelectorDialog.dialogConfig;
    }

    /**
     * Show Me - show the list selector dialog and return a Promise
     */
    public show(list: string[], tips?: string[], message?: string, buttonLabel?: string): Promise<number> {
        if (!tips) { tips = list; }

        return <any>this.modal.open(ListSelectorDialog, { list: list, tips: tips, message: message, buttonLabel: buttonLabel }, this.config);
    }

    changeSelection(ev) {
        this.selectedIndex = ev.target.selectedIndex;
    }

    ok($event) {
        $event.stopPropagation();
        this.dialog.close(this.selectedIndex);
    }

}

