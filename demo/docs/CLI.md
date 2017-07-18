
####CLI
    
        
###### CREATE your app or parts of it (stubbed out)
    arupex create appName
    arupex create function      name
    arupex create policy        name
    arupex create service       name   
    arupex create dataservice   name  
    arupex create util          name
    arupex create hook          name
    arupex create worker        name
                 
###### Run your lambda / server
    arupex //will be deprecated 
    use
    arupex invoke event.json //location of event.json file 
    arupex server 
        
###### Run Mock Server - gives you a test harness
    arupex mock
    
###### Determine Mock Data Service Schema
    arupex schema