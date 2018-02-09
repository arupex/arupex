# arupex
Arupex is a Serverless/Server framework for NodeJS
It allows you to build a serverless application for your needs, but also allows you to wrap that with a http server if need be

![Logo](http://arupex.com/img/logo.png)

[![npm version](https://badge.fury.io/js/arupex.svg)](https://badge.fury.io/js/arupex)
[![dependencies](https://david-dm.org/arupex/areupex.svg)](http://github.com/arupex/arupex)
![Build Status](https://api.travis-ci.org/arupex/arupex.svg?branch=master) 
[![Donate](https://img.shields.io/badge/Donate-Arupex-green.svg)](https://pledgie.com/campaigns/31873)
![lifetimeDownloadCount](https://img.shields.io/npm/dt/arupex.svg?maxAge=25920000)


Check out our [Documentation](./demo/README.md)  

## Goals
 - Minimizing Boilerplate work
 - Making Testing easier on Developers
 - Making Writing Mocks a thing of the past
 - Simplifying Workflows
 - Making Dependency Injection simple and elegant
 - Making Tracing and Metrics automatic!
 - Make Rest Documentation Automatic!
 - Making i18n such as sorting easier/faster

# Project Folder Structure
    ├── DataServiceUtils
    │   └── PetShopDataServiceUtil.js
    ├── DataServices
    │   └── PetShopDataService.js
    ├── Environments
    │   └── dev.js
    ├── Functions
    │   └── getPet.js
    │   └── addPet.js
    │   └── deletePet.js
    ├── Hooks
    │   └── Cookies.js
    │   └── Headers.js
    │   └── Params.js
    ├── Responses
    │   └── ok.js
    │   └── critical.js
    │   └── badRequest.js
    ├── Services
    │   └── Service.js
    ├── Workers
    │   └── DailyJob.js
    │   └── NightlyJob.js
    ├── Policies
    │   └── auth.js
    │   └── paramCheck.js
    ├── Core
    │   └── PetStoreReference.js
    ├── Models
    │   └── Pet.js
    ├── app.js
    ├── node_modules
    |    ...
    └── package.json
    
## Dependency Injection LifeCycle
can be thought of as a pyramid, were at each level the previous levels are injectable as well as same level (as of v0.3.1)

                ---------------
               /  Environment  \
               -----------------
              /    Arupex Core  \
              -------------------
             /         Core      \
             ---------------------
            /         Models      \
             ----------------------
           / Event/Context/Callback \
           --------------------------
          /           Hooks          \
          ----------------------------
         /        DataServices        \
         ------------------------------
        /       DataServiceUtils       \
        --------------------------------
       /           Services             \
       ----------------------------------
      /            Functions             \
      ------------------------------------
     /               app.js               \
     --------------------------------------
     
     
     Arupex Core - logger, tracer, meter, i18n, swagger, directoryLoader
     Pre-Execution happens when your arupex application is loaded but before it is invoke as a lambda
     Environment-Models are initalized as part of Pre-Execution
     DataServices if clients are initalized as Part of Pre-Execution else during execution(request)
     Event-Services are initalized during Execution
     Functions/App.js are initalized during Pre-Execution

#### CLI
    
###### Run your lambda / server
    arupex //will be deprecated 
    use
    arupex invoke event.json //location of event.json file 
    arupex server 
    
###### CREATE your app or parts of it (stubbed out)
    arupex create appName
    arupex create function      name
    arupex create policy        name
    arupex create service       name   
    arupex create dataservice   name  
    arupex create util          name
    arupex create hook          name
    arupex create worker        name
                 
        
###### Run Mock Server - gives you a test harness
    arupex mock
    
###### Determine Mock Data Service Schema
    arupex schema


Soon to be up on [arupex.com](http://arupex.com)