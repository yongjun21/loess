'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _mathjs = require('mathjs');

var _mathjs2 = _interopRequireDefault(_mathjs);

var _lodash = require('lodash.sortby');

var _lodash2 = _interopRequireDefault(_lodash);

var _gaussian = require('gaussian');

var _gaussian2 = _interopRequireDefault(_gaussian);

var _inputsValidation = require('./inputsValidation');

var _helpers = require('./helpers');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// import data from '../data/gas.json'

var Loess = function () {
  function Loess(data) {
    var _this = this;

    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, Loess);

    Object.assign(this, (0, _inputsValidation.validateModel)(data, options));

    if (this.options.normalize) this.normalization = this.x.map(_helpers.normalize);

    this.expandedX = (0, _helpers.polynomialExpansion)(this.x, this.options.degree);
    var normalized = this.normalization ? this.x.map(function (x, idx) {
      return _this.normalization[idx](x);
    }) : this.x;
    this.transposedX = (0, _helpers.transpose)(normalized);
  }

  _createClass(Loess, [{
    key: 'predict',
    value: function predict(data) {
      var _this2 = this;

      var _validatePredict$bind = _inputsValidation.validatePredict.bind(this)(data),
          x_new = _validatePredict$bind.x_new,
          n = _validatePredict$bind.n;

      var expandedX = (0, _helpers.polynomialExpansion)(x_new, this.options.degree);
      var normalized = this.normalization ? x_new.map(function (x, idx) {
        return _this2.normalization[idx](x);
      }) : x_new;
      var distM = (0, _helpers.distMatrix)((0, _helpers.transpose)(normalized), this.transposedX);
      var weightM = (0, _helpers.weightMatrix)(distM, this.w, this.bandwidth);

      var fitted = void 0,
          residuals = void 0,
          weights = void 0,
          betas = void 0;
      function iterate(wt) {
        var _this3 = this;

        fitted = [];
        residuals = [];
        betas = [];
        weights = _mathjs2.default.dotMultiply(wt, weightM);
        (0, _helpers.transpose)(expandedX).forEach(function (point, idx) {
          var fit = (0, _helpers.weightedLeastSquare)(_this3.expandedX, _this3.y, weights[idx]);
          if (fit.error) {
            var sumWeights = _mathjs2.default.sum(weights[idx]);
            var mle = sumWeights === 0 ? 0 : _mathjs2.default.multiply(_this3.y, weights[idx]) / sumWeights;
            fit.beta = _mathjs2.default.zeros(_this3.expandedX.length).set([0], mle);
            fit.residual = _mathjs2.default.subtract(_this3.y, mle);
          }
          fitted.push(_mathjs2.default.squeeze(_mathjs2.default.multiply(point, fit.beta)));
          residuals.push(fit.residual);
          betas.push(fit.beta.toArray());
          var median = _mathjs2.default.median(_mathjs2.default.abs(fit.residual));
          wt[idx] = fit.residual.map(function (r) {
            return (0, _helpers.weightFunc)(r, 6 * median, 2);
          });
        });
      }

      var robustWeights = Array(n).fill(_mathjs2.default.ones(this.n));
      for (var iter = 0; iter < this.options.iterations; iter++) {
        iterate.bind(this)(robustWeights);
      }var output = { fitted: fitted, betas: betas, weights: weights };

      if (this.options.band) {
        var z = (0, _gaussian2.default)(0, 1).ppf(1 - (1 - this.options.band) / 2);
        var halfwidth = weights.map(function (weight, idx) {
          var V1 = _mathjs2.default.sum(weight);
          var V2 = _mathjs2.default.multiply(weight, weight);
          var intervalEstimate = Math.sqrt(_mathjs2.default.multiply(_mathjs2.default.square(residuals[idx]), weight) / (V1 - V2 / V1));
          return intervalEstimate * z;
        });
        Object.assign(output, { halfwidth: halfwidth });
      }

      return output;
    }
  }, {
    key: 'grid',
    value: function grid(cuts) {
      var _this4 = this;

      _inputsValidation.validateGrid.bind(this)(cuts);

      var x_new = [];
      var x_cuts = [];
      this.x.forEach(function (x, idx) {
        var x_sorted = (0, _lodash2.default)(x);
        var x_min = x_sorted[0];
        var x_max = x_sorted[_this4.n - 1];
        var width = (x_max - x_min) / (cuts[idx] - 1);
        x_cuts.push([]);
        for (var i = 0; i < cuts[idx]; i++) {
          x_cuts[idx].push(x_min + i * width);
        }var repeats = 1;
        var copies = 1;
        for (var _i = idx - 1; _i >= 0; _i--) {
          repeats *= cuts[_i];
        }for (var _i2 = idx + 1; _i2 < _this4.d; _i2++) {
          copies *= cuts[_i2];
        }x_new.push([]);
        for (var _i3 = 0; _i3 < repeats; _i3++) {
          x_new[idx] = x_new[idx].concat(x_cuts[idx].reduce(function (acc, cut) {
            return acc.concat(Array(copies).fill(cut));
          }, []));
        }
      });

      var data = { x: x_new[0], x_cut: x_cuts[0] };
      if (this.d > 1) Object.assign(data, { x2: x_new[1], x_cut2: x_cuts[1] });
      return data;
    }
  }]);

  return Loess;
}();

// const w = data.NOx.map(() => Math.random() * 10)
// const fit = new Loess({y: data.NOx, x: data.E, w}, {span: 0.8, band: 0.8, degree: 'quadratic'})
// console.log(JSON.stringify(fit.predict(fit.grid([30]))))


exports.default = Loess;