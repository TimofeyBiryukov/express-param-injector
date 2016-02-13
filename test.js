

var express = require('express');
var http = require('http');

var app = express();
var Injector = require('./index');


var PORT = 1333;


app.get('/testInjection', Injector.IC(function(foo, bar) {
  this.res.end(foo + ', ' + bar);
}));


//app.get('/testMultipleInjections', Injector.IC(function(foo, bar) {
//  this.res.end(foo, bar);
//}));


app.listen(PORT);
console.log('<--- Server lifted --->');
console.log('http://127.0.0.1:' + PORT);
console.log('</--- Server lifted --->');


/**
 * testing query injection
 */
http.get('http://127.0.0.1:' + PORT + '/testInjection?foo=bar&bar=foo', function(res) {
  console.log('<--- request /test --->');
  console.log(res.statusCode);
  res.on('data', function(buffer) {
    var body = buffer.toString();
    console.log(body);
    console.assert(body === 'bar, foo');
    console.log('</--- request /test --->');
  });
});
