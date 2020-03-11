// angular
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

import { FourDModule } from './fourD.module';
import { FourDInterface } from './js44D/JSFourDInterface';

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

import { Base64ImageRef } from './pipes/Base64ImageRef.pipe';
import { FourDDateToString } from './pipes/FourDDateToString.pipe';
import { FourDRegistryInput } from './controls/fourDRegistryInput';


@NgModule({
      imports: [FormsModule, ReactiveFormsModule, CommonModule, HttpClientModule, FourDModule],
      declarations: [ 
            QueryBand, CustomButtonBarDirective, QueryBandDirective, AdvancedQueryComponent,
            RecordEditWindow, RecordList, Tabs, Tab, WebAppContainer,
            FourDDropDown, QuickFindInput, FourDRegistryInput,
            DataGrid,
            ListSelectorDialog,
            Base64ImageRef,
            FourDDateToString,
            LoginCmp
      ],
      providers: [HttpClient, FourDInterface],
      exports: [
            QueryBand, CustomButtonBarDirective, QueryBandDirective, AdvancedQueryComponent,
            RecordEditWindow, RecordList, Tabs, Tab, WebAppContainer,
            FourDDropDown, QuickFindInput, FourDRegistryInput,
            DataGrid,
            ListSelectorDialog,
            Base64ImageRef,
            FourDDateToString,
            LoginCmp
      ],
      entryComponents: [LoginCmp, AdvancedQueryComponent, ListSelectorDialog]
})
export class JS44DModule { }
