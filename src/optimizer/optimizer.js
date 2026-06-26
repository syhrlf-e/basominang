'use strict'

const { createNode } = require('../ast/ast')

const NON_CONSTANT = Symbol('non-constant')

class Optimizer {
  constructor() {
    this.scopes = [new Map()]
  }

  optimize(ast) {
    return this.visit(ast)
  }

  visit(node) {
    if (!node) return null

    switch (node.type) {
      case 'Program':
        return { ...node, body: this.optimizeStatements(node.body) }
      case 'Block':
        return this.visitBlock(node)
      case 'VarDecl':
      case 'ConstDecl':
        return this.visitDeclaration(node)
      case 'AssignStmt':
        return this.visitAssignment(node)
      case 'UpdateStmt':
        this.assign(node.name)
        return node
      case 'PrintStmt':
        return { ...node, value: this.visit(node.value) }
      case 'ExprStmt':
        return { ...node, expression: this.visit(node.expression) }
      case 'IfStmt':
        return this.visitIfStatement(node)
      case 'WhileStmt':
        return { ...node, condition: this.visit(node.condition), body: this.visit(node.body) }
      case 'ForStmt':
        return this.visitForStatement(node)
      case 'FuncDecl':
        return this.visitFunctionDeclaration(node)
      case 'ReturnStmt':
        return { ...node, value: this.visit(node.value) }
      case 'BinaryExpr':
        return this.visitBinaryExpression(node)
      case 'UnaryExpr':
        return this.visitUnaryExpression(node)
      case 'CallExpr':
        return { ...node, args: node.args.map((argument) => this.visit(argument)) }
      case 'TemplateLiteral':
        return { ...node, parts: node.parts.map((part) => typeof part === 'string' ? part : this.visit(part)) }
      case 'Identifier':
        return this.resolveConstant(node)
      default:
        return node
    }
  }

  optimizeStatements(statements) {
    return statements
      .map((statement) => this.visit(statement))
      .filter(Boolean)
  }

  visitBlock(node) {
    this.enterScope()
    try {
      return { ...node, body: this.optimizeStatements(node.body) }
    } finally {
      this.exitScope()
    }
  }

  visitDeclaration(node) {
    const value = node.value ? this.visit(node.value) : null
    const optimized = { ...node, value }

    if (node.type === 'ConstDecl' && value && this.isLiteral(value)) {
      this.define(node.name, value)
    } else {
      this.define(node.name, NON_CONSTANT)
    }

    return optimized
  }

  visitAssignment(node) {
    const value = this.visit(node.value)
    this.assign(node.name)
    return { ...node, value }
  }

  visitIfStatement(node) {
    const condition = this.visit(node.condition)

    if (condition.type === 'BooleanLiteral') {
      if (condition.value) return this.visit(node.consequent)

      for (const alternate of node.alternates) {
        const alternateCondition = this.visit(alternate.condition)
        if (alternateCondition.type !== 'BooleanLiteral') {
          return {
            ...node,
            condition: alternateCondition,
            consequent: this.visit(alternate.block),
            alternates: node.alternates.slice(node.alternates.indexOf(alternate) + 1)
              .map((item) => ({ ...item, condition: this.visit(item.condition), block: this.visit(item.block) })),
            fallback: node.fallback ? this.visit(node.fallback) : null
          }
        }
        if (alternateCondition.value) return this.visit(alternate.block)
      }

      return node.fallback ? this.visit(node.fallback) : null
    }

    return {
      ...node,
      condition,
      consequent: this.visit(node.consequent),
      alternates: node.alternates.map((alternate) => ({
        ...alternate,
        condition: this.visit(alternate.condition),
        block: this.visit(alternate.block)
      })),
      fallback: node.fallback ? this.visit(node.fallback) : null
    }
  }

  visitForStatement(node) {
    this.enterScope()
    try {
      const init = this.visit(node.init)
      this.define(node.init.name, NON_CONSTANT)
      return {
        ...node,
        init,
        condition: this.visit(node.condition),
        update: this.visit(node.update),
        body: this.visit(node.body)
      }
    } finally {
      this.exitScope()
    }
  }

  visitFunctionDeclaration(node) {
    this.define(node.name, NON_CONSTANT)
    this.enterScope()
    try {
      for (const parameter of node.params) this.define(parameter, NON_CONSTANT)
      return { ...node, body: this.visit(node.body) }
    } finally {
      this.exitScope()
    }
  }

  visitBinaryExpression(node) {
    const left = this.visit(node.left)
    const right = this.visit(node.right)
    const optimized = { ...node, left, right }

    if (left.type === 'NumberLiteral' && right.type === 'NumberLiteral') {
      return this.foldNumberBinary(optimized)
    }
    if (left.type === 'StringLiteral' && right.type === 'StringLiteral' && node.operator === '+') {
      return createNode('StringLiteral', { value: left.value + right.value }, node.loc)
    }
    if (left.type === 'BooleanLiteral' && right.type === 'BooleanLiteral') {
      if (node.operator === 'jo') return createNode('BooleanLiteral', { value: left.value && right.value }, node.loc)
      if (node.operator === 'atau') return createNode('BooleanLiteral', { value: left.value || right.value }, node.loc)
      if (node.operator === '==') return createNode('BooleanLiteral', { value: left.value === right.value }, node.loc)
      if (node.operator === '!=') return createNode('BooleanLiteral', { value: left.value !== right.value }, node.loc)
    }

    return optimized
  }

  foldNumberBinary(node) {
    const { left, operator, right } = node
    const operations = {
      '+': () => left.value + right.value,
      '-': () => left.value - right.value,
      '*': () => left.value * right.value,
      '/': () => left.value / right.value,
      '%': () => left.value % right.value
    }

    if (operations[operator]) {
      return createNode('NumberLiteral', { value: operations[operator]() }, node.loc)
    }

    const comparisons = {
      '==': () => left.value === right.value,
      '!=': () => left.value !== right.value,
      '>': () => left.value > right.value,
      '<': () => left.value < right.value,
      '>=': () => left.value >= right.value,
      '<=': () => left.value <= right.value
    }

    if (comparisons[operator]) {
      return createNode('BooleanLiteral', { value: comparisons[operator]() }, node.loc)
    }

    return node
  }

  visitUnaryExpression(node) {
    const value = this.visit(node.value)
    if (value.type === 'BooleanLiteral') {
      return createNode('BooleanLiteral', { value: !value.value }, node.loc)
    }
    return { ...node, value }
  }

  resolveConstant(node) {
    const constant = this.lookup(node.name)
    return constant && constant !== NON_CONSTANT ? this.cloneLiteral(constant, node.loc) : node
  }

  cloneLiteral(node, loc) {
    return createNode(node.type, { value: node.value }, loc)
  }

  isLiteral(node) {
    return ['NumberLiteral', 'StringLiteral', 'BooleanLiteral', 'NullLiteral', 'UndefinedLiteral'].includes(node.type)
  }

  enterScope() {
    this.scopes.push(new Map())
  }

  exitScope() {
    this.scopes.pop()
  }

  define(name, value) {
    this.scopes.at(-1).set(name, value)
  }

  assign(name) {
    for (let index = this.scopes.length - 1; index >= 0; index -= 1) {
      if (this.scopes[index].has(name)) {
        this.scopes[index].set(name, NON_CONSTANT)
        return
      }
    }
  }

  lookup(name) {
    for (let index = this.scopes.length - 1; index >= 0; index -= 1) {
      if (this.scopes[index].has(name)) return this.scopes[index].get(name)
    }
    return null
  }
}

function optimize(ast) {
  return new Optimizer().optimize(ast)
}

module.exports = { optimize, Optimizer }
