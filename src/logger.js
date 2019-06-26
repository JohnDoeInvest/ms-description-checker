const path = require('path')

function logError (errors, node, message) {
  errors.push(`\x1b[31m${path.normalize(node.loc.source)}:${node.loc.start.line}:${node.loc.start.column}: \x1b[0m${message}`)
}

module.exports = {
  logError
}
