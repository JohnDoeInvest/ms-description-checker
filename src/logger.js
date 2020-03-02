const path = require('path')

function logErrorAtNode (output, node, message) {
  logError(output, `${path.normalize(node.loc.filename)}:${node.loc.start.line}:${node.loc.start.column}`, message)
}

function logError (output, position, message) {
  output.push({
    position,
    message,
    type: 'error'
  })
}

function logWarning (output, position, message) {
  output.push({
    position,
    message,
    type: 'warning'
  })
}

module.exports = {
  logError,
  logErrorAtNode,
  logWarning
}
