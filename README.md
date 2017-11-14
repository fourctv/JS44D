# JS44D Library
Pascal's [4D RESTApi](https://github.com/fourctv/FourDRESTApi) companion [Angular Typescript](http://angular.io) library.

[![Angular Style Guide](https://mgechev.github.io/angular2-style-guide/images/badge.svg)](https://angular.io/styleguide)
[![Build Status](https://travis-ci.org/fourctv/JS44D.svg?branch=master)](https://travis-ci.org/fourctv/JS44D)
[![MIT license](http://img.shields.io/badge/license-MIT-brightgreen.svg)](http://opensource.org/licenses/MIT)
[![Dependency Status](https://david-dm.org/fourctv/JS44D.svg)](https://david-dm.org/fourctv/JS44D)
[![devDependency Status](https://david-dm.org/fourctv/JS44D/dev-status.svg)](https://david-dm.org/fourctv/JS44D#info=devDependencies)


This library includes a series of Angular services, components and widgets, that interface to a 4D Database backend via **[4D RESTApi](https://github.com/fourctv/FourDRESTApi)** component. The Component must be installed in the 4D Database, and Web Serving must be enabled.

Detailed documentation for each service/component in this library can be found on the [wiki here](https://github.com/fourctv/JS44D/wiki). Following is a quick run down of the library contents.

## Services
The library provides services for accessing a 4D Database backend that has the **4D RESTApi** Component installed.

### FourDInterface
This is the base service class that implements most of the calls to **4D RESTApi**.

The two key functions made available by this class are:
- **call4DRESTMethod**: a wrapper function to enable calling any **4D RESTApi** entry point; it automatically adds a *Session Key* and a *hash* to each HTTP POST request sent to 4D
- **signin**: a function that will send a **REST_Authenticate** sign in request to 4D and process 4D's response.

This class also provides some static variables:
- **currentUser**: the name of the currectly signed in user
- **authentication**: the authentication response object, returned by the **REST_Authenticate** call
- **sessionKey**: the current session token, that must be present in all requests to 4D
- etc..

### FourDModel
This is a service class that provides CRUD functionality, as a Data Model base class. It provides the ability to retrieve, create, update or delete records from a table.

This class builds upon the Data Model functionality, as described in the [Data Model wiki page](https://github.com/fourctv/JS44D/wiki/Data-Modeling). 

All 4D table's Data Models extend the **FourDModel** class, describing each of the table's field and providing getter/setter for each field.

Instances of this class, and its extensions, represent a record in the database. This service provides basic CRUD functions to access those records:
- **getRecord**: retrieves a single record from the database
- **insertRecord**: adds a new record to the database
- **updateRecord**: updates a record in the database
- **deleteRecord**: deletes a record from the database

Additional functions are described in the **FourDModel** wiki page.

### FourDCollection
A service class that represents a collection of 4D records. It is basically an Array of **FourDModel** instances.

This class provides a function to retrieve a set of records from a 4D Database:
- **getRecords**: will take a [Query String](https://github.com/fourctv/FourDRESTApi/wiki/The-JS44D-Query-String) and send a **[REST_GetRecords](https://github.com/fourctv/FourDRESTApi/wiki/REST_GetRecords)** request to 4D to retrieve a collection of 4D records. Record data come as Data Model (*FourDModel*) instances.

## Widgets
The following widgets and components are available for use in Angular apps, and those also interact with a 4D backend.

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
This widget builds upon the **QueryBand** and **DataGrid** components. It associates a **QueryBand** and a **DataGrid**, so the results of a query are displayed on the associated **DataGrid**.

![](https://i.gyazo.com/b1a5070c05011be9fa6865b5aa770389.png)

The widget provides a button bar with functionality to add/edit/delete records. It also allows for user defined custom buttons added to the button bar.

### Web App Container Component
This is a Web App wrapper component, that ensures that the application component runs authenticated. If upon app initialization, it is not yet authenticated to a 4D backend, this component will display a **Login** dialog to get user credentials and authenticate the user.

### 4D List DropDown Control
This is an HTML **select** drop down whose items are obtained from a 4D Choice List. One of the parameters to this widget is the choice list name.

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

