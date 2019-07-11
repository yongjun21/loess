import math from 'mathjs'
import sort from 'lodash.sortby'
import gaussian from 'gaussian'
import {validateModel, validatePredict, validateGrid} from './inputsValidation'
import {weightFunc, normalize, transpose, distMatrix, weightMatrix,
  polynomialExpansion, weightedLeastSquare} from './helpers'
// import data from '../data/gas.json'

export default class Loess {
  constructor (data, options = {}) {
    Object.assign(this, validateModel(data, options))

    if (this.options.normalize) this.normalization = this.x.map(normalize)

    this.expandedX = polynomialExpansion(this.x, this.options.degree)
    const normalized = this.normalization
      ? this.x.map((x, idx) => this.normalization[idx](x)) : this.x
    this.transposedX = transpose(normalized)
  }

  predict (data) {
    const {x_new, n} = validatePredict.bind(this)(data)

    const expandedX = polynomialExpansion(x_new, this.options.degree)
    const normalized = this.normalization ? x_new.map((x, idx) => this.normalization[idx](x)) : x_new
    const distM = distMatrix(transpose(normalized), this.transposedX)
    const weightM = weightMatrix(distM, this.w, this.bandwidth)

    let fitted, residuals, weights, betas
    function iterate (wt) {
      fitted = []
      residuals = []
      betas = []
      weights = math.dotMultiply(wt, weightM)
      transpose(expandedX).forEach((point, idx) => {
        const fit = weightedLeastSquare(this.expandedX, this.y, weights[idx])
        if (fit.error) {
          const sumWeights = math.sum(weights[idx])
          const mle = sumWeights === 0 ? 0 : math.multiply(this.y, weights[idx]) / sumWeights
          fit.beta = math.zeros(this.expandedX.length).set([0], mle)
          fit.residual = math.subtract(this.y, mle)
        }
        fitted.push(math.squeeze(math.multiply(point, fit.beta)))
        residuals.push(fit.residual)
        betas.push(fit.beta.toArray())
        const median = math.median(math.abs(fit.residual))
        wt[idx] = fit.residual.map(r => weightFunc(r, 6 * median, 2))
      })
    }

    const robustWeights = Array(n).fill(math.ones(this.n))
    for (let iter = 0; iter < this.options.iterations; iter++) iterate.bind(this)(robustWeights)

    const output = {fitted, betas, weights}

    if (this.options.band) {
      const z = gaussian(0, 1).ppf(1 - (1 - this.options.band) / 2)
      const halfwidth = weights.map((weight, idx) => {
        const V1 = math.sum(weight)
        const V2 = math.multiply(weight, weight)
        const intervalEstimate = Math.sqrt(math.multiply(math.square(residuals[idx]), weight) / (V1 - V2 / V1))
        return intervalEstimate * z
      })
      Object.assign(output, {halfwidth})
    }

    return output
  }

  grid (cuts) {
    validateGrid.bind(this)(cuts)

    const x_new = []
    const x_cuts = []
    this.x.forEach((x, idx) => {
      const x_sorted = sort(x)
      const x_min = x_sorted[0]
      const x_max = x_sorted[this.n - 1]
      const width = (x_max - x_min) / (cuts[idx] - 1)
      x_cuts.push([])
      for (let i = 0; i < cuts[idx]; i++) x_cuts[idx].push(x_min + i * width)

      let repeats = 1
      let copies = 1
      for (let i = idx - 1; i >= 0; i--) repeats *= cuts[i]
      for (let i = idx + 1; i < this.d; i++) copies *= cuts[i]

      x_new.push([])
      for (let i = 0; i < repeats; i++) {
        x_new[idx] = x_new[idx].concat(x_cuts[idx].reduce((acc, cut) => acc.concat(Array(copies).fill(cut)), []))
      }
    })

    const data = {x: x_new[0], x_cut: x_cuts[0]}
    if (this.d > 1) Object.assign(data, {x2: x_new[1], x_cut2: x_cuts[1]})
    return data
  }
}

// const w = data.NOx.map(() => Math.random() * 10)
// const fit = new Loess({y: data.NOx, x: data.E, w}, {span: 0.8, band: 0.8, degree: 'quadratic'})
// console.log(JSON.stringify(fit.predict(fit.grid([30]))))
