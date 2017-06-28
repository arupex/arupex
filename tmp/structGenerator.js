module.exports = {
MeasureService: { getOne: { setSuccess:function (ok) {
          this.data = ok;
          this.error = false;
      },
setFail:function (fail) {
          this.error = fail;
      },
data:false,
error:true,
},getAll: { setSuccess:function (ok) {
          this.data = ok;
          this.error = false;
      },
setFail:function (fail) {
          this.error = fail;
      },
data:false,
error:true,
},create: { setSuccess:function (ok) {
          this.data = ok;
          this.error = false;
      },
setFail:function (fail) {
          this.error = fail;
      },
data:false,
error:true,
},update: { setSuccess:function (ok) {
          this.data = ok;
          this.error = false;
      },
setFail:function (fail) {
          this.error = fail;
      },
data:false,
error:true,
},delete: { setSuccess:function (ok) {
          this.data = ok;
          this.error = false;
      },
setFail:function (fail) {
          this.error = fail;
      },
data:false,
error:true,
},},UserService: { getLocale: { setSuccess:function (ok) {
          this.data = ok;
          this.error = false;
      },
setFail:function (fail) {
          this.error = fail;
      },
data:false,
error:true,
},getName: { setSuccess:function (ok) {
          this.data = ok;
          this.error = false;
      },
setFail:function (fail) {
          this.error = fail;
      },
data:false,
error:true,
},},ActivityService: { getOne: { setSuccess:function (ok) {
          this.data = ok;
          this.error = false;
      },
setFail:function (fail) {
          this.error = fail;
      },
data:false,
error:true,
},},globalFunc: { setSuccess:function (ok) {
          this.data = ok;
          this.error = false;
      },
setFail:function (fail) {
          this.error = fail;
      },
data:false,
error:true,
},
};