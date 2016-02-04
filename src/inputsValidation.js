function validateIsArray (target, msg) {
  if (!Array.isArray(target)) throw new Error(msg)
}

function validateIsNumber (target, msg) {
  if (typeof target !== 'number') throw new Error(msg)
}

const defaultOptions = {
  span: 0.75,
  degree: 2,
  normalize: true,
  robust: false,
  iteration: 4
}

export function validateModel ({y, x1, x2 = null, options = {}}) {
  validateIsArray(y, 'Invalid type: y should be an array')
  validateIsArray(x1, 'Invalid type: x1 should be an array')

  y.forEach(v => validateIsNumber(v, 'Invalid type: y should include only numbers'))
  x1.forEach(v => validateIsNumber(v, 'Invalid type: x1 should include only numbers'))

  const x = [x1]
  const n = y.length
  let d = 1
  if (x1.length !== n) throw new Error('y and x1 have different length')

  if (typeof options !== 'object') throw new Error('Invalid type: options should be passed in as an object')
  options = Object.assign({}, defaultOptions, options) // set up default options

  if (typeof options.degree === 'string') {
    options.degree = ['constant', 'linear', 'quadratic'].indexOf(options.degree)
  }
  validateIsNumber(options.span, 'Invalid type: options.span should be a number')
  if (options.span <= 0) throw new Error('options.span should be greater than 0')

  validateIsNumber(options.degree, 'Invalid type: options.degree should be an integer')
  if (options.degree - Math.floor(options.degree) > 0) throw new Error('Invalid type: options.degree should be an integer')
  if (options.degree < 0 || options.degree > 2) throw new Error('options.degree should be between 0 and 2')

  if (typeof options.normalize !== 'boolean') throw new Error('Invalid type: options.normalize should be a boolean')
  if (typeof options.robust !== 'boolean') throw new Error('Invalid type: options.robust should be a boolean')

  validateIsNumber(options.iteration, 'Invalid type: options.degree should be an integer')
  if (options.iteration - Math.floor(options.iteration) > 0) throw new Error('Invalid type: options.iteration should be an integer')
  if (options.iteration < 1) throw new Error('options.iteration should be at least 1')
  if (!options.robust) options.iteration = 1

  if (x2) {
    validateIsArray(x2, 'Invalid type: x2 should be an array')
    x2.forEach(v => validateIsNumber(v, 'Invalid type: x2 should include only numbers'))
    if (x2.length !== n) throw new Error('y and x2 have different length')

    x.push(x2)
    d = 2
  }

  return {y: y, x: x, n: n, d: d, options: options}
}

export function validatePredict (newX) {
  if (newX.length < 1) newX = this.x

  newX.forEach(x => {
    validateIsArray(x, 'Invalid type: predictors should be arrays')
    x.forEach(v => validateIsNumber(v, 'Invalid type: predictors should should include only numbers'))
  })

  if (newX.length !== this.d) throw new Error('Model is ' + this.d + ' dimensional. Data is' + newX.length + ' dimensional.')

  const n = newX[0].length
  newX.forEach(x => {
    if (x.length !== n) throw new Error('predictors have different length')
  })

  return {newX: newX, n: n}
}
