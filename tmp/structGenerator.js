module.exports = {
MeasureService: { getOne: { setSuccess:function (ok) {
          this.data = ok;
          this.error = false;
      },
setFail:function (fail) {
          this.error = fail;
      },
setSuccessByQuery:function (query, data){
          this.data = false;
          this.error = false;
          this.query[query] = data;
      },
data:false,
query:false,
error:true,
},getAll: { setSuccess:function (ok) {
          this.data = ok;
          this.error = false;
      },
setFail:function (fail) {
          this.error = fail;
      },
setSuccessByQuery:function (query, data){
          this.data = false;
          this.error = false;
          this.query[query] = data;
      },
data:false,
query:false,
error:true,
},create: { setSuccess:function (ok) {
          this.data = ok;
          this.error = false;
      },
setFail:function (fail) {
          this.error = fail;
      },
setSuccessByQuery:function (query, data){
          this.data = false;
          this.error = false;
          this.query[query] = data;
      },
data:false,
query:false,
error:true,
},update: { setSuccess:function (ok) {
          this.data = ok;
          this.error = false;
      },
setFail:function (fail) {
          this.error = fail;
      },
setSuccessByQuery:function (query, data){
          this.data = false;
          this.error = false;
          this.query[query] = data;
      },
data:false,
query:false,
error:true,
},delete: { setSuccess:function (ok) {
          this.data = ok;
          this.error = false;
      },
setFail:function (fail) {
          this.error = fail;
      },
setSuccessByQuery:function (query, data){
          this.data = false;
          this.error = false;
          this.query[query] = data;
      },
data:false,
query:false,
error:true,
},},UserService: { getLocale: { setSuccess:function (ok) {
          this.data = ok;
          this.error = false;
      },
setFail:function (fail) {
          this.error = fail;
      },
setSuccessByQuery:function (query, data){
          this.data = false;
          this.error = false;
          this.query[query] = data;
      },
data:false,
query:false,
error:true,
},getName: { setSuccess:function (ok) {
          this.data = ok;
          this.error = false;
      },
setFail:function (fail) {
          this.error = fail;
      },
setSuccessByQuery:function (query, data){
          this.data = false;
          this.error = false;
          this.query[query] = data;
      },
data:false,
query:false,
error:true,
},},ActivityService: { getOne: { setSuccess:function (ok) {
          this.data = ok;
          this.error = false;
      },
setFail:function (fail) {
          this.error = fail;
      },
setSuccessByQuery:function (query, data){
          this.data = false;
          this.error = false;
          this.query[query] = data;
      },
data:false,
query:false,
error:true,
},},globalFunc: { setSuccess:function (ok) {
          this.data = ok;
          this.error = false;
      },
setFail:function (fail) {
          this.error = fail;
      },
setSuccessByQuery:function (query, data){
          this.data = false;
          this.error = false;
          this.query[query] = data;
      },
data:false,
query:false,
error:true,
},
};