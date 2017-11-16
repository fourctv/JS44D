import { Component, ViewEncapsulation, ViewContainerRef, EventEmitter, AfterContentInit, Input, Output } from '@angular/core';

import { LoginCmp } from '../login/login';
import { Modal } from '../angular2-modal/providers/Modal';
import { FourDInterface } from '../js44D/JSFourDInterface';

@Component({
    selector: 'web-application',
    moduleId: module.id,
    template: '<section class="webComponent" [hidden]="!userIsLoggedIn"><ng-content></ng-content></section>',
    encapsulation: ViewEncapsulation.None,
    providers: [Modal]
})


export class WebAppContainer implements AfterContentInit {

    @Input() public userIsLoggedIn = false;

    @Output() public userHasLoggedIn: EventEmitter<any> = new EventEmitter();

    private urlSearchParms: Object = {};

    constructor(public modal: Modal, private elementRef: ViewContainerRef, private fourD: FourDInterface/*, private win:WindowService*/) {
        const win = window;
        if (win && win.location && win.location.search) {
            const url = win.location.search.substr(1); // get incoming url and parse search params
            url.split('&').forEach(element => {
                const item = element.split('=');
                if (item.length === 2) {
                    this.urlSearchParms[item[0]] = item[1];
                } else {
                    this.urlSearchParms[element] = true;
                }
            });
        }
    }

    showLoginDialog() {
        this.modal.openInside(<any>LoginCmp, this.elementRef, null, LoginCmp.dialogConfig)
            .then((result) => {
                this.userIsLoggedIn = true;
                this.userHasLoggedIn.emit(FourDInterface.currentUser);
            });


    }

    ngAfterContentInit() {
        if (!FourDInterface.authentication) {
            if (this.urlSearchParms.hasOwnProperty('key')) {
                try {
                    const key = JSON.parse(atob(this.urlSearchParms['key']));
                    this.fourD.signIn(key.username, key.password)
                        .then((authentication) => {
                            if (FourDInterface.authentication) {
                                this.userIsLoggedIn = true;
                                this.userHasLoggedIn.emit(FourDInterface.currentUser);
                            }
                        })
                        .catch(e => { this.showLoginDialog(); });
                } catch (error) {
                    this.showLoginDialog();
                }
            } else {
                // no predefined user, login...
                this.showLoginDialog();
            }
        } else {
            this.userIsLoggedIn = true;
            this.userHasLoggedIn.emit(FourDInterface.currentUser);
        }
    }

}
