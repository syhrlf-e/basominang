'use strict'

const { generate } = require('./generator/generator')
const { tokenize } = require('./lexer/lexer')
const { optimize } = require('./optimizer/optimizer')
const { parse } = require('./parser/parser')
const { analyze } = require('./semantic/semantic-analyzer')

function compileSource(source, { optimize: shouldOptimize = true } = {}) {
  const tokens = tokenize(source)
  const ast = parse(tokens, source)
  analyze(ast, source)
  const outputAst = shouldOptimize ? optimize(ast) : ast

  return {
    tokens,
    ast,
    optimizedAst: outputAst,
    code: generate(outputAst)
  }
}

module.exports = { compileSource }
