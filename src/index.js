module.exports = function (opts) {
  const errors = [].concat(
    require('./checkKafka')(opts),
    require('./checkEnvVars')(opts)
  )

  if (errors.length > 0) {
    return errors
    // console.error(errors.join('\n'))
    // process.exit(1)
  } else {
    return undefined
    // process.exit(0)
  }
}
