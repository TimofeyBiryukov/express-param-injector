

var ARROW_ARG = /^([^\(]+?)=>/;
var FN_ARGS = /^[^\(]*\(\s*([^\)]*)\)/m;
var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;



/**
 * @constructor
 * @param {Function|Array.<String|Function>} fn
 * @param {express.request=} opt_req
 * @param {express.response=} opt_res
 * @param {function=} opt_next
 */
function Injector(fn, opt_req, opt_res, opt_next) {

  /**
   *
   * @type {?express.request}
   */
  this.req = this.request = opt_req;

  /**
   *
   * @type {?express.response}
   */
  this.res = this.response = opt_res;

  /**
   * @type {?function}
   */
  this.next = opt_next;

  /**
   *
   * @type {Function}
   */
  this.fn = function() {};

  /**
   *
   * @type {boolean}
   */
  this.arrayNotation = false;

  /**
   *
   * @type {Array.<String>}
   */
  this.__presetParams = [];


  if (fn) {
    this.setFn(fn);
  }
}


/**
 *
 * @param {express.request} req
 */
Injector.prototype.setReq = function(req) {
  this.request = req;
  this.req = req;
};


/**
 *
 * @param {express.response} res
 */
Injector.prototype.setRes = function(res) {
  this.response = res;
  this.res = res;
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
 * @param {Function|Array.<String|Function>} fn
 * @return {function} fn
 */
Injector.prototype.parseFn = function(fn) {
  if (Array.isArray(fn)) {
    this.arrayNotation = true;
    this.__presetParams = fn.slice(0, fn.length - 1);
    fn = fn[fn.length - 1];
  }

  return fn;
};


/**
 *
 * @param {Function|Array.<String|Function>} fn
 */
Injector.prototype.setFn = function(fn) {
  this.fn = this.parseFn(fn);
};


/**
 * @return {Function}
 */
Injector.prototype.getFn = function() {
  return this.fn;
};


/**
 *
 * @return {Array.<string|number|boolean>}
 */
Injector.prototype.getInjections = function() {
  if (this.arrayNotation) {
    return this.injectParameters(this.__presetParams);
  }
  return this.injectParameters(Injector.extractArgs(this.fn));
};


/**
 *
 * @param {?Array.<string>} argumentNames
 * @return {Array.<string|number|boolean>}
 */
Injector.prototype.injectParameters = function(argumentNames) {
  var self = this;

  if (!argumentNames.length) {
    argumentNames = [argumentNames];
  }

  return argumentNames.map(function(paramName) {
    if (paramName === 'req' || paramName === 'request') {
      return self.req;
    }
    if (paramName === 'res' || paramName === 'response') {
      return self.res;
    }
    if (paramName === 'next') {
      return self.next;
    }
    if (paramName === 'self' || paramName === 'injector') {
      return self;
    }

    return self.getReqParam(paramName);
  });
};


/**
 * @param {string} paramName
 * @param {*=} opt_default
 * @return {*}
 */
Injector.prototype.getReqParam = function(paramName, opt_default) {
  var body;
  if (this.req.body) {
    body = this.req.body[paramName];
  }
  // TODO: check if this.req.params & this.req.quesry are in existence
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
 * @param {Object=} opt_scope
 * @return {Function}
 */
Injector.IC = function(fn, opt_scope) {
  var injector = new Injector(fn);
  return function(req, res, next) {
    injector.setReq(req);
    injector.setRes(res);
    injector.setNext(next);
    injector.getFn().apply(opt_scope || injector,
        injector.getInjections());
  };
};


/**
 *
 * @type {Injector}
 */
module.exports = Injector;
