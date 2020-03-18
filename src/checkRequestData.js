const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const fs = require('fs')
const path = require('path')
const glob = require('glob')

const { logWarning, logErrorAtNode } = require('./logger')

module.exports = function (opts) {
  const errors = []
  const descriptionPaths = glob.sync(path.join(opts.srcPath, '/**/serviceDescription.json'))

  for (const descriptionPath of descriptionPaths) {
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

    for (const jsFile of jsFiles) {
      const jsFileData = fs.readFileSync(jsFile, 'utf-8')
      const ast = parser.parse(jsFileData, { sourceType: 'module', sourceFilename: jsFile, plugins: ['objectRestSpread'] })

      traverse(ast, {
        FunctionDeclaration (outerPath) {
          const outerNode = outerPath.node
          if (serviceReqirement[outerNode.id.name] !== undefined) {
            const reqPropertyName = serviceReqirement[outerNode.id.name].method === 'GET' ? 'query' : 'body'
            traverse(outerNode, {
              MemberExpression (nodePath) {
                const node = nodePath.node
                if (node.property.name === reqPropertyName && node.object.name === 'req') {
                  const parent = nodePath.parent

                  if (parent.property === undefined) {
                    if (parent.type === 'VariableDeclarator') {
                      const binding = nodePath.scope.getBinding(parent.id.name)
                      for (const path of binding.referencePaths) {
                        if (path.parent.property === undefined) {
                          continue // Technically we should probably do this recursively but that might create more issues than is solved currently
                        }

                        const parameterName = path.parent.property.name
                        const parameter = serviceReqirement[outerNode.id.name].parameters[parameterName]

                        if (parameter === undefined) {
                          logErrorAtNode(errors, path.parent, `Parameter "${parameterName}" is not defined in serviceDescription`)
                        } else if (parameter !== true) {
                          serviceReqirement[outerNode.id.name].parameters[parameterName] = true
                        }
                      }
                    }
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
            }, outerPath.scope, outerPath.state, outerPath)
          }
        }
      })

      // TODO: This needs some work since we have a hard time actually knowing
      for (const [key, method] of Object.entries(serviceReqirement)) {
        for (const [paramterName, value] of Object.entries(method.parameters)) {
          if (value !== true) {
            logWarning(errors, path.normalize(descriptionPath), `The parameter "${paramterName}" was defined in the service description for the function "${key}" but not in the code`)
          }
        }
      }
    }
  }

  return errors
}
