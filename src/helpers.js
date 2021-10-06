import math from 'mathjs'
import sort from 'lodash.sortby'
import zip from 'lodash.zip'

export function weightFunc (d, dmax, degree) {
  return d < dmax ? Math.pow(1 - Math.pow(d / dmax, degree), degree) : 0
}

export function normalize (referenceArr) {
  const cutoff = Math.ceil(0.1 * referenceArr.length)
  const trimmed_arr = sort(referenceArr).slice(cutoff, referenceArr.length - cutoff)
  const sd = trimmed_arr.length > 3 ? math.std(trimmed_arr) : 1
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
  if (orig.length < 2) {
    return Math.abs(orig[0] - dest[0])
  } else {
    return Math.sqrt(orig.reduce((acc, val, idx) => acc + Math.pow(val - dest[idx], 2), 0))
  }
}

export function distMatrix (origSet, destSet) {
  return origSet.map(orig => destSet.map(dest => euclideanDist(orig, dest)))
}

export function weightMatrix (distMat, inputWeights, bandwidth) {
  return distMat.map(distVect => {
    const sorted = sort(zip(distVect, inputWeights), (v) => v[0])
    const cutoff = math.sum(inputWeights) * bandwidth
    let sumOfWeights = 0
    let cutoffIndex = sorted.findIndex(v => {
      sumOfWeights += v[1]
      return sumOfWeights >= cutoff
    })
    let dmax = bandwidth > 1
      ? (sorted[sorted.length - 1][0] * bandwidth)
      : sorted[cutoffIndex][0]
    return math.dotMultiply(distVect.map(d => weightFunc(d, dmax, 3)), inputWeights)
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
  try {
    const weightedY = math.matrix(math.dotMultiply(weights, response))
    const weightedX = math.transpose(math.matrix(predictors.map(x => {
      return math.dotMultiply(weights, x)
    })))
    const LHS = math.multiply(predictors, weightedX)
    const RHS = math.multiply(predictors, weightedY)
    const beta = math.multiply(math.inv(LHS), RHS)
    const yhat = math.squeeze(math.multiply(beta, predictors))
    const residual = math.subtract(response, yhat)
    return {beta, yhat, residual}
  } catch (err) {
    return {error: err}
  }
}
