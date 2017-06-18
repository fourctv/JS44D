import {Component, EventEmitter, Input } from '@angular/core';
import {FormControl} from '@angular/forms';
import 'rxjs/Rx';

@Component({
    selector: 'quickfind-input',
    template: `<input type="text" name="quickFind" [(ngModel)]="value"/>`
})

export class QuickFindInput {

    public quickFind = new FormControl();
    @Input() public value:string = '';
    public runQuickFinder:EventEmitter<any> = new EventEmitter();

    constructor() {
        let me = this;
        this.quickFind.valueChanges.debounceTime(1500).distinctUntilChanged().subscribe(query => {
             me.runQuickFinder.emit(query); 
            });
    }

}
