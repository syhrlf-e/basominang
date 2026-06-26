'use strict'

const { createNode } = require('./ast')

/**
 * Mengubah Parse Tree menjadi AST ringkas yang dipakai semantic analysis,
 * optimizer, dan code generator. Punctuation parser tidak dibawa ke AST.
 */
function buildAst(parseTree) {
  if (!parseTree || typeof parseTree !== 'object') return parseTree

  if (Array.isArray(parseTree)) {
    return parseTree.map((node) => buildAst(node))
  }

  if (!parseTree.kind) {
    return Object.fromEntries(
      Object.entries(parseTree).map(([key, value]) => [key, buildAst(value)])
    )
  }

  const properties = Object.fromEntries(
    Object.entries(parseTree)
      .filter(([key]) => !['kind', 'loc', 'token'].includes(key))
      .map(([key, value]) => [key, buildAst(value)])
  )

  return createNode(parseTree.kind, properties, parseTree.loc)
}

module.exports = { buildAst }
