import { async, inject, fakeAsync, tick, ComponentFixture, TestBed } from '@angular/core/testing';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReflectiveInjector } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';

import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { ModalDialogInstance } from '../angular2-modal/models/ModalDialogInstance';
import { FourDInterface, MD5 } from '../js44D/JSFourDInterface';

import { WebAppContainer } from './webAppContainer';

import { JS44DModule } from '../js44D.module';


describe('WebAppContainer (inline template)', () => {

    let component: WebAppContainer;
    let fixture: ComponentFixture<WebAppContainer>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [FormsModule, CommonModule, HttpClientModule, JS44DModule],
            providers: [HttpClient, FourDInterface, ModalDialogInstance]
        }).compileComponents();

        FourDInterface.fourDUrl = 'http://www.vakeano.com';
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(WebAppContainer);
        component = fixture.componentInstance;
        fixture.detectChanges();
        //fourd = TestBed.get(FourDInterface);
    });

    it('WebAppComponent -> should show Login dialog', () => {
        expect(component.modal.theDialog.title()).toBe('Login');
    });

    it('WebAppComponent -> should log into 4D', async(inject([FourDInterface],(fourD:FourDInterface) => {
        fixture.detectChanges();
        fourD.signIn('admin',MD5.md5('admin')).then(() => { // try to sign into 4D
            expect(FourDInterface.currentUser).toBe('admin','user name not properly set!');
            expect(FourDInterface.authentication).toBeTruthy('no authentication received');
            expect(FourDInterface.authentication.options.isAdmin).toBeTruthy('user should have admin privileges');
            expect(FourDInterface.sessionKey).not.toBe('', 'no session key received');
        });
      })));
});