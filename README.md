#arupex
Arupex is a Serverless/Server framework for NodeJS
It allows you to build a serverless application for your needs, but also allows you to wrap that with a http server if need be

![Logo](http://arupex.com/img/logo.png)

[![npm version](https://badge.fury.io/js/arupex.svg)](https://badge.fury.io/js/arupex)
[![dependencies](https://david-dm.org/arupex/areupex.svg)](http://github.com/arupex/arupex)
![Build Status](https://api.travis-ci.org/arupex/arupex.svg?branch=master) 
[![Donate](https://img.shields.io/badge/Donate-Arupex-green.svg)](https://pledgie.com/campaigns/31873)
![lifetimeDownloadCount](https://img.shields.io/npm/dt/arupex.svg?maxAge=2592000)

##Goals
 - Minimizing Boilerplate work
 - Making Testing easier on Developers
 - Making Writing Mocks a thing of the past
 - Simplifying Workflows
 - Making Dependency Injection simple and elegant
 - Making Tracing and Metrics automatic!
 - Make Rest Documentation Automatic!
 - Making i18n such as sorting easier/faster


####CLI
    
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

Check out our [Documentation](./demo/README.md) 

Soon to be up on [arupex.com](http://arupex.com)