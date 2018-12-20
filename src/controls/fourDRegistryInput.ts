import { Component, Input, Injectable, AfterViewInit } from '@angular/core';


import { FourDInterface } from '../js44D/JSFourDInterface';

@Component({
    selector: 'fourd-registry-input',
    template: `
        <span [ngSwitch]="inputType" style="width:inherit">
            <input *ngSwitchCase="'text'"  type="text" [(ngModel)]="textValue" (change)="valueChanged()" style="width:inherit"/>
            <input *ngSwitchCase="'checkbox'"  type="checkbox" [(ngModel)]="booleanValue" (change)="valueChanged()" style="width:inherit"/>
        </span>
       `
})

@Injectable()
export class FourDRegistryInput implements AfterViewInit {

    @Input() public className: string;
    @Input() public parameterValue: string;
    @Input() public selectorValue: string;
    @Input() public defaultValue: string;
    @Input() public inputType: string;
    
    public textValue: string = '';
    public booleanValue: boolean = false;
    private originalValue: string = '';
    
    constructor(private fourD: FourDInterface) { }

    ngAfterViewInit() {
        if (FourDInterface.authentication !== undefined && FourDInterface.authentication !== null) {
            this.loadValueFrom4D();
        } else {
            FourDInterface.userHasSignedIn.subscribe(() => {
                this.loadValueFrom4D();
            })
        }
    }

    public valueChanged() {
        if (this.inputType === 'checkbox') {
            this.textValue = (this.booleanValue)?'Y':'N';
        }
        if (this.originalValue != this.textValue) {
            this.fourD.setRegistryValue(this.className, this.parameterValue, this.textValue, this.selectorValue)
                .then (v => {this.originalValue = this.textValue;});
        }
    }

    private loadValueFrom4D() {
        if (this.className && this.className != '' && this.parameterValue && this.parameterValue != '') {
            this.fourD.getRegistryValue(this.className, this.parameterValue, this.defaultValue, this.selectorValue)
                .then((value) => {
                    this.originalValue = this.textValue = value;
                    this.booleanValue = (value.toUpperCase() == "Y");
                })
                .catch((reason) => { console.log('error', reason); });
        }

    }

}
