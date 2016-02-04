function validateIsArray (target, msg) {
  if (!Array.isArray(target)) throw new Error(msg)
}

function validateIsNumber (target, msg) {
  if (typeof target !== 'number') throw new Error(msg)
}

export function validateModel (obj) {
  if (!obj) throw new Error('no argument passed in to constructor')
  let {y, x1, x2 = null, options = {}} = obj

  validateIsArray(y, 'Invalid type: y should be an array')
  validateIsArray(x1, 'Invalid type: x1 should be an array')

  y.forEach(v => validateIsNumber(v, 'Invalid type: y should include only numbers'))
  x1.forEach(v => validateIsNumber(v, 'Invalid type: x1 should include only numbers'))

  const x = [x1]
  const n = y.length
  if (x1.length !== n) throw new Error('y and x1 have different length')

  if (!options || typeof options !== 'object') throw new Error('Invalid type: options should be passed in as an object')
  options = Object.assign({
    span: 0.75,
    degree: 2,
    confInterval: 0.9,
    normalize: true,
    robust: false,
    iteration: 4
  }, options)

  if (typeof options.degree === 'string') {
    options.degree = ['constant', 'linear', 'quadratic'].indexOf(options.degree)
  }
  validateIsNumber(options.span, 'Invalid type: options.span should be a number')
  if (options.span <= 0) throw new Error('options.span should be greater than 0')

  validateIsNumber(options.degree, 'Invalid type: options.degree should be an integer')
  if (options.degree - Math.floor(options.degree) > 0) throw new Error('Invalid type: options.degree should be an integer')
  if (options.degree < 0 || options.degree > 2) throw new Error('options.degree should be between 0 and 2')

  validateIsNumber(options.confInterval, 'Invalid type: options.confInterval should be a number')
  if (options.confInterval <= 0 || options.confInterval >= 0.99) throw new Error('options.confInterval should be between 0 and 1')

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
  }

  return {
    y: y, x: x, n: n,
    d: x2 ? 2 : 1,
    bandwidth: options.span <= 1 ? Math.floor(options.span * n) : n,
    options: options
  }
}

export function validatePredict (obj) {
  obj = obj || {}
  obj = Object.assign({
    data: 'original',
    grid: this.d === 1 ? [50] : [25, 25],
    se: false
  }, obj)

  if (obj.data === 'original') {
    obj.data = {
      x1: this.x[0],
      x2: this.x[1]
    }
  } else if (!obj.data || typeof obj.data !== 'object') {
    throw new Error('Invalid type: data should be supplied as an object')
  }

  let {data: {x1, x2 = null}, se} = obj

  validateIsArray(x1, 'Invalid type: x1 should be an array')
  x1.forEach(v => validateIsNumber(v, 'Invalid type: x1 should include only numbers'))

  const x_new = [x1]
  const n = x1.length

  if (this.d > 1) {
    validateIsArray(x2, 'Invalid type: x1 should be an array')
    x2.forEach(v => validateIsNumber(v, 'Invalid type: x1 should include only numbers'))
    if (x2.length !== n) throw new Error('x1 and x2 have different length')
    x_new.push(x2)
  } else {
    if (x2) throw new Error('extra variable x2')
  }

  if (typeof se !== 'boolean') throw new Error('Invalid type: options.se should be a boolean')

  return {x_new: x_new, n: n, se: se}
}
