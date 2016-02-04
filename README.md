# loess
JavaScript implementation of the Locally-Weighted Regression C package by Cleveland, Grosse and Shyu (1992)


First install the package:
```
npm install loess --save
```

Load in your data:
```javascript
var data = require('./myData.json')
```

Instantiate a LOESS model with the data:
```javascript
var LOESS = require('loess')
var model = new LOESS(data)
```

Fit model by call the **.predict()** method on the model object:
```javascript
var fit = model.predict()
console.log(fit)
// do something else with fit
```

To fit model on a new set of points, pass them in **.predict()** as an object with a data property:
```javascript
var test = {
  data: {
    x1: [1, 2, 3],
    x2: [4, 5, 6]
  }
}
var fit = model.predict(test)
console.log(fit)
```

You can pass options into your LOESS model:
```javascript
var options = {span: 0.5, degree: 1}
data.options = options
var model = new LOESS(data)
// model will be fitted with supplied options
```

Options can also be set for **.predict()**:
```javascript
var test = {
  data: {
    x1: [1, 2, 3],
    x2: [4, 5, 6]
  },
  band: 0.8
}
var fit = model.predict(test)
// fit now includes a property halfwidth
```
