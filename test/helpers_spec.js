/* eslint-env mocha */
import {expect} from 'chai'
import math from 'mathjs'
import {
  weightFunc, normalize, transpose,
  euclideanDist, distMatrix,
  polynomialExpansion, weightedLeastSquare
} from '../src/helpers'

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

describe('function transpose', function () {
  const caseOne = {
    test: [
      [1, 2, 3, 4, 5],
      [6, 7, 8, 9, 10]
    ],
    expect: [
      [1, 6],
      [2, 7],
      [3, 8],
      [4, 9],
      [5, 10]
    ]
  }

  it('should return transposed matrix', function () {
    expect(transpose(caseOne.test)).to.eql(caseOne.expect)
  })
})

describe('function normalize', function () {
  const caseOne = {
    test: [109, 8, 7, 6, 5, 4, 3, 2, 1, -100],
    expect: [44.499, 3.266, 2.858, 2.449, 2.041, 1.633, 1.225, 0.816, 0.408, -40.825]
  }

  it('should return array divided by 10% trimmed sample deviation', function () {
    const normalizedArr = normalize(caseOne.test)(caseOne.test)
    expect(math.round(normalizedArr, 3)).to.eql(caseOne.expect)
  })
})

describe('function euclideanDist', function () {
  it('should return Euclidean distance between two vectors', function () {
    expect(math.round(euclideanDist([1, 2, 3], [4, 5, 6]), 3)).to.equal(5.196)
  })
})

describe('function distMatrix', function () {
  const caseOne = {
    coordinates: [
      [1, 1],
      [4, 1],
      [4, 5]
    ],
    expect: [
      [0, 3, 5],
      [3, 0, 4],
      [5, 4, 0]
    ]
  }
  it('should return matrix of Euclidean distance between pairs of points', function () {
    expect(distMatrix(caseOne.coordinates, caseOne.coordinates)).to.eql(caseOne.expect)
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
  it('should operates on arrays also', function () {
    expect(polynomialExpansion([[1, 2], [3, 4]], 2)).to.eql([[1, 1], [1, 2], [3, 4], [1, 4], [3, 8], [9, 16]])
  })
})

describe('function weightedLeastSquare', function () {
  const caseOne = {
    x: [
      [1, 1, 1, 1],
      [1, 3, 5, 7]
    ],
    y: [14, 17, 19, 20],
    w: [1, 1, 1, 1],
    expect: {
      beta: math.matrix([13.5, 1]),
      yhat: math.matrix([14.5, 16.5, 18.5, 20.5]),
      residue: math.matrix([-0.5, 0.5, 0.5, -0.5])
    }
  }

  const caseTwo = {
    x: [
      [1, 1, 1, 1],
      [1, 3, 5, 7]
    ],
    y: [14, 17, 19, 20],
    w: [1, 3, 3, 1],
    expect: {
      beta: math.matrix([13.75, 1]),
      yhat: math.matrix([14.75, 16.75, 18.75, 20.75]),
      residue: math.matrix([-0.75, 0.25, 0.25, -0.75])
    }
  }

  it('should return vector of fitted parameters (w/o weights)', function () {
    expect(weightedLeastSquare(caseOne.x, caseOne.y, caseOne.w)).to.eql(caseOne.expect)
  })

  it('should return vector of fitted parameters (with weights)', function () {
    expect(weightedLeastSquare(caseTwo.x, caseTwo.y, caseTwo.w)).to.eql(caseTwo.expect)
  })
})
