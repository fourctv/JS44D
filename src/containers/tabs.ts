import { Component, Injectable, Input, Output, EventEmitter } from '@angular/core';


@Component({
  selector: 'tabs',
  template: `
    <ul class="nav nav-tabs">
      <li *ngFor="let tab of tabs" (click)="selectTab($event,tab)" [class.active]="tab.active">
        <a href="#">{{tab.title}}</a>
      </li>
    </ul>
    <ng-content></ng-content>
  `
})
@Injectable()
export class Tabs {

  @Output() public change: EventEmitter<any> = new EventEmitter();

  tabs: Tab[] = [];

  public selectTab(event, tab) {
    event.preventDefault();

    this.selectThisTab(tab);

  }

  public selectThisTab(tab) {
    this.tabs.forEach((tabItem) => tabItem.active = false);
    tab.active = true;

    this.change.emit();
  }


  public addTab(tab: Tab) {
    if (this.tabs.length === 0) {
      tab.active = true;
    }
    this.tabs.push(tab);
  }

  public get selectedIndex():number {
    let selected = -1;
    for (let index = 0; index < this.tabs.length; index++) {
      if (this.tabs[index].active) selected = index;
    }
    return selected;
  }
}

@Component({
  selector: 'tab',
  template: `
    <div  [hidden]="!active"  class="tabPane">
      <ng-content></ng-content>
    </div>
  `
})
@Injectable()
export class Tab {
  @Input() title: string;
  @Input() active: Boolean = false;

  constructor(tabs: Tabs) {

    tabs.addTab(this);

  }
}

