
### Policies - are good for checking parameters / checking authentication / authorization
    
    //works similarly to express middlware, however you can inject hooks/services
    module.exports = function(req, res, next, iamService, userHook){
        iamService.auth(userHook.getUserId()).then((userData) => {
            userHook.setData(userData);
            next();
        }).catch(() => {
            res.fail();
        });
    };