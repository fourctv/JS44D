import { Component, Injectable, Input } from '@angular/core';


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

  tabs: Tab[] = [];

  selectTab(event, tab) {
    event.preventDefault();

    this.selectThisTab(tab);

  }

  selectThisTab(tab) {
    this.tabs.forEach((tabItem) => tabItem.active = false);
    tab.active = true;
  }


  addTab(tab: Tab) {
    if (this.tabs.length === 0) {
      tab.active = true;
    }
    this.tabs.push(tab);
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
  @Input() active: Boolean = this.active || false;

  constructor(tabs: Tabs) {

    tabs.addTab(this);

  }
}

