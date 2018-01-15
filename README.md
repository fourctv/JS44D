# JS44D Library
Pascal's [4D RESTApi](https://github.com/fourctv/FourDRESTApi) companion [Angular Typescript](http://angular.io) library.

[![Angular Style Guide](https://mgechev.github.io/angular2-style-guide/images/badge.svg)](https://angular.io/styleguide)
[![Build Status](https://travis-ci.org/fourctv/JS44D.svg?branch=master)](https://travis-ci.org/fourctv/JS44D)
[![MIT license](http://img.shields.io/badge/license-MIT-brightgreen.svg)](http://opensource.org/licenses/MIT)
[![Dependency Status](https://david-dm.org/fourctv/JS44D.svg)](https://david-dm.org/fourctv/JS44D)
[![devDependency Status](https://david-dm.org/fourctv/JS44D/dev-status.svg)](https://david-dm.org/fourctv/JS44D#info=devDependencies)
[![npm version](https://badge.fury.io/js/js44d.svg)](https://badge.fury.io/js/js44d)

This library includes a series of Angular services, components and UI widgets, that interface to a 4D Database backend via **[4D RESTApi](https://github.com/fourctv/FourDRESTApi)** component. The **4D RESTApi** Component must be installed in the 4D Database, and Web Serving must be enabled.

Detailed documentation for each service/component in this library can be found on the [wiki here](https://github.com/fourctv/JS44D/wiki). Following is a quick run down of the library contents.

There is a step by step procedure to get started with the **4D RESTApi** component and this library at this [wiki page.](https://github.com/fourctv/JS44D/wiki/Let's-Get-Started) That page will instruct you on how to get going on the 4D and Angular sides.

## Installation
Install `js44d` library using `npm`, as:
```
npm install js44d --save
```

## Usage
The library can be divided into three sets of components: 4D Service classes, UI widgets and a Modal Dialog Service class. The 4D Service Classes provide the interface to a 4D backend. The UI widgets are not essential, but do provide some useful UI Components that use the Services Classes. The Modal Dialog provides funcionality to open multiple floating Dialog windows, similar to Windows MDI funcionality.

Each of the three sets are declared in a separate **NgModule**: _FourDModule_, _JS44DModule_ and _ModalModule_.

You reference the 4D Interface Service Classes as:
```
import { FourDInterface, FourDModel, FourDCollection } from 'js44d';
```
They need to be included in your main **NgModule** declaration, by importing the _FourDModule_.

As for UI components/widgets and the Modal dialog service, you reference/import them as:
```
import { ..widget.. } from 'js44d';
```

You need to import the modules in your **NgModule** declaration, where you use them, as in:
```
...
import { FourDModule, JS44DModule, ModalModule } from 'js44d';
...
@NgModule({
  imports: [
    ...,
    FourDModule, JS44DModule, ModalModule
  ]
  ],
  exports: [FourDModule, JS44DModule, ModalModule],

```

If you plan on using any of the UI widgets, then you need to grab a copy of the [assets folder](https://github.com/fourctv/JS44D/tree/master/assets) contents and drop all that in your own **assets** directory. You need to also add the following line to your `styles.scss` file:

```
@import './assets/main';
```

And you can edit `src/assets/main.scss` at will, to add you own styles or modify the existing styles that are used by JS44D UI Widgets.

A quick note, the UI components/widgets are **WEB ONLY**, they do not work under Nativescript, so for {N} you can only use the 4D Service Classes. For NativeScript your module declaration should look something like this:
```
...
import { FourDInterface, FourDModel, FourDCollection } from 'js44d';
...

@NgModule({
    ...
    providers: [
        ...,
        FourDInterface, FourDModel, FourDCollection
    ],
...
```


## 4D Interface Service Classes
The library provides a set of service classes for accessing a 4D Database backend that has the **4D RESTApi** Component installed.

### FourDInterface
This is the base service class that implements most of the calls to **4D RESTApi**.

The two key functions made available by this class are:
- **call4DRESTMethod**: a wrapper function to enable calling any **4D RESTApi** entry point; it automatically adds a *Session Key* and a *hash* tokens to each HTTP POST request sent to 4D, which are required by the **4D RESTApi** Component; this function is used by all other services and components to send requests to 4D.
- **signin**: a function that will send a **REST_Authenticate** sign in request to 4D and process 4D's response.

This class also provides some static variables:
- **currentUser**: the name of the currectly signed in user
- **authentication**: the authentication response object, returned by the **REST_Authenticate** call ([see](https://github.com/fourctv/FourDRESTApi/wiki/REST_Authenticate))
- **sessionKey**: the current session token, that must be present in all requests to 4D
- etc..

### FourDModel
This is a service class that provides CRUD functionality, acting as a Data Model base class. It provides the ability to retrieve, create, update or delete records from any 4D table.

This class builds upon the Data Model functionality, as described in the [Data Model wiki page](https://github.com/fourctv/JS44D/wiki/Data-Modelling). 

All 4D table's Data Models extend the **FourDModel** class, describing each of the table's fields and providing getter/setter for each field.

Instances of the **FourDModel** class, and its extensions, represent a record in the database. This service provides basic CRUD functions to access those records:
- **getRecord**: retrieves a single record from the database
- **insertRecord**: adds a new record to the database
- **updateRecord**: updates a record in the database
- **deleteRecord**: deletes a record from the database

Additional functions are described in the **[FourDModel](https://github.com/fourctv/JS44D/wiki/FourDModel-Class)** wiki page.

### FourDCollection
A service class that represents a collection of 4D records. It is basically an Array of **FourDModel** derived instances.

This class provides a function to retrieve a set of records from a 4D Database:
- **getRecords**: will take a [Query String](https://github.com/fourctv/FourDRESTApi/wiki/The-JS44D-Query-String) and send a **[REST_GetRecords](https://github.com/fourctv/FourDRESTApi/wiki/REST_GetRecords)** request to 4D to retrieve a collection of 4D records. Record data comes as an Array of Data Model (*FourDModel*) instances.

## UI Widgets
The following UI widgets and components, which also interact with a 4D backend, are available for use in Angular apps. Detailed documentation for each widget is found on the [wiki pages](https://github.com/fourctv/JS44D/wiki).

### Login Component
A basic Login dialog that takes a user name and password. It calls *FourDInterface signin* function, that sends a **REST_Authenticate** request to 4D to authenticate the given user.

![](https://i.gyazo.com/2e6afd8b53bdd50d68fa01616b62b30e.png)

### Datagrid Component
This Component provides Data Grid functionality, to display and interact with a list of records from a 4D Database.

![](https://i.gyazo.com/d75381f5cdbea2f9be82ce05bea845e4.png)

The component is based on a KendoUI Grid widget, and displays contents of _FourDModel_ instances, from a _FourDCollection_. 

### Query Band Component
A query widget that provides functionality for querying a 4D Database, built upon a _FourDModel_.

![](https://i.gyazo.com/7aa5115f90679bb58245c74f43d4184a.png)

It allows for a user defined query form, advanced query functionality and the ability to save and reuse queries.

### Record List Component
This widget builds upon the **QueryBand** and **DataGrid** components. It associates a **QueryBand** to a **DataGrid**, so the results of a query are displayed on the associated **DataGrid**.

![](https://i.gyazo.com/b1a5070c05011be9fa6865b5aa770389.png)

Additionally the widget provides a button bar with functionality to add/edit/delete records. It also allows for user defined custom buttons added to the button bar.

### Web App Container Component
This is a Web App wrapper component, that ensures that the application component runs authenticated. If upon app initialization, it is not yet authenticated to a 4D backend, this component will display a **Login** dialog to get user credentials and authenticate the user.

### 4D List DropDown Control
This is an HTML **select** drop down whose items are obtained directly from a 4D Choice List. One of the parameters to this widget is the choice list name.

Example:
```
  <fourd-dropdown class="fieldEntry" style="width:180px;height:20px;" listName="Status" [(selectedValue)]="selectStatus"
                (change)="selectStatus = $event.target.value"></fourd-dropdown>
```

## Additional Widgets/Services
Some additional widgets/services are also part of the library, but those do not interact with 4D backends and do not depend on the **4D RESTApi**.

### MDI Dialog Service
A set of service classes that provide functionality to show multiple floating dialog windows, which can be modal or not.

![](https://i.gyazo.com/087217cad2ad8ee47a7e80a610ac5315.png)

### List Selector Dialog
A component that presents a dialog with a list of items for user selection.

![](https://i.gyazo.com/e2c57ff1bcbebec87d8cde35f662007e.png)

### Tab Component
A simple horizontal tab component, that provides functionality to allow user to tab among multiple forms.

![](https://i.gyazo.com/28da0be86dec85749ef72e3438d2711d.gif)


# Contributors 

[<img alt="Julio Carneiro" src="https://avatars1.githubusercontent.com/u/15777910?v=3&s=117" width="117">](https://github.com/fourctv) |
:---: |
[Julio Carneiro](https://github.com/fourctv) |

