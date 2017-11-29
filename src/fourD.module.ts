// angular
import { NgModule } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';

import { FourDInterface, FourDModel, FourDCollection } from './js44D';


@NgModule({
      imports: [HttpClientModule],
      providers: [HttpClient, FourDInterface, FourDModel, FourDCollection],
      exports: [HttpClientModule]
})
export class fourDModule { }
