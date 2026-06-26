'use strict'

function createNode(type, properties = {}, token = null) {
  return {
    type,
    ...properties,
    loc: token ? { line: token.line, column: token.column } : null
  }
}

module.exports = { createNode }
