// angular
import { NgModule } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';

import { FourDInterface } from './js44D/JSFourDInterface';
import { FourDModel } from './js44D/JSFourDModel';
import { FourDCollection } from './js44D/JSFourDCollection';

@NgModule({
      imports: [HttpClientModule],
      providers: [HttpClient, FourDInterface, FourDModel, FourDCollection],
      exports: [HttpClientModule]
})
export class FourDModule { }
