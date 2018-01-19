import { Component, EventEmitter, Input } from '@angular/core';
import { FormControl } from '@angular/forms';

import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';

@Component({
    selector: 'quickfind-input',
    template: `<input type="text" name="quickFind" [(ngModel)]="value"/>`
})

export class QuickFindInput {

    @Input() public quickFind = new FormControl();
    @Input() public value = '';
    public runQuickFinder: EventEmitter<any> = new EventEmitter();

    constructor() {
        this.quickFind.valueChanges.distinctUntilChanged().debounceTime(1500).subscribe(query => {
            this.runQuickFinder.emit(query);
        });
    }

}
