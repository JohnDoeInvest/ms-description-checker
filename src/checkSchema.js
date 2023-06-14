const Ajv = require('ajv')
const ajv = new Ajv({ allErrors: true })
const path = require('path')
const fs = require('fs')
const glob = require('glob')
const { logError } = require('./logger')

// NOTE: There are not test for this, since the actual validation code is tested in the library.
// I (Henrik) feel like testing that our schemas checks things correctly feels unnecessary.

ajv.addSchema(require('./schema/service-description.schema.json'), 'service-description')
  .addSchema(require('./schema/rest-api.schema.json'), 'rest-api')
  .addSchema(require('./schema/env-vars.schema.json'), 'env-vars')
  .addSchema(require('./schema/kafka.schema.json'), 'kafka')
  .addSchema(require('./schema/sqlite.schema.json'), 'sqlite')

module.exports = function (opts) {
  const errors = []
  const descriptionPaths = glob.sync(path.join(opts.srcPath, '/**/serviceDescription.json'), { windowsPathsNoEscape: true })

  for (const descriptionPath of descriptionPaths) {
    const valid = ajv.validate('service-description', JSON.parse(fs.readFileSync(descriptionPath, 'utf-8')))

    if (!valid) {
      for (const error of ajv.errors) {
        logError(errors, path.normalize(descriptionPath), error.message + ', ' + error.dataPath)
      }
    }
  }
  return errors
}
