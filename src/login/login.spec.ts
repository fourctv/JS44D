import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { ModalDialogInstance } from '../angular2-modal/models/ModalDialogInstance';
import { FourDInterface, MD5 } from '../js44D/JSFourDInterface';

import { JS44DModule } from '../js44D.module';
import { LoginCmp } from './login';

describe('LoginCmp (inline template)', () => {

    let component: LoginCmp;
    let fixture: ComponentFixture<LoginCmp>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [FormsModule, CommonModule, HttpClientModule, JS44DModule],
            providers: [HttpClient, FourDInterface, ModalDialogInstance]
        }).compileComponents();
        
        FourDInterface.fourDUrl = 'http://bestclinic.selfip.com:8080';
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(LoginCmp);
        component = fixture.componentInstance;

        component.username = 'best';
        component.password = 'best123';


        fixture.detectChanges();
    });

    it('Login -> should create', () => {
        expect(component).toBeTruthy();
    });


    it('Login -> should render the username field', () => {
        const username = fixture.debugElement.queryAll(By.css('.fieldPrompt'))[0].nativeElement;
        expect(username.innerText).toEqual('User Name');
    });


    it('Login -> should render the password', () => {
        const pwd = fixture.debugElement.queryAll(By.css('.fieldPrompt'))[1].nativeElement;
        expect(pwd.innerText).toEqual('Password');
    });

    it('Login -> should get 4D version', async(() => {
        expect(true).toBeTruthy();
        fixture.detectChanges();

        fixture.whenStable().then(() => { // wait for async get 4D Version
            fixture.detectChanges();        // update view with 4D version
            expect(component.fourDVersion).not.toBe('');
        });
    }));

    it('Login -> should fail invalid log into 4D', async(() => {
        expect(true).toBeTruthy();
        component.username = 'foo';
        component.login();

        fixture.detectChanges();

        fixture.whenStable().then(() => { // wait for async log into 4D (invalid)
            fixture.detectChanges();        
            expect(FourDInterface.authentication).toBeFalsy();
        });
    }));

    it('Login -> should log into 4D', async(() => {
        expect(true).toBeTruthy();        
        component.login();
        
        fixture.detectChanges();

        fixture.whenStable().then(() => { // wait for async log into 4D (valid)
            expect(FourDInterface.authentication).toBeTruthy();
        });
    }));


});
