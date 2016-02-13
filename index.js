

var ARROW_ARG = /^([^\(]+?)=>/;
var FN_ARGS = /^[^\(]*\(\s*([^\)]*)\)/m;
var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;



/**
 * @constructor
 * @param {function} fn
 * @param {?express.request} opt_req
 * @param {?express.response} opt_res
 * @param {?function} opt_next
 */
function Injector(fn, opt_req, opt_res, opt_next) {
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
   * @type {?function}
   */
  this.next = opt_next;

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
  this.checkInit();
};


/**
 *
 * @param {express.response} res
 */
Injector.prototype.setRes = function(res) {
  this.response = res;
  this.res = res;
  this.checkInit();
};


/**
 *
 * @param {function} next
 */
Injector.prototype.setNext = function(next) {
  this.next = next;
};


/**
 *
 * @return {boolean}
 */
Injector.prototype.checkInit = function() {
  this.inited = !!(this.request && this.req &&
      this.response && this.res);

  return this.inited;
};


/**
 *
 * @return {Array.<string|number|boolean>}
 */
Injector.prototype.getInjections = function() {
  return this.injectParameters(Injector.extractArgs(this.fn));
};


/**
 *
 * @param {?Array.<string>} arguments
 * @return {Array.<string|number|boolean>}
 */
Injector.prototype.injectParameters = function(arguments) {
  var self = this;

  if (!arguments.length) {
    arguments = [arguments];
  }

  return arguments.map(function(paramName) {
    if (paramName === 'req' || paramName === 'request') {
      return self.req;
    }
    if (paramName === 'res' || paramName === 'response') {
      return self.res;
    }
    if (paramName === 'next') {
      return self.next;
    }
    if (paramName === 'self') {
      return self;
    }

    return self.getReqParam(paramName);
  });
};


/**
 * @param {string} paramName
 * @param {?*} opt_default
 * @return {*}
 */
Injector.prototype.getReqParam = function(paramName, opt_default) {
  var body;
  if (this.req.body) {
    body = this.req.body[paramName];
  }
  return this.req.params[paramName] ||
      this.req.query[paramName] ||
      body || opt_default;
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
 * @param {?Object} opt_scope
 * @return {Function}
 */
Injector.IC = function(fn, opt_scope) {
  var injector = new Injector(fn);
  return function(req, res, next) {
    injector.setReq(req);
    injector.setRes(res);
    injector.setNext(next);
    fn.apply(opt_scope || injector, injector.getInjections());
  };
};


/**
 *
 * @type {Injector}
 */
module.exports = Injector;
