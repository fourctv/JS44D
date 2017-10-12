d# JS44D Library
Pascal's [4D RESTApi](https://github.com/fourctv/FourDRESTApi) companion [Angular Typescript](http://angular.io) library.

This library includes a series of Angular services, components and widgets, that interface to a 4D Database backend via **4D RESTApi** component. The Component must be installed in the 4D Database, and Web Serving must be enabled.

Detailes documentation for each service/component in this library can be found on the [wiki here](https://github.com/fourctv/JS44D/wiki). Following is a run down of the library contents.

## Services
The library provides some services for accessing a 4D backend that has the **4D RESTApi** Component installed.

### JSFourDInterface
This is the base service class that implements all the calls to **4D RESTApi**.

The two key functions made available by this class are:
- **call4DRESTMethod**: a wrapper function to enable calling any **4D RESTApi** entry point; it automatically adds *Session Key* and a *hash* to each POST request sent to 4D
- **signin**: a function that will send a sign in request to 4D and process the response from **REST_Authenticate**.

### JSFourDModel

### JSFourDCollection

## Widgets
The following widgets and components are available for use in Angular apps, and those also interact with a 4D backend.

### Login Component

### Datagrid Component

### Query Band Component

### Record List Component

### Web App Container Component

### 4D List DropDown Control

## Additional Widgets/Services
Some additional widgets/services are also part of the library, but those do not interact with 4D backends and do not depend on the **4D RESTApi**.

### MDI Dialog Service

### List Selector Dialog
