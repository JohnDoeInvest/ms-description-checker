const acorn = require('acorn')
const walk = require('acorn-walk')
const fs = require('fs')
const _ = require('lodash')
const path = require('path')
const glob = require('glob')
const { logError } = require('./logger')


module.exports = function (opts) {
  const errors = []

  const rootDescription = JSON.parse(fs.readFileSync(path.resolve(opts.srcPath, 'serviceDescription.json')))
  const globalEnvs = _.mapValues(rootDescription.envVars, () => false)
  const descriptionPaths = glob.sync(path.join(opts.srcPath, '/**/serviceDescription.json'))
  const ignoreFiles = []

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
      const jsFileData = fs.readFileSync(jsFile, 'utf-8')

      walk.simple(acorn.parse(jsFileData, { locations: true, sourceFile: jsFile }), {
        MemberExpression(node) {
          if (node.object.type === 'MemberExpression') {
            if (node.object.object.name === 'process' && node.object.property.name === 'env') {
              const envName = node.property.name
              if (serviceReqirement[envName] !== undefined) {
                serviceReqirement[envName] = true
              } else if (globalEnvs[envName] !== undefined) {
                globalEnvs[envName] = true
              } else {
                logError(node, `Environment variable '${envName}' not defined in serviceDescription`)
              }
            }
          }
        }
      })
    }

    const notUsedEnvVars = _.keys(_.pickBy(serviceReqirement, (o) => !o))
    for (let envVar of notUsedEnvVars) {
      errors.push(`${path.normalize(descriptionPath)}: Service description contains unused environment variable '${envVar}'`)
    }
  }

  const otherJSFiles = glob.sync(path.join(opts.srcPath, '/**/*.js'), { ignore: ignoreFiles })
  for (let jsFile of otherJSFiles) {
    const jsFileData = fs.readFileSync(jsFile, 'utf-8')

    walk.simple(acorn.parse(jsFileData, { locations: true, sourceFile: jsFile }), {
      MemberExpression(node) {
        if (node.object.type === 'MemberExpression') {
          if (node.object.object.name === 'process' && node.object.property.name === 'env') {
            const envName = node.property.name
            if (globalEnvs[envName] !== undefined) {
              globalEnvs[envName] = true
            } else {
              logError(node, `Environment variable '${envName}' not defined in serviceDescription`)
            }
          }
        }
      }
    })
  }

  const notUsedGlobalEnvVars = _.keys(_.pickBy(globalEnvs, (o) => !o))
  for (let envVar of notUsedGlobalEnvVars) {
    errors.push(`${path.normalize(path.join(opts.srcPath, '/serviceDescription.json'))}: Service description contains unused environment variable '${envVar}'`)
  }

  return errors
}
