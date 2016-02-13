

var ARROW_ARG = /^([^\(]+?)=>/;
var FN_ARGS = /^[^\(]*\(\s*([^\)]*)\)/m;
var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;



/**
 * @constructor
 * @param {function} fn
 * @param {?express.request} opt_req
 * @param {?express.response} opt_res
 */
function Injector(fn, opt_req, opt_res) {
  /**
   *
   * @type {express.request}
   */
  this.request = opt_req;

  /**
   *
   * @type {?express.request}
   */
  this.req = opt_req;

  /**
   *
   * @type {?express.response}
   */
  this.response = opt_res;

  /**
   *
   * @type {?express.response}
   */
  this.res = opt_res;

  /**
   *
   * @type {Function}
   */
  this.fn = fn;

  /**
   *
   * @type {boolean}
   */
  this.inited = false; // set to true when we get req & res objects
}


/**
 *
 * @param {express.request} req
 */
Injector.prototype.setReq = function(req) {
  this.request = req;
  this.req = req;
  this.checkInited();
};


/**
 *
 * @param {express.response} res
 */
Injector.prototype.setRes = function(res) {
  this.response = res;
  this.res = res;
  this.checkInited();
};


/**
 *
 * @return {boolean}
 */
Injector.prototype.checkInited = function() {
  this.inited = !!(this.request && this.req &&
      this.response && this.res);

  return this.inited;
};


/**
 *
 * @return {Array.<string|number|boolean>}
 */
Injector.prototype.getInjections = function() {
  return this.extractParameters(Injector.extractArgs(this.fn));
};


/**
 *
 * @param {?Array.<string>} paramNames
 * @return {Array.<string|number|boolean>}
 */
Injector.prototype.extractParameters = function(paramNames) {
  var self = this;

  if (!paramNames.length) {
    paramNames = [paramNames];
  }

  return paramNames.map(function(paramName) {
    if (paramName === 'req' || paramName === 'request') {
      return self.req;
    }
    if (paramName === 'res' || paramName === 'response') {
      return self.res;
    }

    return self.req.params[paramName] ||
        self.req.query[paramName] ||
        self.req.body[paramName];
  });
};


/**
 *
 * @param {function} fn
 * @return {Array.<string>}
 */
Injector.extractArgs = function(fn) {
  var fnText = fn.toString().replace(STRIP_COMMENTS, ''),
      args = fnText.match(ARROW_ARG) || fnText.match(FN_ARGS);
  return args[1].split(',').map(function(argName) {
    return argName.trim();
  });
};


/**
 *
 * @param {function} fn
 * @return {Function}
 */
Injector.IC = function(fn) {
  var injector = new Injector(fn);
  return function(req, res) {
    injector.setReq(req);
    injector.setRes(res);
    fn.apply(injector, injector.getInjections());
  };
};


/**
 *
 * @type {Injector}
 */
module.exports = Injector;
