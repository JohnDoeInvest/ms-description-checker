const acorn = require('acorn')
const walk = require('acorn-walk')
const fs = require('fs')
const _ = require('lodash')
const path = require('path')
const glob = require('glob')
const { logError } = require('./logger')

module.exports = function (opts) {
  const errors = []
  const descriptionPaths = glob.sync(path.join(opts.srcPath, '/**/serviceDescription.json'))

  for (let descriptionPath of descriptionPaths) {
    const serviceDirectory = path.parse(descriptionPath).dir
    const jsFiles = glob.sync(path.join(serviceDirectory, '**', '*.js'))

    const description = JSON.parse(fs.readFileSync(descriptionPath, 'utf-8'))
    if (description.name === 'GLOBAL') {
      continue
    }
    const serviceReqirement = {}

    if (description.services && description.services.shared) {
      const sharedServices = description.services.shared
      if (sharedServices.kafka) {
        const produces = sharedServices.kafka.produces
        serviceReqirement.producers = _.reduce(produces, (acc, value, key) => {
          acc[value] = false
          return acc
        }, {})
        const consumes = sharedServices.kafka.consumes
        serviceReqirement.consumers = _.reduce(consumes, (acc, value, key) => {
          acc[value] = false
          return acc
        }, {})
      }
    }

    for (let jsFile of jsFiles) {
      const jsFileData = fs.readFileSync(jsFile, 'utf-8')

      walk.simple(acorn.parse(jsFileData, { locations: true, sourceFile: jsFile }), {
        CallExpression (node) {
          if (node.callee && node.callee.property) {
            if (node.callee.property.name === 'produce') {
              const firstArg = node.arguments[0]
              if (firstArg && firstArg.type !== 'Literal') {
                logError(errors, firstArg, 'Produce was called with non literal.')
                return
              }

              const foundProducers = serviceReqirement.producers || {}
              const topicValue = firstArg.value
              if (foundProducers[topicValue] !== undefined) {
                foundProducers[topicValue] = true
              } else {
                logError(errors, firstArg, `Trying to produce to '${topicValue}' which is not in serviceDescription`)
              }
            } else if (node.callee.property.name === 'subscribe') {
              const firstArg = node.arguments[0]
              const foundConsumers = serviceReqirement.consumers || {}

              for (const element of firstArg.elements) {
                if (element && element.type !== 'Literal') {
                  logError(errors, element, 'Arry passed to subscribe contains non-literal.')
                  continue
                }

                const topicValue = element.value
                if (foundConsumers[topicValue] !== undefined) {
                  foundConsumers[topicValue] = true
                } else {
                  logError(errors, element, `Trying to subscribe to '${topicValue}' which is not in serviceDescription`)
                }
              }
            }
          }
        }
      })
    }

    const notUsedConsumers = _.keys(_.pickBy(serviceReqirement.consumers, (o) => !o))
    for (let consumer of notUsedConsumers) {
      errors.push(`${path.normalize(descriptionPath)}: Service description contains unused consumer '${consumer}'`)
    }

    const notUsedProducers = _.keys(_.pickBy(serviceReqirement.producers, (o) => !o))
    for (let producer of notUsedProducers) {
      errors.push(`${path.normalize(descriptionPath)}: Service description contains unused producer '${producer}'`)
    }
  }

  return errors
}
