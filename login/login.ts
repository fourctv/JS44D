import { Component, Input, ReflectiveInjector } from '@angular/core';
//import { Config } from '../../core/utils/config';

import { ModalDialogInstance } from '../angular2-modal/models/ModalDialogInstance';
import { ICustomModalComponent } from '../angular2-modal/models/ICustomModalComponent';
import { ModalConfig } from '../angular2-modal/models/ModalConfig';

import { FourDInterface, MD5 } from '../js44D/JSFourDInterface';


@Component({
    selector: 'log-in',
    moduleId: module.id,
    templateUrl: 'login.html',
    styleUrls : ['login.css']
})
export class LoginCmp implements ICustomModalComponent {
    public static dialogConfig: ModalConfig = <ModalConfig>{size: 'sm', 
            selfCentered:true,
            isResizable: false,
            isModal: true,
            isBlocking: true,
            title:'Login',
            width:1063, height:667};

    @Input() public username:string = '';
    @Input() public password:string = '';
    @Input() public showError:boolean = false;
    @Input() public fourDVersion:string = '';
    @Input() public webAppVersion:string = '1.17.05.29a';


    constructor(public dialog: ModalDialogInstance, private fourD:FourDInterface) {
        this.fourD.call4DRESTMethod('REST_GetApplicationVersion',{})
            .subscribe((v) => {this.fourDVersion = v.text();});
    }

    login() {
        event.preventDefault();
        let md5pwd:string = MD5.md5(this.password);
        this.fourD.signIn(this.username, md5pwd.toUpperCase())
            .then((authentication) => {
                if (FourDInterface.authentication) {
                    //console.log('authenticated');
 
                    this.showError = false;
                     this.dialog.close('loggedin');
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
