// angular
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

import { BsDropdownModule } from 'ngx-bootstrap/dropdown';

import { QueryBand, CustomButtonBarDirective, QueryBandDirective } from './containers/queryBand';
import { AdvancedQueryComponent } from './containers/advancedQuery';
import { RecordList } from './containers/recordList';
import { RecordEditWindow } from './containers/recordEditWindow';
import { Tabs, Tab } from './containers/tabs';
import { WebAppContainer } from './containers/webAppContainer';
import { FourDDropDown } from './controls/fourDDropDown';
import { QuickFindInput } from './controls/quickFindInput';
import { DataGrid } from './dataGrid/dataGrid';
import { LoginCmp } from './login/login';
import { ListSelectorDialog } from './dialogs/listSelectorDialog';


@NgModule({
      imports: [FormsModule, CommonModule, HttpClientModule, BsDropdownModule.forRoot()],
      declarations: [
            QueryBand, CustomButtonBarDirective, QueryBandDirective, AdvancedQueryComponent,
            RecordEditWindow, RecordList, Tabs, Tab, WebAppContainer,
            FourDDropDown, QuickFindInput,
            DataGrid,
            ListSelectorDialog,
            LoginCmp
      ],
      providers: [HttpClient],
      exports: [
            QueryBand, CustomButtonBarDirective, QueryBandDirective, AdvancedQueryComponent,
            RecordEditWindow, RecordList, Tabs, Tab, WebAppContainer,
            FourDDropDown, QuickFindInput,
            DataGrid,
            ListSelectorDialog,
            LoginCmp
      ],
      entryComponents: [LoginCmp, AdvancedQueryComponent, ListSelectorDialog]
})
export class JS44DModule { }
