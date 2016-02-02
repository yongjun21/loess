/* eslint-env mocha */

import {expect} from 'chai'
import {weightFunc, normalize, euclideanDist, polynomialExpansion} from '../src/supporting'

function round3dp (v) {
  return Math.round(v * 1000) / 1000
}

describe('function weightFunc', function () {
  it('should return (1-(d/dmax)^n)^n if d < dmax', function () {
    expect(weightFunc(0.5, 1, 3)).to.equal(0.669921875)
    expect(weightFunc(0.5, 1, 2)).to.equal(0.5625)
  })
  it('should return 0 if d >= dmax', function () {
    expect(weightFunc(1, 1, 3)).to.equal(0)
    expect(weightFunc(1, 1, 2)).to.equal(0)
  })
})

describe('function normalize', function () {
  const testCase = {
    test: [-100, 1, 2, 3, 4, 5, 6, 7, 8, 109],
    expect: [-40.825, 0.408, 0.816, 1.225, 1.633, 2.041, 2.449, 2.858, 3.266, 44.499]
  }

  it('should return array divided by 10% trimmed sample deviation', function () {
    expect(normalize(testCase.test).map(round3dp)).to.eql(testCase.expect)
  })
})

describe('function euclideanDist', function () {
  it('should return Euclidean distance between two vectors', function () {
    expect(round3dp(euclideanDist([1, 2, 3], [4, 5, 6]))).to.equal(5.196)
  })
})

describe('function polynomialExpansion', function () {
  it('(a + b + c)^0 >>> (1)', function () {
    expect(polynomialExpansion([1, 2, 3], 0)).to.eql([1])
  })
  it('(a + b + c)^1 >>> (1 + a + b + c)', function () {
    expect(polynomialExpansion([1, 2, 3], 1)).to.eql([1, 1, 2, 3])
  })
  it('(a + b + c)^2 >>> (1 + a + b + c + a2 + ab + ac + b2 + bc + c2)', function () {
    expect(polynomialExpansion([1, 2, 3], 2)).to.eql([1, 1, 2, 3, 1, 2, 3, 4, 6, 9])
  })
})
