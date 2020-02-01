import {
    Type,
    ComponentFactoryResolver,
    ViewContainerRef,
    Injectable,
    Optional
} from '@angular/core';


import { ModalConfig } from '../models/ModalConfig';
import { ModalDialogInstance } from '../models/ModalDialogInstance';


let _config: ModalConfig;

// @dynamic
@Injectable()
export class Modal {

    public static hostViewRef: ViewContainerRef;
    public static openDialogList = [];

    public theDialog: any;

    constructor(private componentFactoryResolver: ComponentFactoryResolver, private appRef: ViewContainerRef,
        @Optional() defaultConfig: ModalConfig) {
        // The Modal class should be an application wide service (i.e: singleton).
        // This will run once in most applications...
        // If the user provides a ModalConfig instance to the DI,
        // the custom config will be the default one.
        _config = (defaultConfig) ? ModalConfig.makeValid(defaultConfig) : new ModalConfig();
    }

    /**
     * Opens a modal window blocking the whole screen.
     * @param componentType The angular Component to render as modal.
     * @param parameters parameters to be passed to the dialog instance.
     * @param config A Modal Configuration object.
     * @param allowMultiple indicates if multiple version of the same dialog are allowed.
     * @param dialogID a dialog identification token to control multiple occurrences.
     * @returns Promise<ModalDialogInstance>
     */
    public open(componentType: any, parameters?: any,
        config?: ModalConfig, allowMultiple: boolean = false, dialogID: string = ''): Promise<string> {
        // TODO: appRef.injector.get(APP_COMPONENT) Doesn't work.
        // When it does replace with the hack below.
        // let viewRef = this.appRef.element.nativeElement.location;
        // let viewRef: viewRef = this.appRef['_rootComponents'][0].location;

        return this.openInside(componentType, (Modal.hostViewRef) ? Modal.hostViewRef : this.appRef, parameters, config, allowMultiple, dialogID);
    }

    /**
     * Opens a modal window inside an existing component.
     * @param componentType The angular Component to render as modal.
     * @param viewRef The element to block using the modal.
     * @param parameters parameters to be passed to the dialog instance.
     * @param config A Modal Configuration object.
     * @param allowMultiple indicates if multiple version of the same dialog are allowed.
     * @param dialogID a dialog identification token to control multiple occurrences.
     * @returns Promise<ModalDialogInstance>
     */
    public openInside(componentType: Type<any>, viewRef: ViewContainerRef,
        parameters: any,
        config?: ModalConfig,
        allowMultiple: boolean = false,
        dialogID: string = ''): Promise<string> {

        if (!allowMultiple) {
            for (let index = 0; index < Modal.openDialogList.length; index++) {
                const item = Modal.openDialogList[index];
                const id = (dialogID && dialogID !== '') ? dialogID : componentType['name'];
                if (item.component === id) {
                    item.dialog.kendoDialog.toFront(); // bring dialog to front
                    return item.dialog.result;
                }
            }
        }

        config = (config) ? ModalConfig.makeValid(config, _config) : _config;

        const dialogComponentFactory = this.componentFactoryResolver.resolveComponentFactory(componentType);
        const dialogComponentRef = viewRef.createComponent(dialogComponentFactory, 0);
        const dialogInstance = dialogComponentRef.instance.dialog = new ModalDialogInstance();
        dialogComponentRef.instance.modelContentData = parameters;

        this.theDialog = $(dialogComponentRef.location.nativeElement).kendoWindow({
            actions: config.actions,
            title: config.title,
            width: config.width,
            minWidth: config.minWidth,
            height: config.height,
            minHeight: config.minHeight,
            position: config.position,
            draggable: config.isDraggable,
            modal: config.isModal,
            pinned: false,
            resizable: config.isResizable,
            close: (event) => { this.closeDialog(event, dialogInstance); }
        }).data('kendoWindow');
        if (config.selfCentered) {
            this.theDialog.center().open();
        } else { this.theDialog.open(); }

        dialogInstance.contentRef = dialogComponentRef;
        dialogInstance.kendoDialog = this.theDialog;

        // trick to avoid angular2 error "Expression has changed after it was checked"
        dialogComponentRef.changeDetectorRef.detectChanges(); // need this to avoid NG2 error/warning

        // if multiples not allowed, save this instance
        if (!allowMultiple) {
            const id = (dialogID && dialogID !== '') ? dialogID : componentType['name'];
            Modal.openDialogList.push({ component: id, dialog: dialogInstance });
        }

        return dialogInstance.result;

    }

    public closeDialog(event, theDialogInstance:ModalDialogInstance) {
        // console.log(event, theDialog);
        for (let index = 0; index < Modal.openDialogList.length; index++) {
            const item = Modal.openDialogList[index];
            if (item.dialog === theDialogInstance) {
                Modal.openDialogList.splice(index);
            }
        }

        if (theDialogInstance.contentRef.instance.beforeDismiss) theDialogInstance.contentRef.instance.beforeDismiss();
        theDialogInstance.kendoDialog.destroy();
        theDialogInstance.contentRef.destroy();
    }

    /**
     * Opens a modal window blocking the whole screen.
     * @param componentType The angular Component to render as modal.
     * @param parameters parameters to be passed to the dialog instance.
    * @param config A Modal Configuration object.
     * @param allowMultiple indicates if multiple version of the same dialog are allowed.
     * @param dialogID a dialog identification token to control multiple occurrences.
     * @returns Promise<ModalDialogInstance>
     */
    public openDialog(component: any, parameters: any, allowMultiple: boolean = false, dialogID: string = ''): Promise<string> {

        return this.open(<any>component, parameters, component.dialogConfig, allowMultiple, dialogID);
    }

}
