const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const fs = require('fs')
const _ = require('lodash')
const path = require('path')
const glob = require('glob')
const { logError, logErrorAtNode } = require('./logger')

module.exports = function (opts) {
  const errors = []

  const rootDescription = JSON.parse(fs.readFileSync(path.resolve(opts.srcPath, 'serviceDescription.json')))
  const globalEnvs = _.mapValues(rootDescription.envVars, () => false)
  const descriptionPaths = glob.sync(path.join(opts.srcPath, '/**/serviceDescription.json'))
  const ignoreFiles = []

  const usedServiceEnvs = []

  for (let descriptionPath of descriptionPaths) {
    const serviceDirectory = path.parse(descriptionPath).dir
    const jsFiles = glob.sync(path.join(serviceDirectory, '**', '*.js'))

    const description = JSON.parse(fs.readFileSync(descriptionPath, 'utf-8'))
    if (description.name === 'GLOBAL') {
      continue
    }

    // Be sure to ignore the files we already checked.
    ignoreFiles.push(serviceDirectory + '/**/*.js')
    let serviceReqirement = {}
    if (description.envVars) {
      serviceReqirement = _.mapValues(description.envVars, () => false)
    }

    for (let jsFile of jsFiles) {
      walkFile(jsFile, serviceReqirement, globalEnvs, errors)
    }

    usedServiceEnvs.push(..._.keys(_.pickBy(serviceReqirement, (o) => o)))

    const notUsedEnvVars = _.keys(_.pickBy(serviceReqirement, (o) => !o))
    for (let envVar of notUsedEnvVars) {
      logError(errors, path.normalize(descriptionPath), `Service description contains unused environment variable '${envVar}'`)
    }
  }

  const otherJSFiles = glob.sync(path.join(opts.srcPath, '/**/*.js'), { ignore: ignoreFiles })
  for (let jsFile of otherJSFiles) {
    const jsFileData = fs.readFileSync(jsFile, 'utf-8')
    const ast = parser.parse(jsFileData, { sourceType: 'module', sourceFilename: jsFile, plugins: ['objectRestSpread'] })

    traverse(ast, {
      MemberExpression (nodePath) {
        const node = nodePath.node
        if (node.object.type === 'MemberExpression') {
          if (node.object.object.name === 'process' && node.object.property.name === 'env') {
            const envName = node.property.name
            if (globalEnvs[envName] !== undefined) {
              if (usedServiceEnvs.includes(envName)) {
                logErrorAtNode(errors, node, `Environment variable '${envName}' has been defined in a non-global serviceDescription. And should not longer be global.`)
              } else {
                globalEnvs[envName] = true
              }
            } else if (!usedServiceEnvs.includes(envName)) {
              logErrorAtNode(errors, node, `Environment variable '${envName}' not defined in serviceDescription`)
            }
          }
        }
      }
    })
  }

  const notUsedGlobalEnvVars = _.keys(_.pickBy(globalEnvs, (o) => !o))
  for (let envVar of notUsedGlobalEnvVars) {
    logError(errors, path.normalize(path.join(opts.srcPath, '/serviceDescription.json')), `Service description contains unused environment variable '${envVar}'`)
  }

  return errors
}

function walkFile (jsFile, serviceReqirement, globalEnvs, errors) {
  const jsFileData = fs.readFileSync(jsFile, 'utf-8')
  const jsFileDirectory = path.dirname(jsFile)
  const ast = parser.parse(jsFileData, { sourceType: 'module', sourceFilename: jsFile, plugins: ['objectRestSpread'] })

  traverse(ast, {
    MemberExpression (nodePath) {
      const node = nodePath.node
      if (node.object.type === 'MemberExpression') {
        if (node.object.object.name === 'process' && node.object.property.name === 'env') {
          const envName = node.property.name
          if (serviceReqirement[envName] !== undefined) {
            serviceReqirement[envName] = true
          } else if (globalEnvs[envName] !== undefined) {
            globalEnvs[envName] = true
          } else {
            logErrorAtNode(errors, node, `Environment variable '${envName}' not defined in serviceDescription`)
          }
        }
      }
    },
    CallExpression (nodePath) {
      const node = nodePath.node
      if (node.callee.type === 'Identifier' && node.callee.name === 'require') {
        const requiredFile = node.arguments[0].value
        const requiredPath = path.resolve(jsFileDirectory, requiredFile) + '.js'
        if (fs.existsSync(requiredPath)) {
          walkFile(requiredPath, serviceReqirement, globalEnvs, errors)
        }
      }
    }
  })
}
