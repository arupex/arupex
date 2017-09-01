#Changelog

 # 0.0.1 - Initial Release
This Release includes all the major components in a working state, rigorous testing and optimizations along with sanity checks and supplimentary features will be added in future releases

### 0.0.6 - Minor Fixes
### 0.0.8 - Fix Directory Filter in Lambda Interceptor

### 0.0.9 - Mock Updates - add mock server as a CLI command (arupex mock) allowing automatic generation of a test harness
### 0.0.10 - Tracer updates allowing tracer to trace into promises and values returned by traced functions! and other minor tweaks
### 0.0.11 - CLI now has create methods for creating policies/responses/hooks/services/dataservices/utils/workers
### 0.0.15 - Mocks can now handle parameters like real functions
### 0.0.16 - multDirLoader for aws handle the fact 'tree' unix command does not work
### 0.0.17 - force callbackWaitsForEmptyEventLoop to false on context, if context is an obj, and opts.callbackWaitsForEmptyEventLoop is not true
### 0.0.18 - Minor Tweaks
### 0.0.19 - Removal of es7 padEnd from arupexCLI as some users complain does not operate on node 6

### 0.1.20 - Cleanup of lambda interceptor!
 - interceptorUtils, reducing complexity of lambda interceptor and making it possible to unit test much of it later
 - 2 tests that run demo to validate e2e operation
 - logger can now log functions as part of json with the output of [FUNCTION] using custom JSON.stringify replacer fnc
 
### 0.1.23 - Update Hyper-Request and use ^ version for updates
### 0.1.24 - Update Hyper-Request to minimum of 0.0.16