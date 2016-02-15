

var express = require('express');
var bodyParser = require('body-parser');
var http = require('http');

var app = express();
var Injector = require('./index');

var req;

var PORT = 1333;


app.use(bodyParser());


app.get('/testInjection', Injector.IC(function(foo, bar) {
  this.res.end(foo + ', ' + bar);
}));


app.post('/testInjection', Injector.IC(function(foo, bar) {
  this.res.end(foo + ', ' + bar);
}));


app.post('/testTypesInjection', Injector.IC(
    function(_sting, _number, _boolean, _object) {
  console.assert(typeof _sting === 'string');
  console.assert(typeof _number === 'number');
  console.assert(typeof _boolean === 'boolean');
  console.assert(typeof _object === 'object');
  this.res.end(_sting.toString() + ', ' +
      _number.toString() + ', ' +
      _boolean.toString() + ', ' +
      _object.toString());
}));


app.get('/testReqResPresets', Injector.IC(function(req, res, next) {
  console.assert(req.method);
  console.assert(res.end);
  console.assert(typeof next === 'function');
  res.end();
}));

app.post('/testMixInjections', Injector.IC(function(id, req, name, res) {
  console.assert(req.method);
  console.assert(res.end);
  res.end(name + '=' + id);
}));


/** @constructor */
function Constructor() {}

Constructor.prototype.checkId = function(id) {
  return id.toString() === (1234).toString();
};

app.get('/testOptScope', Injector.IC(function(id, res, self) {
  console.assert(self.res.end);

  if (this.checkId(id)) {
    res.status(200);
  } else {
    res.status(400);
  }
  res.end();
}, new Constructor()));


app.param('biz', Injector.IC(function(biz, next) {
  console.assert(biz === 'biz');
  next();
}));

app.get('/foo/bar/:biz', Injector.IC(function(biz) {
  this.res.end(biz);
}));


app.get('/arrayNotation', Injector.IC(['foo-bar-biz', function(fooBarBiz) {
  if (fooBarBiz) {
    this.res.status(200);
  } else {
    this.res.status(400);
  }
  this.res.end(fooBarBiz);
}]));


app.listen(PORT);
console.log('<--- Server lifted --->');
console.log('http://127.0.0.1:' + PORT);
console.log('</--- Server lifted --->');



/**
 * testing query injection
 */
req = http.get('http://127.0.0.1:' + PORT + '/testInjection?foo=bar&bar=foo',
    function test(res) {
  console.log('<--- test ' + res.req.method +
    ' ' + res.req.path +
    ' --->');
  console.log(res.statusCode);
  res.setEncoding('utf8');
  res.on('data', function(buffer) {
    var body = buffer.toString();
    console.log(body);
    console.assert(body === 'bar, foo');
    console.log('</--- test ' + res.req.method +
      ' ' + res.req.path +
      ' --->');
  });
});


/**
 * testing post body json injection
 */
req = http.request({
  hostname: '127.0.0.1',
  port: PORT,
  path: '/testInjection',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, function test(res) {
  console.log('<--- test ' + res.req.method +
    ' ' + res.req.path +
    ' --->');
  res.setEncoding('utf8');
  res.on('data', function(buffer) {
    var body = buffer.toString();
    console.log(body);
    console.assert(body === 'bar, foo');
    console.log('</--- test ' + res.req.method +
      ' ' + res.req.path +
      ' --->');
  });
});
req.write(JSON.stringify({
  'foo': 'bar',
  'bar': 'foo'
}));
req.end();


/**
 * testing different json types
 */
req = http.request({
  hostname: '127.0.0.1',
  port: PORT,
  path: '/testTypesInjection',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, function test(res) {
  console.log('<--- test ' + res.req.method +
    ' ' + res.req.path +
    ' --->');
  res.setEncoding('utf8');
  res.on('data', function(buffer) {
    var body = buffer.toString();
    console.log(body);
    console.assert(body === '_string, 1, true, [object Object]');
    console.log('</--- test ' + res.req.method +
        ' ' + res.req.path +
        ' --->');
  });
});
req.write(JSON.stringify({
  _sting: '_string',
  _number: 1,
  _boolean: true,
  _object: {
    'foo': 'bar'
  }
}));
req.end();


/**
 * testing injeciton request & response objects
 */
req = http.get('http://127.0.0.1:' + PORT + '/testReqResPresets', function test(res) {
  console.log('<--- test ' + res.req.method +
    ' ' + res.req.path +
    ' --->');
  res.setEncoding('utf8');
  res.on('data', function(buffer) {
    var body = buffer.toString();
    console.log(body);
    console.log('</--- test ' + res.req.method +
      ' ' + res.req.path +
      ' --->');
  });
});


/**
 * testing mixed param injection
 * req, res + query and body params
 */
req = http.request({
  hostname: '127.0.0.1',
  port: PORT,
  path: '/testMixInjections?id=1',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, function test(res) {
  console.log('<--- test ' + res.req.method +
    ' ' + res.req.path +
    ' --->');
  res.setEncoding('utf8');
  res.on('data', function(buffer) {
    var body = buffer.toString();
    console.log(body);
    console.assert(body === 'John=1');
    console.log('</--- test ' + res.req.method +
      ' ' + res.req.path +
      ' --->');
  });
});
req.write(JSON.stringify({
  name: 'John'
}));
req.end();


/**
 * testing optional function scope
 */
req = http.get('http://127.0.0.1:' + PORT + '/testOptScope?id=1234', function test(res) {
  console.log('<--- test ' + res.req.method +
    ' ' + res.req.path +
    ' --->');
  console.assert(res.statusCode === 200);
  console.log('</--- test ' + res.req.method +
    ' ' + res.req.path +
    ' --->');
});


/**
 * testing app.param & path params
 */
req = http.get('http://127.0.0.1:' + PORT + '/foo/bar/biz', function test(res) {
  console.log('<--- test ' + res.req.method +
    ' ' + res.req.path +
    ' --->');
  console.assert(res.statusCode === 200);
  res.on('data', function(data) {
    var body = data.toString();
    console.assert(body === 'biz');
  });
  console.log('</--- test ' + res.req.method +
    ' ' + res.req.path +
    ' --->');
});


/**
 * testing array notation
 */
req = http.get('http://127.0.0.1:' + PORT + '/arrayNotation?foo-bar-biz=foo_bar_biz', function test(res) {
  console.log('<--- test ' + res.req.method +
    ' ' + res.req.path +
    ' --->');
  console.assert(res.statusCode === 200);
  res.on('data', function(data) {
    var body = data.toString();
    console.assert(body === 'foo_bar_biz');
  });
  console.log('</--- test ' + res.req.method +
    ' ' + res.req.path +
    ' --->');
});
