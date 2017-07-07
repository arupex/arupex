#Utilities

#####Arupex comes built in with a couple utilities which are automatically injected into your application!
###### Note: if you decide to have a service/dataservice/hook with the same name as one of these you will loose the ability to use it

#Injected - these will be availible in all your hooks/dataServices/services and even middleware and responses!
 
  - i18n
 
    - sort(locale) returns a Array.prototype.sort compatible sort function optimized for your locale
   
    - string(map, locale) - returns the value out of a locale map ie. { en_US :'hello', es_MX : 'hola' } fallsback to english if no value was returned
    
  - tracer(callback, recursive, observer)(obj/fnc/var) turns the obj,fnc,var into an observable tracer object
 
  - meter(callback)(name) - gives you a meter which you can .end() to get its final value { name : name, time : milliseconds since init }
 
  - logger(name, opts) - creates a friendly logger for you
  
#Part of Arupex - but not injected but used under the hood, and you can use them too

 - clientBuilder - generates a client based on a array of urls or a map of { fncName : url } 
 
 - codeGenerator - allows you to save in memory generated 'classes' like a clientBuilder client
 
 - pipeline - gives you a middlware pipeline with responses
 
 - structured - lets you take a object turn it into a 'structure' (document schema), and lets you turn structures into implementations
 
 - requireDirectory - lets you require a whole directy of js files, also lets you watch for updates (because who likes reloading right?)
 
 - metricTracer - a mix between meter and tracer 2 for 1 if you like
 
 - injector - a simple but powerful function that allows you to inject parameters based on names
 
 - docGenerator - turns an array of urls into swagger!

 - asyncize - turns a synchronous function or property into an async promise-able
 
 - routeAnalyzer - analyzes urls (used by the http server backend interceptor)