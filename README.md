# JS44D Library
Pascal's [4D RESTApi](https://github.com/fourctv/FourDRESTApi) companion [Angular Typescript](http://angular.io) library.

This library includes a series of Angular services, components and widgets, that interface to a 4D Database backend via **4D RESTApi** component. The Component must be installed in the 4D Database, and Web Serving must be enabled.

Detailed documentation for each service/component in this library can be found on the [wiki here](https://github.com/fourctv/JS44D/wiki). Following is a quick run down of the library contents.

## Services
The library provides services for accessing a 4D backend that has the **4D RESTApi** Component installed.

### JSFourDInterface
This is the base service class that implements most of the calls to **4D RESTApi**.

The two key functions made available by this class are:
- **call4DRESTMethod**: a wrapper function to enable calling any **4D RESTApi** entry point; it automatically adds *Session Key* and a *hash* to each POST request sent to 4D
- **signin**: a function that will send a **REST_Authenticate** sign in request to 4D and process the response from 4D.

This class also provides some static variables:
- **currentUser**: the name of the currectly signed in user
- **authentication**: the authentication response object, returned by the **REST_Authenticate** call
- **sessionKey**: the current session token, that must be present in all requests to 4D
- etc..

### JSFourDModel
This a service class that provides CRUD functionality. It provides the ability to retrieve, create, update or delete records from a table.

This class builds upon the Data Model functionality, as described in the [RESTApi Component](https://github.com/fourctv/FourDRESTApi#js44d-data-models). 4D table's Data Models extend **JSFourDModel**, describing each table field and providing getter/setter for each field.

Instances of this class, and its extensions, represent a record in the database. This service provides CRUD functions to access those records:
- **getRecord**: retrieves a single record from the database
- **insertRecord**: adds a new record to the database
- **updateRecord**: updates a record in the database
- **deleteRecord**: deletes a record from the database

Additional functions are described in the **JSFourDModel** wiki page.

### JSFourDCollection
A service class that represents a collection of 4D records, by means of an Array of **JSFourDModel** instances.

This class provides a function to retrieve a set of records from a 4D Database:
- **getRecords**: will take a Query String and send a **REST_GetRecords** request to 4D to retrieve a collection of 4D records, as Data Model (*JSFourDModel*) instances.

## Widgets
The following widgets and components are available for use in Angular apps, and those also interact with a 4D backend.

### Login Component
A basic Login dialog that takes a user name and password. It calls *JSFourDInterface signin* function, that sends a **REST_Authenticate** request to 4D to authenticate the given user.

[![https://gyazo.com/2e6afd8b53bdd50d68fa01616b62b30e](https://i.gyazo.com/2e6afd8b53bdd50d68fa01616b62b30e.png)](https://gyazo.com/2e6afd8b53bdd50d68fa01616b62b30e)

### Datagrid Component
This Component provides Data Grid functionality, to display and interact with a list of records from a 4D Database.

[![https://gyazo.com/d75381f5cdbea2f9be82ce05bea845e4](https://i.gyazo.com/d75381f5cdbea2f9be82ce05bea845e4.png)](https://gyazo.com/d75381f5cdbea2f9be82ce05bea845e4)

The component is based on a KendoUI Grid widget, and displays contents from _JSFourDModel_ instances from a _JSFourDColelction_. 

### Query Band Component
A query banc widget that provides functionality for querying a 4D Database, built upon a _JSFourDModel_.

[![https://gyazo.com/ce4fcbfe6b8507e32e0fcb974913a9ae](https://i.gyazo.com/ce4fcbfe6b8507e32e0fcb974913a9ae.png)](https://gyazo.com/ce4fcbfe6b8507e32e0fcb974913a9ae)

It allows for a user defined query form, advanced query functionality and the ability to save predefined queries.

### Record List Component
This widget builds upon the **QueryBand** and **DataGrid** components. It associates a **QueryBand** and a **DataGrid**, so the results of a query are displayed on the associated **DataGrid**.

[![https://gyazo.com/b1a5070c05011be9fa6865b5aa770389](https://i.gyazo.com/b1a5070c05011be9fa6865b5aa770389.png)](https://gyazo.com/b1a5070c05011be9fa6865b5aa770389)

The widget also provides functionality to add/edit/delete records via a button bar, and allows for user defined custom buttons.

### Web App Container Component
This is a Web App wrapper component, that ensures that the application component runs authenticated. If upon app initialization, if not yet authenticated to 4D backend, this component will display a **Login** dialog to get user credentials and authenticate user.

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
A set of service classes that provide functionality to show multiple floating dialgo windows, which can be modal or not.

[![https://gyazo.com/e2c57ff1bcbebec87d8cde35f662007e](https://i.gyazo.com/e2c57ff1bcbebec87d8cde35f662007e.png)](https://gyazo.com/e2c57ff1bcbebec87d8cde35f662007e)

### List Selector Dialog
A component that presents a dialog with a list of items for user selection.

[![https://gyazo.com/e2c57ff1bcbebec87d8cde35f662007e](https://i.gyazo.com/e2c57ff1bcbebec87d8cde35f662007e.png)](https://gyazo.com/e2c57ff1bcbebec87d8cde35f662007e)
