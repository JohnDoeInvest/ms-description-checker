const checker = require('../src/index')
const path = require('path')
const assert = require('chai').assert

// TODO: Make this an acual CLI (https://medium.com/netscape/a-guide-to-create-a-nodejs-command-line-package-c2166ad0452e)
describe('Check Environment Variables', () => {
  it('Missing environment variable', () => {
    const errors = checker({ srcPath: path.join(__dirname, 'projects', 'src-env') })
    assert.isDefined(errors, 'Missing errors about PORT')
    assert.lengthOf(errors, 1, 'More than one error!')
    assert.match(errors[0], /PORT/, 'Incorrect variable missing')
  })

  it('Global ENV used in service', () => {
    const errors = checker({ srcPath: path.join(__dirname, 'projects', 'src-global-env-in-service') })
    assert.isUndefined(errors, 'Didn´t find usage in service')
  })

  it('Service ENV used in other service', () => {
    const errors = checker({ srcPath: path.join(__dirname, 'projects', 'src-service-env-other') })
    assert.isDefined(errors)
    // We expect two errors, one for the variable being defined in a desciption but not used
    // and one for the variable being used but not defined. These happens in different services.
    assert.lengthOf(errors, 2)
    // Just to check that we have the correct places, this is a bit weak since we can't be 100% sure that this is the order.
    assert.match(errors[0], /serviceA.*unused.*ENV/)
    assert.match(errors[1], /serviceB.*ENV.*not defined/)
  })

  it('Service ENV used in same service', () => {
    const errors = checker({ srcPath: path.join(__dirname, 'projects', 'src-service-env') })
    assert.isUndefined(errors, 'Didn´t find usage in service')
  })

  it('Service ENV not used in service', () => {
    const errors = checker({ srcPath: path.join(__dirname, 'projects', 'src-service-env-fail') })
    assert.isDefined(errors)
    assert.lengthOf(errors, 1)
    // Just to check that we have the correct places, this is a bit weak since we can't be 100% sure that this is the order.
    assert.match(errors[0], /serviceA.*unused.*ENV/)
  })

  it('ENV used and not defined in service', () => {
    const errors = checker({ srcPath: path.join(__dirname, 'projects', 'src-service-env-not-defined') })
    assert.isDefined(errors)
    assert.lengthOf(errors, 1)
    // Just to check that we have the correct places, this is a bit weak since we can't be 100% sure that this is the order.
    assert.match(errors[0], /serviceA.*ENV.*not defined/)
  })
})
