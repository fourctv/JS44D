import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReflectiveInjector } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';

import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { ModalDialogInstance } from '../angular2-modal/models/ModalDialogInstance';
import { FourDInterface, MD5 } from '../js44D/JSFourDInterface';

import { LoginCmp } from './login';

// ------------- trick to inject HttpClient

const injector = ReflectiveInjector.resolveAndCreate(getAnnotations(HttpClientModule)[0].providers);

const http = injector.get(HttpClient);
declare let Reflect: any;
function getAnnotations(typeOrFunc): any[]|null {
  // Prefer the direct API.
  if ((<any>typeOrFunc).annotations) {
    let annotations = (<any>typeOrFunc).annotations;
    if (typeof annotations === 'function' && annotations.annotations) {
      annotations = annotations.annotations;
    }
    return annotations;
  }

  // API of tsickle for lowering decorators to properties on the class.
  if ((<any>typeOrFunc).decorators) {
    return convertTsickleDecoratorIntoMetadata((<any>typeOrFunc).decorators);
  }

  // API for metadata created by invoking the decorators.
  if (Reflect && Reflect.getOwnMetadata) {
    return Reflect.getOwnMetadata('annotations', typeOrFunc);
  }
  return null;
}

function convertTsickleDecoratorIntoMetadata(decoratorInvocations: any[]): any[] {
  if (!decoratorInvocations) {
    return [];
  }
  return decoratorInvocations.map(decoratorInvocation => {
    const decoratorType = decoratorInvocation.type;
    const annotationCls = decoratorType.annotationCls;
    const annotationArgs = decoratorInvocation.args ? decoratorInvocation.args : [];
    return new annotationCls(...annotationArgs);
  });
}

// --------------- trick to inject HttpClient


describe('LoginCmp (inline template)', () => {

    let component: LoginCmp;
    let fixture: ComponentFixture<LoginCmp>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [FormsModule, CommonModule, HttpClientModule],
            providers: [HttpClient, FourDInterface, ModalDialogInstance],
            declarations: [
                LoginCmp
            ]
        })
            .compileComponents();
        FourDInterface.http = http;
        FourDInterface.fourDUrl = 'http://www.vakeano.com';
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(LoginCmp);
        component = fixture.componentInstance;

        component.username = 'test';
        component.password = 'test';


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
        fixture.detectChanges();

        fixture.whenStable().then(() => { // wait for async get 4D Version
            fixture.detectChanges();        // update view with 4D version
            expect(component.fourDVersion).not.toBe('');
        });
    }));

    it('Login -> should log into 4D', async(() => {
        component.login();

        fixture.whenStable().then(() => { // wait for async get 4D Version
            fixture.detectChanges();        // update view with 4D version
            expect(FourDInterface.authentication).toBeTruthy();
        });
    }));

    it('Login -> should fail invalid log into 4D', async(() => {
        component.username = 'foo';
        component.login();

        fixture.whenStable().then(() => { // wait for async get 4D Version
            fixture.detectChanges();        // update view with 4D version
            expect(FourDInterface.authentication).toBeFalsy();
        });
    }));


});