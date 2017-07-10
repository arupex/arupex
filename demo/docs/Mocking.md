# Mocks
    
In the demo we have a UserDataService and a CurrencyDataService, 

If we wanted to mock these to respond with successful responses we might do it like so:

    {
        UserDataService : {
            getOtherCurrency : {
                data : 'CAD'
            }
        },
        CurrencyDataService : {
            getLatestBase : {
                data : { MOCK : true }
            }
        }
    }
    
Note: the data property inside the Service/FunctionName object, if it was an error property it would return a Promise.fail

### Using 'structured' you can 

 - **toImplentation** - creates an implementation via a structure like the one above
 
 - **toGenerator** - creates a generator (which can be saved via codeGenerator) which gives you an easy to use interface to modify the structure
 
 - **toStructure** - turns an implementation into a structure (minus the data/error properties) think of it as a schema for your mocks