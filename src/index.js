import math from 'mathjs'
import gaussian from 'gaussian'
import {validateModel, validatePredict} from './inputsValidation'
import {sampleData, weightFunc, normalize, transpose, distMatrix, weightMatrix,
  polynomialExpansion, weightedLeastSquare} from './helpers'

export default class LOESS {
  constructor (obj) {
    Object.assign(this, validateModel(obj))

    if (this.options.normalize) this.normalization = this.x.map(normalize)

    this.expandedX = polynomialExpansion(this.x, this.options.degree)
    const normalized = this.normalization
      ? this.x.map((x, idx) => this.normalization[idx](x)) : this.x
    this.transposedX = transpose(normalized)
  }

  predict (obj) {
    const {x_new, n, band} = validatePredict.bind(this)(obj)

    const expandedX = polynomialExpansion(x_new, this.options.degree)
    const normalized = this.normalization ? x_new.map((x, idx) => this.normalization[idx](x)) : x_new
    const inflate = this.options.span > 1 ? 1 : Math.pow(this.options.span, 1 / this.d)
    const weightM = weightMatrix(distMatrix(transpose(normalized), this.transposedX), this.bandwidth, inflate)
    const z = band ? gaussian(0, 1).ppf(1 - (1 - band) / 2) : 0

    let y_hat, halfwidth
    function iterate (wt) {
      y_hat = []
      halfwidth = []
      transpose(expandedX).forEach((point, idx) => {
        wt[idx] = math.dotMultiply(wt[idx], weightM[idx])
        const fit = weightedLeastSquare(this.expandedX, this.y, wt[idx])
        y_hat.push(math.multiply(point, fit.beta))
        if (band) {
          const V1 = math.sum(wt[idx])
          const V2 = math.multiply(wt[idx], wt[idx])
          const intervalEstimate = Math.sqrt(math.multiply(math.square(fit.residue), wt[idx]) / (V1 - V2 / V1))
          halfwidth.push(intervalEstimate * z)
        }
        const median = math.median(math.abs(fit.residue))
        wt[idx] = fit.residue.map(residue => weightFunc(residue, 6 * median, 2))
      })
    }

    const robustWeights = Array(n).fill(math.ones(this.n))
    for (let iter = 0; iter < this.options.iteration; iter++) iterate.bind(this)(robustWeights)

    const output = {yhat: y_hat}
    if (band) Object.assign(output, {halfwidth: halfwidth})
    return output
  }
}

const fit = new LOESS({y: sampleData.NOx, x1: sampleData.E})

console.log(fit.predict({band: 0.9}))
