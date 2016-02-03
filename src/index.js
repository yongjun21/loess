import math from 'mathjs'
import {
  validateIsArray, validateIsNumber, sampleData,
  defaultOptions, weightFunc, normalize, transpose,
  polynomialExpansion, distMatrix, weightMatrix, weightedLeastSquare} from './helpers'

export default class Loess {
  constructor (response, predictor1, predictor2 = null, options = {}) {
    // validation

    validateIsArray(response, 'Invalid type: response should be an array')
    validateIsArray(predictor1, 'Invalid type: predictor 1 should be an array')

    response.forEach(y => validateIsNumber(y, 'Invalid type: response should be an array of numbers'))
    predictor1.forEach(x => validateIsNumber(x, 'Invalid type: predictor 1 should be an array of numbers'))

    this.n = response.length
    if (predictor1.length !== this.n) throw new Error('response and predictors have different length')

    if (typeof options !== 'object') throw new Error('options object not provided')
    options = Object.assign({}, defaultOptions, options) // set up default options

    if (typeof options.degree === 'string') {
      options.degree = ['constant', 'linear', 'quadratic'].indexOf(options.degree)
    }
    validateIsNumber(options.span, 'Invalid type: options.span should be a number')
    if (options.span <= 0) throw new Error('options.span should be greater than 0')

    validateIsNumber(options.degree, 'Invalid type: options.degree should be a number')
    if (options.degree - Math.floor(options.degree) > 0) throw new Error('Invalid type: options.degree should be an integer')
    if (options.degree < 0 || options.degree > 2) throw new Error('options.degree should be between 0 and 2')

    if (typeof options.normalize !== 'boolean') throw new Error('Invalid type: options.normalize should be a boolean')
    if (typeof options.robust !== 'boolean') throw new Error('Invalid type: options.robust should be a boolean')

    validateIsNumber(options.iteration, 'Invalid type: options.degree should be a number')
    if (options.iteration - Math.floor(options.iteration) > 0) throw new Error('Invalid type: options.iteration should be an integer')
    if (options.iteration < 1) throw new Error('options.iteration should be at least 1')
    if (!options.robust) options.iteration = 1

    this.Y = response
    this.X = [predictor1]
    this.dimension = 1
    this.options = options

    if (predictor2) {
      validateIsArray(predictor2, 'Invalid type: predictor 1 should be an array')
      predictor2.forEach(x => validateIsNumber(x, 'Invalid type: predictor 2 should be an array of numbers'))
      if (predictor2.length !== this.n) throw new Error('response and predictors have different length')

      this.X.push(predictor2)
      this.dimension = 2
      if (options.normalize) this.normalization = this.X.map(normalize)
    }

    this.expandedX = polynomialExpansion(this.X, options.degree)
    const normalized = this.normalization
      ? this.X.map((x, idx) => this.normalization[idx](x)) : this.X
    this.transposedX = transpose(normalized)
  }

  predict (newX = null) {
    // validation
    newX = newX || this.X
    validateIsArray(newX, 'Invalid type: should pass in an array of predictors')
    newX.forEach(x => {
      validateIsArray(x, 'Invalid type: predictors should be arrays')
      x.forEach(xn => validateIsNumber(xn, 'Invalid type: predictors should be arrays of numbers'))
    })
    if (newX.length !== this.dimension) throw new Error('Model is ' + this.dimension + ' dimensional. Data is' + newX.length + ' dimensional.')
    const n = newX[0].length
    newX.forEach(x => {
      if (x.length !== n) throw new Error('columns have different length')
    })

    const expandedX = polynomialExpansion(newX, this.options.degree)
    const normalized = this.normalization ? newX.map((x, idx) => this.normalization[idx](x)) : newX
    const weightM = weightMatrix(distMatrix(transpose(normalized), this.transposedX), this.options.span, newX.length)

    let newY
    function iterate (wt) {
      newY = transpose(expandedX).map((point, idx) => {
        const fit = weightedLeastSquare(this.expandedX, this.Y, math.dotMultiply(wt[idx], weightM[idx]))
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

const fit = new Loess(sampleData.NOx, sampleData.E)

console.log(fit.predict())
