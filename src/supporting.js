import math from 'mathjs'

// d, dmax: Number >= 0
// degree: Integer > 0
// return weight: Number >= 0
export function weightFunc (d, dmax, degree) {
  return d < dmax ? Math.pow(1 - Math.pow(d / dmax, degree), degree) : 0
}

// arr: Array of Number
// return transformed Array
export function normalize (arr) {
  const cutoff = Math.ceiling(0.1 * arr.length)
  const trimmed_arr = arr.sort((a, b) => a - b).slice(cutoff, arr.length - cutoff)
  const sd = math.std(trimmed_arr)
  return arr.map(val => val / sd)
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

// factors: Array of Number
// degree: Integer >= 0
// return polynomial expansion of factor set eg. (a + b)^2 >>> (1 + a + b + a2 + ab + b2)
export function polynomialExpansion (factors, degree) {
  const expandedSet = []
  function crossMultiply (accumulator, pointer, n) {
    if (n > 1) {
      for (let i = pointer; i < factors.length; i++) {
        crossMultiply(accumulator * factors[i], i, n - 1)
      }
    } else {
      expandedSet.push(accumulator)
    }
  }
  for (let d = 0; d <= degree; d++) crossMultiply(1, 0, d + 1)
  return expandedSet
}

// distM: a distance matrix
// span: % of data points
export function weightMatrix (distMat, span) {
  const cutoff = span <= 1 ? Math.floor(span * distMat[0].length) : distMat[0].length
  distMat.map(distVect => {
    let dmax = distVect.sort((a, b) => a - b)[cutoff - 1]
    if (span > 1) dmax = dmax * span
    return distVect.map(d => weightFunc(d, dmax, 3))
  })
}
