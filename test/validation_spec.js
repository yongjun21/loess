/* eslint-env mocha */
import {expect} from 'chai'
import {validateModel, validatePredict, validateGrid} from '../src/inputsValidation'

describe('validation for model constructor', function () {
  it('throw error if data obj not provided', function () {
    expect(validateModel).to.throw('no data passed in to constructor')
    expect(validateModel.bind(null, true)).to.throw('no data passed in to constructor')
  })

  it('throw error if y, x or x2 is not array', function () {
    expect(validateModel.bind(null, {y: null}, {})).to.throw('Invalid type: y should be an array')
    expect(validateModel.bind(null, {y: [], x: null})).to.throw('Invalid type: x should be an array')
    expect(validateModel.bind(null, {y: [], x: [], x2: true})).to.throw('Invalid type: x2 should be an array')
  })

  it('throw error if y, x or x2 contains non-number', function () {
    expect(validateModel.bind(null, {y: ['dummy'], x: ['dummy']})).to.throw('Invalid type: y should include only numbers')
    expect(validateModel.bind(null, {y: [1], x: ['dummy']})).to.throw('Invalid type: x should include only numbers')
    expect(validateModel.bind(null, {y: [1], x: [1], x2: ['dummy']})).to.throw('Invalid type: x2 should include only numbers')
  })

  it('throw error if y, x and x2 have different lengths', function () {
    expect(validateModel.bind(null, {y: [1], x: [1, 2]})).to.throw('y and x have different length')
    expect(validateModel.bind(null, {y: [1], x: [1], x2: [1, 2]})).to.throw('y and x2 have different length')
  })

  it('throw error if options not passed in as an object', function () {
    expect(validateModel.bind(null, {y: [1], x: [1]}, true)).to.throw('Invalid type: options should be passed in as an object')
  })

  it('if options not provided, should be populated with defaults', function () {
    const result = validateModel({y: [1], x: [1]}, {})
    expect(result.options).to.have.property('span', 0.75)
    expect(result.options).to.have.property('band', 0)
    expect(result.options).to.have.property('degree', 2)
    expect(result.options).to.have.property('normalize', true)
    expect(result.options).to.have.property('robust', false)
  })

  it('options.degree translated from str to int', function () {
    expect(validateModel({y: [1], x: [1]}, {degree: 'constant'}).options.degree).to.equal(0)
    expect(validateModel({y: [1], x: [1]}, {degree: 'linear'}).options.degree).to.equal(1)
    expect(validateModel({y: [1], x: [1]}, {degree: 'quadratic'}).options.degree).to.equal(2)
    expect(validateModel.bind(null, {y: [1], x: [1]}, {degree: 'dummy'})).to.throw('options.degree should be between 0 and 2')
  })

  it('throw error if options.span is not a number > 0', function () {
    expect(validateModel.bind(null, {y: [1], x: [1]}, {span: null})).to.throw('Invalid type: options.span should be a number')
    expect(validateModel.bind(null, {y: [1], x: [1]}, {span: 0})).to.throw('options.span should be greater than 0')
  })

  it('throw error if options.band is not a number betweem 0 and 1', function () {
    expect(validateModel.bind(null, {y: [1], x: [1]}, {band: null})).to.throw('Invalid type: options.band should be a number')
    expect(validateModel.bind(null, {y: [1], x: [1]}, {band: -0.001})).to.throw('options.band should be between 0 and 1')
    expect(validateModel.bind(null, {y: [1], x: [1]}, {band: 1})).to.throw('options.band should be between 0 and 1')
  })

  it('throw error if options.degree is not an integer between 0 and 2', function () {
    expect(validateModel.bind(null, {y: [1], x: [1]}, {degree: null})).to.throw('Invalid type: options.degree should be an integer')
    expect(validateModel.bind(null, {y: [1], x: [1]}, {degree: 1.5})).to.throw('Invalid type: options.degree should be an integer')
    expect(validateModel.bind(null, {y: [1], x: [1]}, {degree: -1})).to.throw('options.degree should be between 0 and 2')
    expect(validateModel.bind(null, {y: [1], x: [1]}, {degree: 3})).to.throw('options.degree should be between 0 and 2')
  })

  it('throw error if options.normalize or options.robust is not boolean', function () {
    expect(validateModel.bind(null, {y: [1], x: [1]}, {normalize: null})).to.throw('Invalid type: options.normalize should be a boolean')
    expect(validateModel.bind(null, {y: [1], x: [1]}, {robust: null})).to.throw('Invalid type: options.robust should be a boolean')
  })

  it('throw error if options.interation is not an integer > 0', function () {
    expect(validateModel.bind(null, {y: [1], x: [1]}, {robust: true, iterations: null})).to.throw('Invalid type: options.iterations should be an integer')
    expect(validateModel.bind(null, {y: [1], x: [1]}, {robust: true, iterations: 1.5})).to.throw('Invalid type: options.iterations should be an integer')
    expect(validateModel.bind(null, {y: [1], x: [1]}, {robust: true, iterations: 0})).to.throw('options.iterations should be at least 1')
  })

  it('options.iterations defaults to 4 if options.robust = true and 1 otherwise', function () {
    expect(validateModel({y: [1], x: [1]}, {robust: true}).options.iterations).to.equal(4)
    expect(validateModel({y: [1], x: [1]}, {robust: false, iterations: 10}).options.iterations).to.equal(1)
  })

  it('return dimension of data correctly', function () {
    expect(validateModel({y: [1], x: [1]}, {}).d).to.equal(1)
    expect(validateModel({y: [1], x: [1], x2: [1]}, {}).d).to.equal(2)
  })

  it('return correct bandwidth given span', function () {
    const data = {
      y: [1, 2, 3, 4, 5],
      x: [1, 2, 3, 4, 5]
    }
    expect(validateModel(data, {span: 0.6}).bandwidth).to.equal(3)
    expect(validateModel(data, {span: 2}).bandwidth).to.equal(5)
  })
})

describe('validation for .predict() method', function () {
  it('returns this.x as new data if no arg supplied', function () {
    const input = {
      x: [
        [1, 2, 3, 4, 5],
        [6, 7, 8, 9, 10]
      ],
      d: 2
    }
    const output = {
      x_new: [
        [1, 2, 3, 4, 5],
        [6, 7, 8, 9, 10]
      ],
      n: 5
    }
    expect(validatePredict.bind(input)()).to.eql(output)
  })

  it('throw error if data obj not provided', function () {
    expect(validatePredict.bind(null, true)).to.throw('Invalid type: data should be supplied as an object')
  })

  it('throw error if x or x2 is not array', function () {
    expect(validatePredict.bind({d: 1}, {x: null})).to.throw('Invalid type: x should be an array')
    expect(validatePredict.bind({d: 2}, {x: [], x2: true})).to.throw('Invalid type: x2 should be an array')
  })

  it('throw error if x or x2 contains non-number', function () {
    expect(validatePredict.bind({d: 1}, {x: ['dummy']})).to.throw('Invalid type: x should include only numbers')
    expect(validatePredict.bind({d: 2}, {x: [1], x2: ['dummy']})).to.throw('Invalid type: x2 should include only numbers')
  })

  it('throw error if x and x2 have different lengths', function () {
    expect(validatePredict.bind({d: 2}, {x: [1], x2: [1, 2]})).to.throw('x and x2 have different length')
  })

  it('throw error if extra variable provided', function () {
    expect(validatePredict.bind({d: 1}, {x: [1, 2], x2: [1, 2]})).to.throw('extra variable x2')
  })
})

describe('validation for .grid() method', function () {
  it('throw error if cuts arg is not provided', function () {
    expect(validateGrid).to.throw('Invalid type: cuts should be an array')
  })

  it('throw error if cuts does not contain only integers > 2', function () {
    expect(validateGrid.bind(null, [true])).to.throw('Invalid type: cuts should include only integers')
    expect(validateGrid.bind(null, [1.1])).to.throw('Invalid type: cuts should include only integers')
    expect(validateGrid.bind(null, [2])).to.throw('cuts should include only integers > 2')
  })

  it('throw error if cuts not matching dimension of model', function () {
    expect(validateGrid.bind({d: 2}, [5, 5, 5])).to.throw('cuts.length should match dimension of predictors')
  })
})
