function validateIsArray (target, msg) {
  if (!Array.isArray(target)) throw new Error(msg)
}

function validateIsNumber (target, msg) {
  if (typeof target !== 'number') throw new Error(msg)
}

function validateIsInteger (target, msg) {
  if (target - Math.floor(target) > 0) throw new Error(msg)
}

export function validateModel (data, options) {
  if (!data) throw new Error('no data passed in to constructor')
  let {y, x, x2 = null} = data

  validateIsArray(y, 'Invalid type: y should be an array')
  validateIsArray(x, 'Invalid type: x should be an array')

  y.forEach(v => validateIsNumber(v, 'Invalid type: y should include only numbers'))
  x.forEach(v => validateIsNumber(v, 'Invalid type: x should include only numbers'))

  const n = y.length
  if (x.length !== n) throw new Error('y and x have different length')
  x = [x]

  if (!options || typeof options !== 'object') throw new Error('Invalid type: options should be passed in as an object')
  options = Object.assign({
    span: 0.75,
    band: 0,
    degree: 2,
    normalize: true,
    robust: false,
    iterations: 4
  }, options)

  if (typeof options.degree === 'string') {
    options.degree = ['constant', 'linear', 'quadratic'].indexOf(options.degree)
  }
  validateIsNumber(options.span, 'Invalid type: options.span should be a number')
  if (options.span <= 0) throw new Error('options.span should be greater than 0')

  validateIsNumber(options.band, 'Invalid type: options.band should be a number')
  if (options.band < 0 || options.band >= 0.99) throw new Error('options.band should be between 0 and 1')

  validateIsNumber(options.degree, 'Invalid type: options.degree should be an integer')
  validateIsInteger(options.degree, 'Invalid type: options.degree should be an integer')
  if (options.degree < 0 || options.degree > 2) throw new Error('options.degree should be between 0 and 2')

  if (typeof options.normalize !== 'boolean') throw new Error('Invalid type: options.normalize should be a boolean')
  if (typeof options.robust !== 'boolean') throw new Error('Invalid type: options.robust should be a boolean')

  validateIsNumber(options.iterations, 'Invalid type: options.iterations should be an integer')
  validateIsInteger(options.iterations, 'Invalid type: options.iterations should be an integer')
  if (options.iterations < 1) throw new Error('options.iterations should be at least 1')
  if (!options.robust) options.iterations = 1

  if (x2) {
    validateIsArray(x2, 'Invalid type: x2 should be an array')
    x2.forEach(v => validateIsNumber(v, 'Invalid type: x2 should include only numbers'))
    if (x2.length !== n) throw new Error('y and x2 have different length')
    x.push(x2)
  }

  return {
    y, x, n, options,
    d: x2 ? 2 : 1,
    bandwidth: options.span <= 1 ? Math.floor(options.span * n) : n
  }
}

export function validatePredict (data) {
  // options = Object.assign({
  //   grid: this.d === 1 ? [50] : [25, 25],
  // }, options)

  if (!data) data = {x: this.x[0], x2: this.x[1]}
  if (typeof data !== 'object') throw new Error('Invalid type: data should be supplied as an object')

  let {x, x2 = null} = data

  validateIsArray(x, 'Invalid type: x should be an array')
  x.forEach(v => validateIsNumber(v, 'Invalid type: x1 should include only numbers'))

  const x_new = [x]
  const n = x.length

  if (this.d > 1) {
    validateIsArray(x2, 'Invalid type: x2 should be an array')
    x2.forEach(v => validateIsNumber(v, 'Invalid type: x2 should include only numbers'))
    if (x2.length !== n) throw new Error('x and x2 have different length')
    x_new.push(x2)
  } else {
    if (x2) throw new Error('extra variable x2')
  }
  return {x_new, n}
}

export function validateGrid (cuts) {
  validateIsArray(cuts, 'Invalid type: cuts should be an array')
  cuts.forEach(cut => {
    validateIsNumber(cut, 'Invalid type: cuts should include only integers')
    validateIsInteger(cut, 'Invalid type: cuts should include only integers')
    if (cuts < 1) throw new Error('cuts should include only integers > 2')
  })
  if (cuts.length !== this.d) throw new Error('cuts.length should match dimension of predictors')
}
