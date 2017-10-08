import { Component, Input } from '@angular/core';

import { FourDModel } from '../js44D/JSFourDModel';
import { ICustomModal } from '../angular2-modal/models/ICustomModal';
import { ICustomModalComponent } from '../angular2-modal/models/ICustomModalComponent';
import { ModalDialogInstance } from '../angular2-modal/models/ModalDialogInstance';

@Component({
    selector: 'record-edit-window',
    template: ''
})

export class RecordEditWindow implements ICustomModalComponent {

    @Input() public currentRecord: FourDModel;


    public dialog: ModalDialogInstance;


    public set modelContentData(v:ICustomModal) {
        this.currentRecord = <FourDModel>v;
    }

    saveRecord() {
        if (this.currentRecord.isRecordLoaded()) {
            this.currentRecord.updateRecord()
            .then(()=> {this.dialog.close('recordSaved');})
            .catch((reason) => {  alert(reason); });
        } else {
              this.currentRecord.insertRecord()
            .then((recnum)=> {this.dialog.close('recordSaved');})
            .catch((reason) => {  alert(reason); });
      };
    }

}
