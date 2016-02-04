import math from 'mathjs'
import {validateModel, validatePredict} from './inputsValidation'
import {
  sampleData, weightFunc, normalize, transpose,
  polynomialExpansion, distMatrix, weightMatrix, weightedLeastSquare} from './helpers'

export default class Loess {
  constructor (obj) {
    Object.assign(this, validateModel(obj))

    if (this.options.normalize) this.normalization = this.x.map(normalize)

    this.expandedX = polynomialExpansion(this.x, this.options.degree)
    const normalized = this.normalization
      ? this.x.map((x, idx) => this.normalization[idx](x)) : this.x
    this.transposedX = transpose(normalized)
  }

  predict (obj) {
    const {x_new, n, se} = validatePredict.bind(this)(obj)

    const expandedX = polynomialExpansion(x_new, this.options.degree)
    const normalized = this.normalization ? x_new.map((x, idx) => this.normalization[idx](x)) : x_new
    const inflate = this.options.span > 1 ? 1 : Math.pow(this.options.span, 1 / this.d)
    const weightM = weightMatrix(distMatrix(transpose(normalized), this.transposedX), this.bandwidth, inflate)

    let y_hat, error
    function iterate (wt) {
      y_hat = []
      error = []
      transpose(expandedX).forEach((point, idx) => {
        wt[idx] = math.dotMultiply(wt[idx], weightM[idx])
        const fit = weightedLeastSquare(this.expandedX, this.y, wt[idx])
        y_hat.push(math.multiply(point, fit.beta))
        if (se) {
          const V1 = math.sum(wt[idx])
          const V2 = math.multiply(wt[idx], wt[idx])
          const errorEstimate = Math.sqrt(math.multiply(math.square(fit.residue), wt[idx]) / (V1 - V2 / V1))
          error.push(errorEstimate)
        }
        const median = math.median(math.abs(fit.residue))
        wt[idx] = fit.residue.map(residue => weightFunc(residue, 6 * median, 2))
      })
    }

    const robustWeights = Array(n).fill(math.ones(this.n))
    for (let iter = 0; iter < this.options.iteration; iter++) iterate.bind(this)(robustWeights)
    return {
      yhat: y_hat,
      error: error
    }
  }
}

const fit = new Loess({y: sampleData.NOx, x1: sampleData.E})

console.log(fit.predict({se: true}))
