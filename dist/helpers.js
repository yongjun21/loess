'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.weightFunc = weightFunc;
exports.normalize = normalize;
exports.transpose = transpose;
exports.euclideanDist = euclideanDist;
exports.distMatrix = distMatrix;
exports.weightMatrix = weightMatrix;
exports.polynomialExpansion = polynomialExpansion;
exports.weightedLeastSquare = weightedLeastSquare;

var _mathjs = require('mathjs');

var _lodash = require('lodash.sortby');

var _lodash2 = _interopRequireDefault(_lodash);

var _lodash3 = require('lodash.zip');

var _lodash4 = _interopRequireDefault(_lodash3);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function weightFunc(d, dmax, degree) {
  return d < dmax ? Math.pow(1 - Math.pow(d / dmax, degree), degree) : 0;
}

function normalize(referenceArr) {
  var cutoff = Math.ceil(0.1 * referenceArr.length);
  var trimmed_arr = (0, _lodash2.default)(referenceArr).slice(cutoff, referenceArr.length - cutoff);
  var sd = (0, _mathjs.std)(trimmed_arr);
  return function (outputArr) {
    return outputArr.map(function (val) {
      return val / sd;
    });
  };
}

function transpose(X) {
  var transposed = [];

  var _loop = function _loop(i) {
    transposed.push(X.map(function (x) {
      return x[i];
    }));
  };

  for (var i = 0; i < X[0].length; i++) {
    _loop(i);
  }
  return transposed;
}

function euclideanDist(orig, dest) {
  if (orig.length < 2) {
    return Math.abs(orig[0] - dest[0]);
  } else {
    return Math.sqrt(orig.reduce(function (acc, val, idx) {
      return acc + Math.pow(val - dest[idx], 2);
    }, 0));
  }
}

function distMatrix(origSet, destSet) {
  return origSet.map(function (orig) {
    return destSet.map(function (dest) {
      return euclideanDist(orig, dest);
    });
  });
}

function weightMatrix(distMat, inputWeights, bandwidth) {
  return distMat.map(function (distVect) {
    var sorted = (0, _lodash2.default)((0, _lodash4.default)(distVect, inputWeights), function (v) {
      return v[0];
    });
    var cutoff = (0, _mathjs.sum)(inputWeights) * bandwidth;
    var sumOfWeights = 0;
    var cutoffIndex = sorted.findIndex(function (v) {
      sumOfWeights += v[1];
      return sumOfWeights >= cutoff;
    });
    var dmax = bandwidth > 1 ? sorted[sorted.length - 1][0] * bandwidth : sorted[cutoffIndex][0];
    return (0, _mathjs.dotMultiply)(distVect.map(function (d) {
      return weightFunc(d, dmax, 3);
    }), inputWeights);
  });
}

function polynomialExpansion(factors, degree) {
  var expandedSet = [];
  var constTerm = 1;
  if (Array.isArray(factors[0])) constTerm = Array(factors[0].length).fill(1);
  function crossMultiply(accumulator, pointer, n) {
    if (n > 1) {
      for (var i = pointer; i < factors.length; i++) {
        crossMultiply((0, _mathjs.dotMultiply)(accumulator, factors[i]), i, n - 1);
      }
    } else {
      expandedSet.push(accumulator);
    }
  }
  for (var d = 0; d <= degree; d++) {
    crossMultiply(constTerm, 0, d + 1);
  }return expandedSet;
}

function weightedLeastSquare(predictors, response, weights) {
  try {
    var weightedY = (0, _mathjs.matrix)((0, _mathjs.dotMultiply)(weights, response));
    var weightedX = (0, _mathjs.transpose)((0, _mathjs.matrix)(predictors.map(function (x) {
      return (0, _mathjs.dotMultiply)(weights, x);
    })));
    var LHS = (0, _mathjs.multiply)(predictors, weightedX);
    var RHS = (0, _mathjs.multiply)(predictors, weightedY);
    var beta = (0, _mathjs.multiply)((0, _mathjs.inv)(LHS), RHS);
    var yhat = (0, _mathjs.squeeze)((0, _mathjs.multiply)(beta, predictors));
    var residual = (0, _mathjs.subtract)(response, yhat);
    return { beta: beta, yhat: yhat, residual: residual };
  } catch (err) {
    return { error: err };
  }
}