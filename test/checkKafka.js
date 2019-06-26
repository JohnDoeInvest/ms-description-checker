const checker = require('../src/index')
const path = require('path')
const assert = require('chai').assert

describe('Check Kafka', () => {
  it('Producer defined, not used', () => {
    const errors = checker({ srcPath: path.join(__dirname, 'projects', 'src-producer-not-used') })
    assert.isDefined(errors)
    assert.lengthOf(errors, 1)
    assert.match(errors[0], /unused.*test-topic/)
  })

  it('Producer defined and used', () => {
    const errors = checker({ srcPath: path.join(__dirname, 'projects', 'src-producer') })
    assert.isUndefined(errors)
  })

  it('Producer used, not defined', () => {
    const errors = checker({ srcPath: path.join(__dirname, 'projects', 'src-producer-not-defined') })
    assert.isDefined(errors)
    assert.lengthOf(errors, 1)
    assert.match(errors[0], /Trying to produce to 'test-topic'/)
  })

  it('Consumer defined, not used', () => {
    const errors = checker({ srcPath: path.join(__dirname, 'projects', 'src-consumer-not-used') })
    assert.isDefined(errors)
    assert.lengthOf(errors, 1)
    assert.match(errors[0], /unused.*test-topic/)
  })

  it('Consumer defined and used', () => {
    const errors = checker({ srcPath: path.join(__dirname, 'projects', 'src-consumer') })
    assert.isUndefined(errors)
  })

  it('Consumer used, not defined', () => {
    const errors = checker({ srcPath: path.join(__dirname, 'projects', 'src-consumer-not-defined') })
    assert.isDefined(errors)
    assert.lengthOf(errors, 1)
    assert.match(errors[0], /Trying to subscribe to 'test-topic'/)
  })

  /*
  - NOT using Literals in `subscribe`
  - NOT using Literals in `produce`
   */
})
