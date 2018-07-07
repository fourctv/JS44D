// angular
import { NgModule } from '@angular/core';

import { ModalDialogInstance } from './angular2-modal/models/ModalDialogInstance';
import { Modal } from './angular2-modal/providers/Modal';
import { OKOnlyModal } from './angular2-modal/commonModals/okOnlyModal';
import { YesNoModal } from './angular2-modal/commonModals/yesNoModal';
import { ICustomModal } from './angular2-modal/models/ICustomModal';

@NgModule({
      declarations: [
            OKOnlyModal, YesNoModal
      ],
      exports: [
            OKOnlyModal, YesNoModal
      ],
      entryComponents: [OKOnlyModal, YesNoModal],
      providers: [Modal, ModalDialogInstance, ICustomModal]
})
export class ModalModule { }
