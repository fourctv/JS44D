import {Component, Input, Injectable, AfterViewInit} from '@angular/core';


import { FourDInterface } from '../js44D/JSFourDInterface';

@Component({
    selector: 'fourd-dropdown',
    styles : [`.fourDDropdown {
                margin: inherit;
                width: inherit;
                padding: inherit;
                font-size: inherit;
                border: 1px solid #ccc;
                height: inherit;
                }
            `], 
    template: `
        <select  #selector class='fourDDropdown' (change)='selectedValue = $event.target.value' [(value)]='selectedValue'>
            <option *ngFor='let item of listOptions' value='{{item}}' [selected]='isItemSelected(item)'>{{item}}</option>
        </select>
       `
})

@Injectable()
export class FourDDropDown implements AfterViewInit {
    @Input() public listName: string;
    public selectedValue: string;
    public listOptions: Array<string> = [];

    constructor (private fourD:FourDInterface) {}

    ngAfterViewInit() {
        if (this.listName) {
            this.fourD.get4DList(this.listName)
                .then((values) => {
                    this.listOptions = ['', ...values];
                })
                .catch((reason) => { console.log('error', reason); });
        }
    }

    isItemSelected(item: string): string {
        return (item === this.selectedValue) ? 'selected' : '';
    }

}
