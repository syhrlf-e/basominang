'use strict'

const OPERATOR_MAP = Object.freeze({
  jo: '&&',
  atau: '||',
  indak: '!'
})

class JavaScriptGenerator {
  constructor({ indent = '  ' } = {}) {
    this.indent = indent
  }

  generate(ast) {
    return this.generateProgram(ast).trimEnd() + '\n'
  }

  generateProgram(node) {
    return node.body.map((statement) => this.generateStatement(statement, 0)).join('\n')
  }

  generateStatement(node, depth) {
    const padding = this.indent.repeat(depth)

    switch (node.type) {
      case 'VarDecl':
        return `${padding}let ${node.name}${node.value ? ` = ${this.generateExpression(node.value)}` : ''};`
      case 'ConstDecl':
        return `${padding}const ${node.name} = ${this.generateExpression(node.value)};`
      case 'AssignStmt':
        return `${padding}${this.generateAssignment(node)};`
      case 'UpdateStmt':
        return `${padding}${node.name}${node.operator};`
      case 'PrintStmt':
        return `${padding}console.log(${this.generateExpression(node.value)});`
      case 'ExprStmt':
        return `${padding}${this.generateExpression(node.expression)};`
      case 'IfStmt':
        return this.generateIfStatement(node, depth)
      case 'WhileStmt':
        return `${padding}while (${this.generateExpression(node.condition)}) ${this.generateBlock(node.body, depth)}`
      case 'ForStmt':
        return `${padding}for (let ${this.generateAssignment(node.init)}; ${this.generateExpression(node.condition)}; ${this.generateForUpdate(node.update)}) ${this.generateBlock(node.body, depth)}`
      case 'FuncDecl':
        return `${padding}function ${node.name}(${node.params.join(', ')}) ${this.generateBlock(node.body, depth)}`
      case 'ReturnStmt':
        return `${padding}return${node.value ? ` ${this.generateExpression(node.value)}` : ''};`
      case 'BreakStmt':
        return `${padding}break;`
      case 'ContinueStmt':
        return `${padding}continue;`
      case 'Block':
        return `${padding}${this.generateBlock(node, depth)}`
      default:
        throw new Error(`Statement AST tidak didukung: ${node.type}`)
    }
  }

  generateIfStatement(node, depth) {
    const padding = this.indent.repeat(depth)
    let output = `${padding}if (${this.generateExpression(node.condition)}) ${this.generateBlock(node.consequent, depth)}`

    for (const alternate of node.alternates) {
      output += ` else if (${this.generateExpression(alternate.condition)}) ${this.generateBlock(alternate.block, depth)}`
    }
    if (node.fallback) output += ` else ${this.generateBlock(node.fallback, depth)}`
    return output
  }

  generateBlock(node, depth) {
    if (node.body.length === 0) return '{}'

    const content = node.body
      .map((statement) => this.generateStatement(statement, depth + 1))
      .join('\n')
    return `{\n${content}\n${this.indent.repeat(depth)}}`
  }

  generateAssignment(node) {
    return `${node.name} ${node.operator} ${this.generateExpression(node.value)}`
  }

  generateForUpdate(node) {
    return node.type === 'UpdateStmt' ? `${node.name}${node.operator}` : this.generateAssignment(node)
  }

  generateExpression(node) {
    switch (node.type) {
      case 'BinaryExpr':
        return `(${this.generateExpression(node.left)} ${this.mapOperator(node.operator)} ${this.generateExpression(node.right)})`
      case 'UnaryExpr':
        return `(${this.mapOperator(node.operator)}${this.generateExpression(node.value)})`
      case 'CallExpr':
        if (node.name === 'tanyo.nomor') {
          return `Number(tanyo(${node.args.map((argument) => this.generateExpression(argument)).join(', ')}))`
        }
        return `${node.name}(${node.args.map((argument) => this.generateExpression(argument)).join(', ')})`
      case 'Identifier':
        return node.name
      case 'NumberLiteral':
        return String(node.value)
      case 'StringLiteral':
        return JSON.stringify(node.value)
      case 'TemplateLiteral':
        return `[${node.parts.map((part) => typeof part === 'string'
          ? JSON.stringify(part)
          : `(${this.generateExpression(part)})`).join(', ')}].join('')`
      case 'BooleanLiteral':
        return String(node.value)
      case 'NullLiteral':
        return 'null'
      case 'UndefinedLiteral':
        return 'undefined'
      default:
        throw new Error(`Expression AST tidak didukung: ${node.type}`)
    }
  }

  mapOperator(operator) {
    return OPERATOR_MAP[operator] ?? operator
  }

}

function generate(ast, options) {
  return new JavaScriptGenerator(options).generate(ast)
}

module.exports = { generate, JavaScriptGenerator }
