import math from 'mathjs'
import {validateModel, validatePredict} from './inputsValidation'
import {
  sampleData, weightFunc, normalize, transpose,
  polynomialExpansion, distMatrix, weightMatrix, weightedLeastSquare} from './helpers'

export default class Loess {
  constructor (obj) {
    if (!obj) throw new Error('no argument passed in to constructor')
    Object.assign(this, validateModel(obj))

    if (this.options.normalize) this.normalization = this.x.map(normalize)

    this.expandedX = polynomialExpansion(this.x, this.options.degree)
    const normalized = this.normalization
      ? this.x.map((x, idx) => this.normalization[idx](x)) : this.x
    this.transposedX = transpose(normalized)
  }

  predict (...args) {
    const {newX, n} = validatePredict.bind(this)(args)

    const expandedX = polynomialExpansion(newX, this.options.degree)
    const normalized = this.normalization ? newX.map((x, idx) => this.normalization[idx](x)) : newX
    const weightM = weightMatrix(distMatrix(transpose(normalized), this.transposedX), this.options.span, newX.length)

    let newY
    function iterate (wt) {
      newY = transpose(expandedX).map((point, idx) => {
        const fit = weightedLeastSquare(this.expandedX, this.y, math.dotMultiply(wt[idx], weightM[idx]))
        const median = math.median(math.abs(fit.residue))
        wt[idx] = fit.residue.map(residue => weightFunc(residue, 6 * median, 2))
        return math.multiply(point, fit.beta)
      })
    }

    const robustWeights = Array(n).fill(Array(this.n).fill(1))
    for (let iter = 0; iter < this.options.iteration; iter++) iterate.bind(this)(robustWeights)
    return newY
  }
}

const fit = new Loess({y: sampleData.NOx, x1: sampleData.E})

console.log(fit.predict())
