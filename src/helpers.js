import math from 'mathjs'

// d, dmax: Number >= 0
// degree: Integer > 0
// return weight: Number >= 0
export function weightFunc (d, dmax, degree) {
  return d < dmax ? Math.pow(1 - Math.pow(d / dmax, degree), degree) : 0
}

// train: Array of Number
// return normalization function
export function normalize (referenceArr) {
  const cutoff = Math.ceil(0.1 * referenceArr.length)
  const trimmed_arr = referenceArr.sort((a, b) => a - b).slice(cutoff, referenceArr.length - cutoff)
  const sd = math.std(trimmed_arr)
  return function (outputArr) {
    return outputArr.map(val => val / sd)
  }
}

export function transpose (X) {
  const transposed = []
  for (let i = 0; i < X[0].length; i++) {
    transposed.push(X.map(x => x[i]))
  }
  return transposed
}

// orig, dest: Array of Number, orig.lenght = dest.length
// return distance: Number >= 0
export function euclideanDist (orig, dest) {
  return Math.sqrt(orig.reduce((acc, val, idx) => acc + Math.pow(val - dest[idx], 2), 0))
}

// origSet, destSet: Array of vectors, All members equal length
// return Matrix of Euclidean distance between each pair of points within origSet and destSet
export function distMatrix (origSet, destSet) {
  return origSet.map(orig => destSet.map(dest => euclideanDist(orig, dest)))
}

// distM: a distance matrix
// span: Number > 0
// n: Integer > 0
export function weightMatrix (distMat, span, dimension) {
  const cutoff = span <= 1 ? Math.floor(span * distMat[0].length) : distMat[0].length
  distMat.map(distVect => {
    let dmax = distVect.sort((a, b) => a - b)[cutoff - 1]
    if (span > 1) dmax = dmax * Math.pow(span, 1 / dimension)
    return distVect.map(d => weightFunc(d, dmax, 3))
  })
}

// factors: Array of (Array of Number)
// degree: Integer >= 0
// return polynomial expansion of factor set eg. (a + b)^2 >>> (1 + a + b + a2 + ab + b2)
export function polynomialExpansion (factors, degree) {
  const expandedSet = []
  let constTerm = 1
  if (Array.isArray(factors[0])) constTerm = Array(factors[0].length).fill(1)
  function crossMultiply (accumulator, pointer, n) {
    if (n > 1) {
      for (let i = pointer; i < factors.length; i++) {
        crossMultiply(math.dotMultiply(accumulator, factors[i]), i, n - 1)
      }
    } else {
      expandedSet.push(accumulator)
    }
  }
  for (let d = 0; d <= degree; d++) crossMultiply(constTerm, 0, d + 1)
  return expandedSet
}

export function weightedLeastSquare (predictors, response, weights) {
  const weightedY = math.matrix(math.dotMultiply(weights, response))
  const weightedX = math.transpose(math.matrix(predictors.map(x => {
    return math.dotMultiply(weights, x)
  })))
  const LHS = math.multiply(predictors, weightedX)
  const RHS = math.multiply(predictors, weightedY)
  const beta = math.multiply(math.inv(LHS), RHS)
  const yhat = math.multiply(beta, predictors)
  const residue = math.subtract(response, yhat)
  return {
    beta: beta,
    yhat: yhat,
    residue: residue
  }
}

export function validateIsArray (target, msg) {
  if (!Array.isArray(target)) throw new Error(msg)
}

export function validateIsNumber (target, msg) {
  if (typeof target !== 'number') throw new Error(msg)
}

export const defaultOptions = {
  span: 0.75,
  degree: 2,
  normalize: true,
  robust: false,
  iteration: 3
}

export const sampleData = {
  NOx: [
    4.818, 2.849, 3.275, 4.691, 4.255,
    5.064, 2.118, 4.602, 2.286, 0.97,
    3.965, 5.344, 3.834, 1.99, 5.199,
    5.283, 3.752, 0.537, 1.64, 5.055,
    4.937, 1.561
  ],
  E: [
    0.831, 1.045, 1.021, 0.97, 0.825,
    0.891, 0.71, 0.801, 1.074, 1.148,
    1, 0.928, 0.767, 0.701, 0.807,
    0.902, 0.997, 1.224, 1.089, 0.973,
    0.98, 0.665
  ]
}
