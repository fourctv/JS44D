// angular
import { NgModule } from '@angular/core';

import { ModalDialogInstance } from './angular2-modal/models/ModalDialogInstance';
import { Modal } from './angular2-modal/providers/Modal';
import { OKOnlyModal } from './angular2-modal/commonModals/okOnlyModal';
import { YesNoModal } from './angular2-modal/commonModals/yesNoModal';

@NgModule({
      declarations: [
            OKOnlyModal, YesNoModal
      ],
      exports: [
            OKOnlyModal, YesNoModal
      ],
      entryComponents: [OKOnlyModal, YesNoModal],
      providers: [Modal, ModalDialogInstance]
})
export class ModalModule { }
