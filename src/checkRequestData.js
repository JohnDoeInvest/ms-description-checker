const acorn = require('acorn')
const walk = require('acorn-walk')
const fs = require('fs')
const path = require('path')
const glob = require('glob')

const { logErrorAtNode } = require('./logger')

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

    if (description.incoming && description.incoming.restAPI && description.incoming.restAPI.endpoints) {
      for (const endpoint of Object.values(description.incoming.restAPI.endpoints)) {
        for (const method of endpoint) {
          if (method.parameters === undefined) {
            continue
          }
          serviceReqirement[method.handlingFunction] = { parameters: method.parameters, method: method.method }
        }
      }
    } else {
      continue
    }

    for (let jsFile of jsFiles) {
      const jsFileData = fs.readFileSync(jsFile, 'utf-8')

      walk.simple(acorn.parse(jsFileData, { locations: true, sourceFile: jsFile }), {
        FunctionDeclaration (outerNode) {
          if (serviceReqirement[outerNode.id.name] !== undefined) {
            const reqPropertyName = serviceReqirement[outerNode.id.name].method === 'GET' ? 'query' : 'body'
            walk.ancestor(outerNode, {
              MemberExpression (node, _, ancestors) {
                if (node.property.name === reqPropertyName) {
                  const parent = ancestors[ancestors.length - 2]
                  if (parent.property === undefined) {
                    // This is probably a re-assignment. We could try to trace it later.
                    // This might require us to use something other than Acorn since we need a way to find the usage of a variable in a scope
                    // console.log(parent)
                  } else {
                    const parameterName = parent.property.name
                    const parameter = serviceReqirement[outerNode.id.name].parameters[parameterName]

                    if (parameter === undefined) {
                      logErrorAtNode(errors, parent, `Parameter "${parameterName}" is not defined in serviceDescription`)
                    } else if (parameter !== true) {
                      serviceReqirement[outerNode.id.name].parameters[parameterName] = true
                    }
                  }
                }
              }
            })
          }
        }
      })

      // TODO: This needs some work since we have a hard time actually knowing
      /*
      for (const [key, method] of Object.entries(serviceReqirement)) {
        for (const [paramterName, value] of Object.entries(method.parameters)) {
          if (value !== true) {
            console.log(value)
            logError(errors, path.normalize(descriptionPath), `The parameter "${paramterName}" was defined in the service description for the function "${key}" but not in the code`)
          }
        }
      }
      */
    }
  }

  return errors
}
