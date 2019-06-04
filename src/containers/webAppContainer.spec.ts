import { async, inject, fakeAsync, tick, ComponentFixture, TestBed } from '@angular/core/testing';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
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
    });

    it('WebAppComponent -> should show Login dialog', () => {
        fixture.detectChanges();

        fixture.whenStable().then(() => { // wait for async get 4D Version
            fixture.detectChanges();        // update view with 4D version
            if (component.modal && component.modal.theDialog) expect(component.modal.theDialog.title()).toBe('Login');
        });
    });

});
