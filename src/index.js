module.exports = function (opts) {
  const errors = [].concat(
    require('./checkKafka')(opts),
    require('./checkEnvVars')(opts)
  )

  if (errors.length > 0) {
    return errors
  } else {
    return undefined
  }
}
