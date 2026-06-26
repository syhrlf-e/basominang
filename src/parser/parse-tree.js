'use strict'

/**
 * Concrete representation produced directly by the recursive-descent parser.
 * `kind` intentionally differs from AST's `type` so both stages are visible.
 */
function createNode(kind, properties = {}, token = null) {
  return {
    kind,
    ...properties,
    loc: token ? { line: token.line, column: token.column } : null,
    token: token ? { type: token.type, value: token.value } : null
  }
}

module.exports = { createNode }
