
import {debounceTime, distinctUntilChanged} from 'rxjs/operators';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';




@Component({
    selector: 'quickfind-input',
    template: `<input type="search" name="quickFind" [formControl]="quickFind"/>`
})

export class QuickFindInput {

    @Input() public quickFind = new UntypedFormControl();

    @Output() public runQuickFinder: EventEmitter<any> = new EventEmitter();

    constructor() {
        this.quickFind.valueChanges.pipe(distinctUntilChanged(),debounceTime(1500)).subscribe(query => {
            this.runQuickFinder.emit(query);
        });
    }

}
