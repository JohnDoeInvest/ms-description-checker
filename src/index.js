module.exports = function (opts) {
  const errors = [].concat(
    require('./checkSchema')(opts),
    require('./checkKafka')(opts),
    require('./checkEnvVars')(opts)
  )

  // TODO: Rewrite so that this file finds all services and then goes trough
  // them with each of the checks? It would probably be quite simple.

  if (errors.length > 0) {
    return errors
  } else {
    return undefined
  }
}
