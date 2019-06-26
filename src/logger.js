const path = require('path')

function logErrorAtNode (errors, node, message) {
  logError(errors, `${path.normalize(node.loc.source)}:${node.loc.start.line}:${node.loc.start.column}`, message)
}

function logError (errors, position, message) {
  errors.push({
    position,
    message
  })
}

module.exports = {
  logError,
  logErrorAtNode
}
