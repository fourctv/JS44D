import { ComponentRef, Injectable } from '@angular/core';


class Deferred<T> {

  promise: Promise<T>;
  resolve: (value?: T | PromiseLike<T>) => void;
  reject:  (reason?: any) => void;

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolve = resolve;
      this.reject  = reject;
    });
  }
}
/**
 * API to an open modal window.
 */
@Injectable()
export class ModalDialogInstance {
    contentRef: ComponentRef<any>;

    kendoDialog: any;
    /**
     * States if the modal is inside a specific element.
     */
    public inElement: boolean;

    private _bootstrapRef: ComponentRef<any>;
    private _backdropRef: ComponentRef<any>;
    private _resultDefered: any;

    constructor() {
        this._resultDefered = new Deferred(); //PromiseWrapper.completer();
    }

    set backdropRef(value: ComponentRef<any>) {
        this._backdropRef = value;
    }
    set bootstrapRef(value: ComponentRef<any>) {
        this._bootstrapRef = value;
    }

    /**
     * A Promise that is resolved on a close event and rejected on a dismiss event.
     * @returns {Promise<T>|any|*|Promise<any>}
     */
    get result(): Promise<any> {
        return this._resultDefered.promise;
    }

    /**
     * set the dialog title
     */
    setTitle(title:string) {
        let dialog= $(this.contentRef.location.nativeElement).data('kendoWindow');
        dialog.title(title);
    }
    
    /**
     *  Close the modal with a return value, i.e: result.
     */
    close(result: any = null) {
        if ( this.contentRef.instance.beforeClose &&
                this.contentRef.instance.beforeClose() === true ) return;
//        this.dispose();
        let dialog= $(this.contentRef.location.nativeElement).data('kendoWindow');
        dialog.close();
        this._resultDefered.resolve(result);
    }

    /**
     *  Close the modal without a return value, i.e: cancelled.
     *  This call is automatically invoked when a user either:
     *  - Presses an exit keyboard key (if configured).
     *  - Clicks outside of the modal window (if configured).
     *  Usually, dismiss represent a Cancel button or a X button.
     */
    dismiss() {
        if ( this.contentRef.instance.beforeDismiss &&
            this.contentRef.instance.beforeDismiss() === true ) return;
        this.dispose();
        this._resultDefered.reject();
    }

    private dispose() {
        if (this._bootstrapRef) this._bootstrapRef.destroy();
        if (this._backdropRef) this._backdropRef.destroy();
        if (this.contentRef) this.contentRef.destroy();
    }
}

