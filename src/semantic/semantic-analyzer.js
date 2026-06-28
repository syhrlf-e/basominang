'use strict'

const { CompilerError } = require('../errors/compiler-error')
const { getErrorMessage } = require('../errors/messages')

const ValueType = Object.freeze({
  NUMBER: 'number',
  STRING: 'string',
  BOOLEAN: 'boolean',
  NULL: 'null',
  UNDEFINED: 'undefined',
  UNKNOWN: 'unknown',
  FUNCTION: 'function'
})

const BUILTIN_FUNCTIONS = Object.freeze({
  tanyo: Object.freeze({
    params: ['prompt'],
    returnType: ValueType.STRING
  }),
  'tanyo.nomor': Object.freeze({
    params: ['prompt'],
    returnType: ValueType.NUMBER
  })
})

class ScopeChain {
  constructor() {
    this.scopes = [new Map()]
  }

  enter() {
    this.scopes.push(new Map())
  }

  exit() {
    if (this.scopes.length === 1) throw new Error('Global scope tidak boleh ditutup.')
    this.scopes.pop()
  }

  define(name, symbol) {
    const currentScope = this.scopes.at(-1)
    if (currentScope.has(name)) return false
    currentScope.set(name, symbol)
    return true
  }

  lookup(name) {
    for (let index = this.scopes.length - 1; index >= 0; index -= 1) {
      const symbol = this.scopes[index].get(name)
      if (symbol) return symbol
    }
    return null
  }
}

class SemanticAnalyzer {
  constructor(source = null) {
    this.source = source
    this.scope = new ScopeChain()
    this.functionDepth = 0
    this.loopDepth = 0
    this.defineBuiltins()
  }

  defineBuiltins() {
    for (const [name, builtin] of Object.entries(BUILTIN_FUNCTIONS)) {
      this.scope.define(name, {
        kind: 'function',
        mutable: false,
        type: ValueType.FUNCTION,
        params: builtin.params,
        returnType: builtin.returnType,
        builtin: true,
        line: null
      })
    }
  }

  analyze(ast) {
    this.visit(ast)
    return ast
  }

  visit(node) {
    const inferredType = this.visitNode(node)
    this.annotate(node, inferredType)
    return inferredType
  }

  annotate(node, inferredType, details = {}) {
    node.semantic = {
      ...node.semantic,
      ...details,
      inferredType
    }
  }

  createCheckpoint() {
    return {
      scopes: this.scope.scopes.map((scope) => new Map(
        [...scope.entries()].map(([name, symbol]) => [name, { ...symbol }])
      )),
      functionDepth: this.functionDepth,
      loopDepth: this.loopDepth
    }
  }

  restore(checkpoint) {
    this.scope.scopes = checkpoint.scopes
    this.functionDepth = checkpoint.functionDepth
    this.loopDepth = checkpoint.loopDepth
  }

  visitNode(node) {
    switch (node.type) {
      case 'Program':
        for (const statement of node.body) this.visit(statement)
        return ValueType.UNKNOWN
      case 'Block': return this.visitBlock(node)
      case 'VarDecl':
      case 'ConstDecl': return this.visitDeclaration(node)
      case 'AssignStmt': return this.visitAssignment(node)
      case 'UpdateStmt': return this.visitUpdate(node)
      case 'PrintStmt': return this.visit(node.value)
      case 'ExprStmt': return this.visit(node.expression)
      case 'IfStmt': return this.visitIfStatement(node)
      case 'WhileStmt': return this.visitWhileStatement(node)
      case 'ForStmt': return this.visitForStatement(node)
      case 'FuncDecl': return this.visitFunctionDeclaration(node)
      case 'ReturnStmt':
        if (this.functionDepth === 0) this.raise('E08', node, node.loc.line)
        return node.value ? this.visit(node.value) : ValueType.UNDEFINED
      case 'BreakStmt':
        if (this.loopDepth === 0) this.raise('E09', node, node.loc.line)
        return ValueType.UNKNOWN
      case 'ContinueStmt':
        if (this.loopDepth === 0) this.raise('E10', node, node.loc.line)
        return ValueType.UNKNOWN
      case 'BinaryExpr': return this.visitBinaryExpression(node)
      case 'UnaryExpr': return this.visitUnaryExpression(node)
      case 'CallExpr': return this.visitCallExpression(node)
      case 'Identifier': return this.lookupVariable(node).type
      case 'NumberLiteral': return ValueType.NUMBER
      case 'StringLiteral': return ValueType.STRING
      case 'TemplateLiteral': return this.visitTemplateLiteral(node)
      case 'BooleanLiteral': return ValueType.BOOLEAN
      case 'NullLiteral': return ValueType.NULL
      case 'UndefinedLiteral': return ValueType.UNDEFINED
      default: throw new Error(`AST node tidak didukung: ${node.type}`)
    }
  }

  visitBlock(node) {
    this.scope.enter()
    try {
      for (const statement of node.body) this.visit(statement)
    } finally {
      this.scope.exit()
    }
    return ValueType.UNKNOWN
  }

  visitDeclaration(node) {
    const valueType = node.value ? this.visit(node.value) : ValueType.UNDEFINED
    const symbol = { kind: 'variable', mutable: node.mutable, type: valueType, line: node.loc.line }
    if (!this.scope.define(node.name, symbol)) this.raise('E11', node, node.name)
    this.annotate(node, valueType, { symbol: { ...symbol } })
    return valueType
  }

  visitAssignment(node) {
    const symbol = this.lookupVariable(node)
    if (!symbol.mutable) this.raise('E06', node, node.loc.line, node.name)
    const valueType = this.visit(node.value)

    if (node.operator === '=') {
      this.assertAssignable(symbol, valueType, node)
      this.updateInferredType(symbol, valueType)
      return symbol.type
    }

    if (node.operator === '+=') {
      const resultType = this.resolveAdditionType(symbol.type, valueType, node)
      this.updateInferredType(symbol, resultType)
      return resultType
    }

    this.assertNumber(symbol.type, node)
    this.assertNumber(valueType, node)
    if (node.operator === '/=' && this.isZeroLiteral(node.value)) this.raise('E07', node, node.loc.line)
    return ValueType.NUMBER
  }

  visitUpdate(node) {
    const symbol = this.lookupVariable(node)
    if (!symbol.mutable) this.raise('E06', node, node.loc.line, node.name)
    this.assertNumber(symbol.type, node)
    this.updateInferredType(symbol, ValueType.NUMBER)
    return ValueType.NUMBER
  }

  visitIfStatement(node) {
    this.assertBoolean(this.visit(node.condition), node.condition)
    this.visit(node.consequent)
    for (const alternate of node.alternates) {
      this.assertBoolean(this.visit(alternate.condition), alternate.condition)
      this.visit(alternate.block)
    }
    if (node.fallback) this.visit(node.fallback)
    return ValueType.UNKNOWN
  }

  visitWhileStatement(node) {
    this.assertBoolean(this.visit(node.condition), node.condition)
    this.loopDepth += 1
    try { this.visit(node.body) } finally { this.loopDepth -= 1 }
    return ValueType.UNKNOWN
  }

  visitForStatement(node) {
    this.scope.enter()
    try {
      const initializerType = this.visit(node.init.value)
      if (!this.scope.define(node.init.name, {
        kind: 'variable', mutable: true, type: initializerType, line: node.init.loc.line
      })) this.raise('E11', node.init, node.init.name)

      this.assertBoolean(this.visit(node.condition), node.condition)
      this.loopDepth += 1
      try {
        this.visit(node.update)
        this.visit(node.body)
      } finally {
        this.loopDepth -= 1
      }
    } finally {
      this.scope.exit()
    }
    return ValueType.UNKNOWN
  }

  visitFunctionDeclaration(node) {
    const symbol = {
      kind: 'function', mutable: false, type: ValueType.FUNCTION, params: node.params, line: node.loc.line
    }
    if (!this.scope.define(node.name, symbol)) this.raise('E11', node, node.name)
    this.annotate(node, ValueType.FUNCTION, { symbol: { ...symbol } })

    const outerLoopDepth = this.loopDepth
    this.scope.enter()
    this.functionDepth += 1
    this.loopDepth = 0
    try {
      for (const parameter of node.params) {
        if (!this.scope.define(parameter, {
          kind: 'variable', mutable: true, type: ValueType.UNKNOWN, line: node.loc.line
        })) this.raise('E11', node, parameter)
      }
      this.visit(node.body)
    } finally {
      this.loopDepth = outerLoopDepth
      this.functionDepth -= 1
      this.scope.exit()
    }
    return ValueType.FUNCTION
  }

  visitBinaryExpression(node) {
    const leftType = this.visit(node.left)
    const rightType = this.visit(node.right)
    if (node.operator === '+') return this.resolveAdditionType(leftType, rightType, node)

    if (['-', '*', '/', '%'].includes(node.operator)) {
      this.assertNumber(leftType, node.left)
      this.assertNumber(rightType, node.right)
      if (node.operator === '/' && this.isZeroLiteral(node.right)) this.raise('E07', node, node.loc.line)
      return ValueType.NUMBER
    }
    if (['>', '<', '>=', '<='].includes(node.operator)) {
      this.assertNumber(leftType, node.left)
      this.assertNumber(rightType, node.right)
      return ValueType.BOOLEAN
    }
    if (['==', '!='].includes(node.operator)) {
      this.assertComparable(leftType, rightType, node)
      return ValueType.BOOLEAN
    }
    if (['jo', 'atau'].includes(node.operator)) {
      this.assertBoolean(leftType, node.left)
      this.assertBoolean(rightType, node.right)
      return ValueType.BOOLEAN
    }
    throw new Error(`Operator tidak didukung: ${node.operator}`)
  }

  visitUnaryExpression(node) {
    this.assertBoolean(this.visit(node.value), node.value)
    return ValueType.BOOLEAN
  }

  visitCallExpression(node) {
    const symbol = this.scope.lookup(node.name)
    if (!symbol || symbol.kind !== 'function') this.raise('E04', node, node.name)
    if (node.args.length !== symbol.params.length) this.raise('E03', node, node.loc.line)

    const argumentTypes = node.args.map((argument) => this.visit(argument))
    if (symbol.builtin) {
      this.validateBuiltinCall(node, argumentTypes, symbol)
      this.annotate(node, symbol.returnType, { symbol: { ...symbol } })
      return symbol.returnType
    }

    this.annotate(node, ValueType.UNKNOWN, { symbol: { ...symbol } })
    return ValueType.UNKNOWN
  }

  visitTemplateLiteral(node) {
    for (const part of node.parts) {
      if (typeof part !== 'string') this.visit(part)
    }
    return ValueType.STRING
  }

  validateBuiltinCall(node, argumentTypes) {
    if (node.name === 'tanyo') {
      this.assertString(argumentTypes[0], node.args[0])
      return
    }

    if (node.name === 'tanyo.nomor') {
      this.assertString(argumentTypes[0], node.args[0])
      return
    }

  }

  lookupVariable(node) {
    const symbol = this.scope.lookup(node.name)
    if (!symbol || symbol.kind !== 'variable') this.raise('E02', node, node.name)
    this.annotate(node, symbol.type, { symbol: { ...symbol } })
    return symbol
  }

  resolveAdditionType(leftType, rightType, node) {
    if (leftType === ValueType.STRING || rightType === ValueType.STRING) {
      if (this.isKnown(leftType) && this.isKnown(rightType)) return ValueType.STRING
      return ValueType.UNKNOWN
    }
    this.assertNumber(leftType, node)
    this.assertNumber(rightType, node)
    return ValueType.NUMBER
  }

  assertAssignable(symbol, valueType, node) {
    if (!this.isKnown(symbol.type) || !this.isKnown(valueType)) return
    if ([ValueType.NULL, ValueType.UNDEFINED].includes(symbol.type)) return
    if (symbol.type !== valueType) this.raise('E03', node, node.loc.line)
  }

  assertComparable(leftType, rightType, node) {
    if (!this.isKnown(leftType) || !this.isKnown(rightType)) return
    if ([ValueType.NULL, ValueType.UNDEFINED].includes(leftType)) return
    if ([ValueType.NULL, ValueType.UNDEFINED].includes(rightType)) return
    if (leftType !== rightType) this.raise('E03', node, node.loc.line)
  }

  assertNumber(type, node) {
    if (type !== ValueType.NUMBER && type !== ValueType.UNKNOWN) this.raise('E03', node, node.loc.line)
  }

  assertBoolean(type, node) {
    if (type !== ValueType.BOOLEAN && type !== ValueType.UNKNOWN) this.raise('E03', node, node.loc.line)
  }

  assertString(type, node) {
    if (type !== ValueType.STRING && type !== ValueType.UNKNOWN) this.raise('E03', node, node.loc.line)
  }

  updateInferredType(symbol, type) {
    if ([ValueType.NULL, ValueType.UNDEFINED, ValueType.UNKNOWN].includes(symbol.type)) symbol.type = type
  }

  isKnown(type) {
    return type !== ValueType.UNKNOWN
  }

  isZeroLiteral(node) {
    return node.type === 'NumberLiteral' && node.value === 0
  }

  raise(code, node, ...messageArguments) {
    throw new CompilerError({
      code,
      message: getErrorMessage(code, ...messageArguments),
      line: node.loc?.line ?? null,
      column: node.loc?.column ?? null,
      source: this.source
    })
  }
}

function analyze(ast, source) {
  return new SemanticAnalyzer(source).analyze(ast)
}

module.exports = { analyze, BUILTIN_FUNCTIONS, ScopeChain, SemanticAnalyzer, ValueType }
