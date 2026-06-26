'use strict'

const { generate } = require('./generator/generator')
const { buildAst } = require('./ast/ast-builder')
const { tokenize } = require('./lexer/lexer')
const { optimize } = require('./optimizer/optimizer')
const { parse } = require('./parser/parser')
const { SemanticAnalyzer } = require('./semantic/semantic-analyzer')

function compileSource(source, { optimize: shouldOptimize = true, analyzer = null } = {}) {
  const tokens = tokenize(source)
  const parseTree = parse(tokens, source)
  const ast = buildAst(parseTree)
  const semanticAnalyzer = analyzer ?? new SemanticAnalyzer(source)
  semanticAnalyzer.source = source
  semanticAnalyzer.analyze(ast)
  const outputAst = shouldOptimize ? optimize(ast) : ast

  return {
    tokens,
    parseTree,
    ast,
    optimizedAst: outputAst,
    code: generate(outputAst)
  }
}

module.exports = { compileSource }
