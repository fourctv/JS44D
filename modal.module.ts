// angular
import { NgModule } from '@angular/core';

import { ICustomModal } from './angular2-modal/models/ICustomModal';
import { ICustomModalComponent } from './angular2-modal/models/ICustomModalComponent';
import { ModalConfig } from './angular2-modal/models/ModalConfig';
import { ModalDialogInstance } from './angular2-modal/models/ModalDialogInstance';
import { Modal } from './angular2-modal/providers/Modal';
import { OKOnlyModal, OKOnlyContent } from './angular2-modal/commonModals/okOnlyModal';
import { YesNoModal, YesNoModalContent } from './angular2-modal/commonModals/yesNoModal';

@NgModule({
    declarations: [ 
            OKOnlyModal, YesNoModal
            ], 
      exports: [ 
            OKOnlyModal, YesNoModal
            ], 
      entryComponents: [ OKOnlyModal, YesNoModal ],
      providers:[ Modal, ModalDialogInstance, ICustomModal ]
})
export class ModalModule { }
