const checker = require('../src/index')
const path = require('path')
const assert = require('chai').assert

describe('Check Kafka', () => {
  it('Producer defined, not used', () => {
    const errors = checker({ srcPath: path.join(__dirname, 'projects', 'src-producer-not-used') })
    assert.isDefined(errors)
    assert.lengthOf(errors, 1)
    assert.match(errors[0].message, /unused.*test-topic/)
  })

  it('Producer defined and used', () => {
    const errors = checker({ srcPath: path.join(__dirname, 'projects', 'src-producer') })
    assert.isUndefined(errors)
  })

  it('Producer used, not defined', () => {
    const errors = checker({ srcPath: path.join(__dirname, 'projects', 'src-producer-not-defined') })
    assert.isDefined(errors)
    assert.lengthOf(errors, 1)
    assert.match(errors[0].message, /Trying to produce to 'test-topic'/)
  })

  it('Consumer defined, not used', () => {
    const errors = checker({ srcPath: path.join(__dirname, 'projects', 'src-consumer-not-used') })
    assert.isDefined(errors)
    assert.lengthOf(errors, 1)
    assert.match(errors[0].message, /unused.*test-topic/)
  })

  it('Consumer defined and used', () => {
    const errors = checker({ srcPath: path.join(__dirname, 'projects', 'src-consumer') })
    assert.isUndefined(errors)
  })

  it('Consumer used, not defined', () => {
    const errors = checker({ srcPath: path.join(__dirname, 'projects', 'src-consumer-not-defined') })
    assert.isDefined(errors)
    assert.lengthOf(errors, 1)
    assert.match(errors[0].message, /Trying to subscribe to 'test-topic'/)
  })

  it('Produce/Subscribe not using literal string', () => {
    const errors = checker({ srcPath: path.join(__dirname, 'projects', 'src-kafka-literal') })
    assert.isDefined(errors)
    assert.lengthOf(errors, 3)
    assert.match(errors[0].message, /subscribe contains non-literal/)
    assert.match(errors[1].message, /subscribe is non-literal/)
    assert.match(errors[2].message, /called with non-literal/)
  })
})
