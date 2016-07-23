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
    const _span = this.options.span > 1 ? Math.pow(this.options.span, 1 / this.d) : this.options.span
    const distM = distMatrix(transpose(normalized), this.transposedX)
    const weightM = weightMatrix(distM, this.w, _span, this.options.kernelWidth)
    const z = this.options.band ? gaussian(0, 1).ppf(1 - (1 - this.options.band) / 2) : 0

    let fitted, halfwidth
    function iterate (wt) {
      fitted = []
      halfwidth = []
      transpose(expandedX).forEach((point, idx) => {
        wt[idx] = math.dotMultiply(wt[idx], weightM[idx])
        const fit = weightedLeastSquare(this.expandedX, this.y, wt[idx])
        fitted.push(math.squeeze(math.multiply(point, fit.beta)))
        if (this.options.band) {
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
    for (let iter = 0; iter < this.options.iterations; iter++) iterate.bind(this)(robustWeights)

    const output = {fitted}
    if (this.options.band) Object.assign(output, {halfwidth})
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
// const fit = new Loess({y: data.NOx, x: data.E, w}, {span: 0.8, band: 0.8, degree: 'constant'})
// console.log(fit.predict(fit.grid([30])))
