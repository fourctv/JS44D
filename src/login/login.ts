import { Component, Input, ReflectiveInjector } from '@angular/core';

import { ModalDialogInstance } from '../angular2-modal/models/ModalDialogInstance';
import { ICustomModalComponent } from '../angular2-modal/models/ICustomModalComponent';
import { ICustomModal } from '../angular2-modal/models/ICustomModal';
import { ModalConfig } from '../angular2-modal/models/ModalConfig';

import { FourDInterface, MD5 } from '../js44D/JSFourDInterface';


@Component({
    selector: 'log-in',
    template: `
    <div class="login container">
    <form class="form-vertical" role="form" (submit)="login()">
        <label style="padding-bottom:40px;font-size:32pt;font-weight:bold;color:#7F7F6F;">Welcome, Please Login</label>
        <div class="form-group" style="margin-left: 20px;">
            <label class="fieldPrompt" style="font-weight:bold;width:90px;" for="username">User Name</label>
            <input type="text" class="fieldEntry" style="width:300px;" id="username" name="username" placeholder="Username" [(ngModel)]="username" (focus)="showError = false;">
        </div>
        <div class="form-group" style="margin-left: 20px;">
            <label class="fieldPrompt" style="font-weight:bold;width:90px;" for="password">Password</label>
            <input type="password" class="fieldEntry" style="width:300px;" id="password" name="password" placeholder="Password" [(ngModel)]="password">
        </div>
        <button type="submit" class="regularButton" style="width:100px;margin-left: 30px;">Login</button>
    </form>
    <div class="alert alert-warning" style="width: 500px;" [hidden]="!showError">Sorry, the username and/or password was incorrect</div>

    <div style="color:green;margin-top:100px;">4D: {{fourDVersion}}, web: {{webAppVersion}}</div>
</div>

    `,
    styles: [`
    .login {
        width: 1070px !important;
        background: url("/assets/login_splash.png");
        background-repeat: no-repeat;
        height: 670px !important;
        padding-left: 200px;
        padding-top: 200px;
    }
    `]
})
export class LoginCmp implements ICustomModalComponent {
    public static dialogConfig: ModalConfig = <ModalConfig>{
        size: 'sm',
        selfCentered: true,
        isResizable: false,
        isModal: true,
        isBlocking: true,
        title: 'Login',
        width: 1063, height: 667
    };

    @Input() public username = '';
    @Input() public password = '';
    @Input() public showError = false;
    @Input() public fourDVersion = '';
    @Input() public webAppVersion = '1.17.05.29a';


    public set modelContentData(parms: ICustomModal) {
        if (parms) {
            if (parms.hasOwnProperty('version')) {
                this.webAppVersion = parms['version'];
            }
        }
    }

    constructor(public dialog: ModalDialogInstance, private fourD: FourDInterface) {
        this.fourD.call4DRESTMethod('REST_GetApplicationVersion', {}, { responseType: 'text' })
            .subscribe((v) => {
                this.fourDVersion = v;
            });
    }

    login() {
        // event.preventDefault();
        const md5pwd: string = MD5.md5(this.password);
        this.fourD.signIn(this.username, md5pwd.toUpperCase())
            .then((authentication) => {
                if (FourDInterface.authentication) {
                    // console.log('authenticated');

                    this.showError = false;
                    if (this.dialog) { this.dialog.close('loggedin'); }
                } else {
                    console.log('oops');
                    this.showError = true;
                }
            })
            .catch((e) => {
                console.log(e);
                this.showError = true;
            });
    }
}
