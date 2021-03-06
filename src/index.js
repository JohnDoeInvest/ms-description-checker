const _ = require('lodash')

module.exports = function (opts) {
  const errors = [].concat(
    require('./checkSchema')(opts),
    require('./checkKafka')(opts),
    require('./checkEnvVars')(opts),
    require('./checkRequestData')(opts)
  )

  // TODO: Rewrite so that this file finds all services and then goes trough
  // them with each of the checks? It would probably be quite simple.

  if (errors.length > 0) {
    return _.uniqBy(errors, (e) => e.message + e.position)
  } else {
    return undefined
  }
}
