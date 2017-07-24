module.exports = {
init:function (restOpts, debug){
   let HyperRequest = require('hyper-request');
   this.log = restOpts.logger || {
       info : () => {  },
       critical : () => {  }
   };

   this.restClient = new HyperRequest(restOpts);
   this.interpolate = function (str) {
       return function interpolate(o) {
      if(!o){
          this.log.critical(`${str} could not be evaluated with falsey interpolation input`);
          return str;
      }
      return str.replace(new RegExp('{{([^{}]+)}}', 'g'), function (a, b) {
          if(!o[b]) {
         this.log.critical(`${str} could not be evaluated with missing key ${b} during interpolation`);
          }
          return o[b];
      });
       };
   };
   this.debug = debug;
   this.initialized = true;
   return this;
    },
deleteAttachmentsWithId:function (opts, ok, fail) {
       if(!this.initialized){
      this.init(opts);
       }
       let url = this.interpolate("attachments/{{id}}")(opts);
       this.log.info(`hitting ${url}`);
       return this.restClient["delete"](url, opts, ok, fail);
   },
deleteMeasuresWithMeasureIdByHard_delete:function (opts, ok, fail) {
       if(!this.initialized){
      this.init(opts);
       }
       let url = this.interpolate("measures/{{measureId}}?hard_delete={{hard_delete}}")(opts);
       this.log.info(`hitting ${url}`);
       return this.restClient["delete"](url, opts, ok, fail);
   },
getAttachmentsWithId:function (opts, ok, fail) {
       if(!this.initialized){
      this.init(opts);
       }
       let url = this.interpolate("attachments{{id}}")(opts);
       this.log.info(`hitting ${url}`);
       return this.restClient["get"](url, opts, ok, fail);
   },
getLatestByBase:function (opts, ok, fail) {
       if(!this.initialized){
      this.init(opts);
       }
       let url = this.interpolate("latest?base={{base}}")(opts);
       this.log.info(`hitting ${url}`);
       return this.restClient["get"](url, opts, ok, fail);
   },
getMeasuresByNode_id:function (opts, ok, fail) {
       if(!this.initialized){
      this.init(opts);
       }
       let url = this.interpolate("measures?node_id={{node_id}}")(opts);
       this.log.info(`hitting ${url}`);
       return this.restClient["get"](url, opts, ok, fail);
   },
getMeasuresWithMeasureIdActivity:function (opts, ok, fail) {
       if(!this.initialized){
      this.init(opts);
       }
       let url = this.interpolate("measures/{{measureId}}/activity")(opts);
       this.log.info(`hitting ${url}`);
       return this.restClient["get"](url, opts, ok, fail);
   },
getMeasuresWithMeasureIdAttachments:function (opts, ok, fail) {
       if(!this.initialized){
      this.init(opts);
       }
       let url = this.interpolate("measures/{{measureId}}/attachments")(opts);
       this.log.info(`hitting ${url}`);
       return this.restClient["get"](url, opts, ok, fail);
   },
getMeasuresWithMeasureIdComments:function (opts, ok, fail) {
       if(!this.initialized){
      this.init(opts);
       }
       let url = this.interpolate("measures/{{measureId}}/comments")(opts);
       this.log.info(`hitting ${url}`);
       return this.restClient["get"](url, opts, ok, fail);
   },
getMeasuresWithMeasuresId:function (opts, ok, fail) {
       if(!this.initialized){
      this.init(opts);
       }
       let url = this.interpolate("measures/{{measuresId}}")(opts);
       this.log.info(`hitting ${url}`);
       return this.restClient["get"](url, opts, ok, fail);
   },
patchAttachmentsWithId:function (opts, ok, fail) {
       if(!this.initialized){
      this.init(opts);
       }
       let url = this.interpolate("attachments/{{id}}")(opts);
       this.log.info(`hitting ${url}`);
       return this.restClient["patch"](url, opts, ok, fail);
   },
patchMeasuresWithMeasureId:function (opts, ok, fail) {
       if(!this.initialized){
      this.init(opts);
       }
       let url = this.interpolate("measures/{{measureId}}")(opts);
       this.log.info(`hitting ${url}`);
       return this.restClient["patch"](url, opts, ok, fail);
   },
postMeasures:function (opts, ok, fail) {
       if(!this.initialized){
      this.init(opts);
       }
       let url = this.interpolate("measures")(opts);
       this.log.info(`hitting ${url}`);
       return this.restClient["post"](url, opts, ok, fail);
   },
postMeasuresWithMeasureIdAttachments:function (opts, ok, fail) {
       if(!this.initialized){
      this.init(opts);
       }
       let url = this.interpolate("measures/{{measureId}}/attachments")(opts);
       this.log.info(`hitting ${url}`);
       return this.restClient["post"](url, opts, ok, fail);
   },
postMeasuresWithMeasureIdComments:function (opts, ok, fail) {
       if(!this.initialized){
      this.init(opts);
       }
       let url = this.interpolate("measures/{{measureId}}/comments")(opts);
       this.log.info(`hitting ${url}`);
       return this.restClient["post"](url, opts, ok, fail);
   },
putAttachmentsWithId:function (opts, ok, fail) {
       if(!this.initialized){
      this.init(opts);
       }
       let url = this.interpolate("attachments/{{id}}")(opts);
       this.log.info(`hitting ${url}`);
       return this.restClient["put"](url, opts, ok, fail);
   },
putMeasuresWithMeasureId:function (opts, ok, fail) {
       if(!this.initialized){
      this.init(opts);
       }
       let url = this.interpolate("measures/{{measureId}}")(opts);
       this.log.info(`hitting ${url}`);
       return this.restClient["put"](url, opts, ok, fail);
   },

};