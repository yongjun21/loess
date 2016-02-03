import math from 'mathjs'
import sort from 'lodash.sortby'

export function weightFunc (d, dmax, degree) {
  return d < dmax ? Math.pow(1 - Math.pow(d / dmax, degree), degree) : 0
}

export function normalize (referenceArr) {
  const cutoff = Math.ceil(0.1 * referenceArr.length)
  const trimmed_arr = sort(referenceArr).slice(cutoff, referenceArr.length - cutoff)
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

export function euclideanDist (orig, dest) {
  return Math.sqrt(orig.reduce((acc, val, idx) => acc + Math.pow(val - dest[idx], 2), 0))
}

export function distMatrix (origSet, destSet) {
  return origSet.map(orig => destSet.map(dest => euclideanDist(orig, dest)))
}

export function weightMatrix (distMat, span, dimension) {
  const cutoff = span <= 1 ? Math.floor(span * distMat[0].length) : distMat[0].length
  return distMat.map(distVect => {
    let dmax = sort(distVect)[cutoff - 1]
    if (span > 1) dmax = dmax * Math.pow(span, 1 / dimension)
    return distVect.map(d => weightFunc(d, dmax, 3))
  })
}

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
  iteration: 4
}

export const sampleData = {
  NOx: [
    1.561, 1.990, 2.118, 3.834, 4.602,
    5.199, 4.255, 4.818, 5.064, 5.283,
    5.344, 4.691, 5.055, 4.937, 3.752,
    3.965, 3.275, 2.849, 2.286, 1.640,
    0.970, 0.537
  ],
  E: [
    0.665, 0.701, 0.710, 0.767, 0.801,
    0.807, 0.825, 0.831, 0.891, 0.902,
    0.928, 0.970, 0.973, 0.980, 0.997,
    1.000, 1.021, 1.045, 1.074, 1.089,
    1.148, 1.224
  ]
}
