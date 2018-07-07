import { Component } from '@angular/core';


import { ICustomModal } from '../models/ICustomModal';
import { ICustomModalComponent } from '../models/ICustomModalComponent';
import { ModalDialogInstance } from '../models/ModalDialogInstance';

/**
 * Data definition
 */
export class YesNoModalContent {
    constructor(
        public title: string = 'Hello World Title',
        public body: string = 'Hello World Body!',
        public hideNo: boolean = false,
        public yesText: string = 'YES',
        public noText: string = 'NO'
    ) { }
}

/**
 * A 2 state bootstrap modal window, representing 2 possible answer, true/false.
 */
@Component({
    selector: 'modal-content',
    /* tslint:disable */ template:
        `<div class="modal-header">
        <h3 class="modal-title">{{context.title}}</h3>
        </div>
        <div class="modal-body">{{context.body}}</div>
        <div class="modal-footer">
            <button class="btn btn-primary" (click)="ok($event)">{{context.yesText}}</button>
            <button [hidden]="context.hideNo" class="btn btn-warning" (click)="cancel()">{{context.noText}}</button>
        </div>`
})
export class YesNoModal implements ICustomModalComponent {
    dialog: ModalDialogInstance;
    context: YesNoModalContent;

    public set modelContentData(parms: ICustomModal) {
        if (parms) {
            this.context = <YesNoModalContent>parms;
        }
    }

    constructor(dialog: ModalDialogInstance, ) {
        this.dialog = dialog;
    }

    ok($event) {
        $event.stopPropagation();
        this.dialog.close(true);
    }

    cancel() {
        this.dialog.close(false);
    }
}
