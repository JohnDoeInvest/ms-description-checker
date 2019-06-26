module.exports = function (opts) {
  const errors = [].concat(
    require('./checkKafka')(opts),
    require('./checkEnvVars')(opts)
  )

  if (errors.length > 0) {
    console.error(errors.join('\n'))
    process.exit(1)
  } else {
    process.exit(0)
  }
}
