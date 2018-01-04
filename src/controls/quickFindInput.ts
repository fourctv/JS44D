import { Component, EventEmitter, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import 'rxjs/Rx';

@Component({
    selector: 'quickfind-input',
    template: `<input type="text" name="quickFind" [(ngModel)]="value"/>`
})

export class QuickFindInput {

    @Input() public quickFind = new FormControl();
    @Input() public value = '';
    public runQuickFinder: EventEmitter<any> = new EventEmitter();

    constructor() {
        this.quickFind.valueChanges.debounceTime(1500).distinctUntilChanged().subscribe(query => {
            this.runQuickFinder.emit(query);
        });
    }

}
