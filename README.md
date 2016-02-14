

# Express.js Params Injector

[introduction]


# Installation

In console:

    npm install express-param-injector
  
In code:

    require('express-param-injector');
  
  
# Usage

Start your express application, require express-param-injector and wrap your route function in Injector.IC method.
Then you can write any parameters names that you want to be injected as function arguments and Injector will look for them and inject them in to the function.

    var app = require('express')();
    var Injector = require('express-param-injector');
  
    app.listen(1334);
  
    app.get('/calculateAge', Injector.IC(function(name, birthYear, res) {
      var currentYear = new Date().getFullYear();
      var countedAge = currentYear - birthYear;
      res.end(name + ' is ' + countedAge + ' years old');
    }));
  
This can be applied to any callback express function that expects req, res to be first two params, and next callback will work as well:

    app.use(Injector.IC(function(id, next) {
      // check id here
      next();
    }));

`Request`, `response` and `next` alternatively can be accessed through `this` inside route function:

    app.post('/add', Injector.IC(function(a, b) {
      var result = a + b;
      this.res.end(result);  
    }));
 
 In case you have to have a specific `this` inside your route you can pass a scope function as a last parameter to Injector.IC:
 
 (If there is a need to still refer to Injector self param key can be ussed)
 
       /** @constructor */
       function Constructor() {}
   
       Constructor.prototype.checkId = function(id) {
         return id.toString() === (1234).toString();
       };
   
   
       var myConstructor = new Constructor();
       
       app.get('/checkId', Injector.IC(function(id, res, self) {
          // this is now `myConstructor`
          // but self.req and self.res are now avalible 
          
         if (this.checkId(id)) {
           res.status(200);
         } else {
           res.status(400);
         }
         res.end();
       }, myConstructor)));
 
 Client can pass parameters in URL string or body with express.js body parser, parameters will be found and injected in following order:
 
 1. request.query;
 2. request.params;
 3. request.body; // if exists
 
### Have a nice day :)


 
 
 