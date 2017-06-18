// angular
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule }      from '@angular/common';

import { Tabs, Tab } from './containers/tabs';
import { FourDDropDown  } from './controls/fourDDropDown';
import { QuickFindInput  } from './controls/quickFindInput';
import { DataGrid } from './dataGrid/dataGrid';
import { LoginCmp  } from './login/login';
import { ListSelectorDialog } from './dialogs/listSelectorDialog';

//import { FourDInterface } from './js44D/JSFourDInterface';
//import { FourDModel } from './js44D/JSFourDModel';
//import { FourDCollection } from './js44D/JSFourDCollection';

@NgModule({
      imports: [ FormsModule, CommonModule],
      declarations: [ 
            Tabs, Tab,
            FourDDropDown, QuickFindInput,
            DataGrid,
            ListSelectorDialog,
            LoginCmp
            ], 
      exports: [ 
            FormsModule, CommonModule, 
            Tabs, Tab,
            FourDDropDown, QuickFindInput,
            DataGrid,
            ListSelectorDialog,
            LoginCmp
            ], 
      entryComponents: [  LoginCmp,  ListSelectorDialog ]
})
export class JS44DModule { }
