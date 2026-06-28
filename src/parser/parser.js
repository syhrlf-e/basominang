'use strict'

const { createNode } = require('./parse-tree')
const { CompilerError } = require('../errors/compiler-error')
const { getErrorMessage } = require('../errors/messages')
const { tokenize } = require('../lexer/lexer')
const { TokenType } = require('../lexer/token-types')

const ASSIGNMENT_OPERATORS = new Set([
  TokenType.ASSIGN,
  TokenType.PLUS_ASSIGN,
  TokenType.MINUS_ASSIGN,
  TokenType.STAR_ASSIGN,
  TokenType.SLASH_ASSIGN
])

class Parser {
  constructor(tokens, source = null) {
    if (!Array.isArray(tokens)) {
      throw new TypeError('Tokens harus berupa array.')
    }

    this.tokens = tokens
    this.source = source
    this.current = 0
  }

  parse() {
    const body = []

    while (!this.isAtEnd()) {
      body.push(this.parseStatement())
      this.match(TokenType.SEMICOLON)
    }

    return createNode('Program', { body })
  }

  parseStatement() {
    if (this.match(TokenType.BUEK)) return this.parseVariableDeclaration(true, this.previous())
    if (this.match(TokenType.TAPEK)) return this.parseVariableDeclaration(false, this.previous())
    if (this.match(TokenType.CETAK)) return this.parsePrintStatement(this.previous())
    if (this.match(TokenType.JIKO)) return this.parseIfStatement(this.previous())
    if (this.match(TokenType.SALAMO)) return this.parseWhileStatement(this.previous())
    if (this.match(TokenType.UNTUAK)) return this.parseForStatement(this.previous())
    if (this.match(TokenType.KARAJO)) return this.parseFunctionDeclaration(this.previous())
    if (this.match(TokenType.BALIAKAN)) return this.parseReturnStatement(this.previous())
    if (this.match(TokenType.BARANTI)) return createNode('BreakStmt', {}, this.previous())
    if (this.match(TokenType.LANJUIK)) return createNode('ContinueStmt', {}, this.previous())

    if (this.check(TokenType.IDENTIFIER) && this.isAssignmentStart()) {
      return this.parseUpdateOrAssignmentStatement()
    }

    const expression = this.parseExpression()
    return createNode('ExprStmt', { expression }, expression.loc)
  }

  parseVariableDeclaration(mutable, keyword) {
    const name = this.consume(TokenType.IDENTIFIER)
    if (!this.match(TokenType.ASSIGN)) {
      if (!mutable) throw this.error(this.peek(), 'E01', this.peek().line, keyword.value)
      return createNode('VarDecl', {
        name: name.value,
        value: null,
        mutable
      }, keyword)
    }

    if (!this.canStartExpression(this.peek())) throw this.error(this.peek(), 'E01', this.peek().line, keyword.value)
    const value = this.parseExpression()

    return createNode(mutable ? 'VarDecl' : 'ConstDecl', {
      name: name.value,
      value,
      mutable
    }, keyword)
  }

  parsePrintStatement(keyword) {
    this.consume(TokenType.LPAREN)
    const value = this.parseExpression()
    this.consume(TokenType.RPAREN)
    return createNode('PrintStmt', { value }, keyword)
  }

  parseIfStatement(keyword) {
    this.consume(TokenType.LPAREN)
    const condition = this.parseExpression()
    this.consume(TokenType.RPAREN)
    const consequent = this.parseBlock()
    const alternates = []
    let fallback = null

    while (this.match(TokenType.LAIN)) {
      if (this.match(TokenType.JIKO)) {
        this.consume(TokenType.LPAREN)
        const alternateCondition = this.parseExpression()
        this.consume(TokenType.RPAREN)
        alternates.push({ condition: alternateCondition, block: this.parseBlock() })
      } else {
        fallback = this.parseBlock()
        break
      }
    }

    return createNode('IfStmt', { condition, consequent, alternates, fallback }, keyword)
  }

  parseWhileStatement(keyword) {
    this.consume(TokenType.LPAREN)
    const condition = this.parseExpression()
    this.consume(TokenType.RPAREN)
    const body = this.parseBlock()

    return createNode('WhileStmt', { condition, body }, keyword)
  }

  parseForStatement(keyword) {
    this.consume(TokenType.LPAREN)
    const init = this.parseAssignmentStatement()
    this.consume(TokenType.SEMICOLON)
    const condition = this.parseExpression()
    this.consume(TokenType.SEMICOLON)
    const update = this.parseUpdateOrAssignmentStatement()
    this.consume(TokenType.RPAREN)
    const body = this.parseBlock()

    return createNode('ForStmt', { init, condition, update, body }, keyword)
  }

  parseFunctionDeclaration(keyword) {
    const name = this.consume(TokenType.IDENTIFIER)
    this.consume(TokenType.LPAREN)
    const params = []

    if (!this.check(TokenType.RPAREN)) {
      do {
        params.push(this.consume(TokenType.IDENTIFIER).value)
      } while (this.match(TokenType.COMMA))
    }

    this.consume(TokenType.RPAREN)
    const body = this.parseBlock()

    return createNode('FuncDecl', { name: name.value, params, body }, keyword)
  }

  parseReturnStatement(keyword) {
    const value = this.canStartExpression(this.peek()) ? this.parseExpression() : null
    return createNode('ReturnStmt', { value }, keyword)
  }

  parseBlock() {
    const openingBrace = this.consume(TokenType.LBRACE)
    const body = []

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      body.push(this.parseStatement())
      this.match(TokenType.SEMICOLON)
    }

    this.consume(TokenType.RBRACE)
    return createNode('Block', { body }, openingBrace)
  }

  parseAssignmentStatement() {
    const name = this.consume(TokenType.IDENTIFIER)
    const operator = this.advance()
    const value = this.parseExpression()

    return createNode('AssignStmt', {
      name: name.value,
      operator: operator.value,
      value
    }, name)
  }

  parseUpdateOrAssignmentStatement() {
    const name = this.consume(TokenType.IDENTIFIER)

    if (this.match(TokenType.INCREMENT, TokenType.DECREMENT)) {
      return createNode('UpdateStmt', {
        name: name.value,
        operator: this.previous().value
      }, name)
    }

    if (this.match(...ASSIGNMENT_OPERATORS)) {
      const operator = this.previous()
      return createNode('AssignStmt', {
        name: name.value,
        operator: operator.value,
        value: this.parseExpression()
      }, name)
    }

    throw this.error(this.peek())
  }

  parseExpression() {
    return this.parseLogicOr()
  }

  parseLogicOr() {
    let expression = this.parseLogicAnd()

    while (this.match(TokenType.ATAU)) {
      const operator = this.previous()
      expression = createNode('BinaryExpr', {
        operator: operator.value,
        left: expression,
        right: this.parseLogicAnd()
      }, operator)
    }

    return expression
  }

  parseLogicAnd() {
    let expression = this.parseEquality()

    while (this.match(TokenType.JO)) {
      const operator = this.previous()
      expression = createNode('BinaryExpr', {
        operator: operator.value,
        left: expression,
        right: this.parseEquality()
      }, operator)
    }

    return expression
  }

  parseEquality() {
    return this.parseBinary(this.parseComparison.bind(this), TokenType.EQ, TokenType.NEQ)
  }

  parseComparison() {
    return this.parseBinary(this.parseAddition.bind(this), TokenType.GT, TokenType.GTE, TokenType.LT, TokenType.LTE)
  }

  parseAddition() {
    return this.parseBinary(this.parseMultiplication.bind(this), TokenType.PLUS, TokenType.MINUS)
  }

  parseMultiplication() {
    return this.parseBinary(this.parseUnary.bind(this), TokenType.STAR, TokenType.SLASH, TokenType.PERCENT)
  }

  parseBinary(next, ...operatorTypes) {
    let expression = next()

    while (this.match(...operatorTypes)) {
      const operator = this.previous()
      expression = createNode('BinaryExpr', {
        operator: operator.value,
        left: expression,
        right: next()
      }, operator)
    }

    return expression
  }

  parseUnary() {
    if (this.match(TokenType.INDAK)) {
      const operator = this.previous()
      return createNode('UnaryExpr', {
        operator: operator.value,
        value: this.parseUnary()
      }, operator)
    }

    return this.parsePrimary()
  }

  parsePrimary() {
    if (this.match(TokenType.NUMBER)) {
      return createNode('NumberLiteral', { value: this.previous().value }, this.previous())
    }
    if (this.match(TokenType.STRING)) {
      return createNode('StringLiteral', { value: this.previous().value }, this.previous())
    }
    if (this.match(TokenType.TEMPLATE)) {
      return this.parseTemplateLiteral(this.previous())
    }
    if (this.match(TokenType.BATUA, TokenType.SALAH)) {
      return createNode('BooleanLiteral', { value: this.previous().type === TokenType.BATUA }, this.previous())
    }
    if (this.match(TokenType.KOSONG)) {
      return createNode('NullLiteral', {}, this.previous())
    }
    if (this.match(TokenType.DATANTU)) {
      return createNode('UndefinedLiteral', {}, this.previous())
    }
    if (this.match(TokenType.IDENTIFIER)) {
      const identifier = this.previous()
      const name = this.parseCallableName(identifier)

      if (this.match(TokenType.LPAREN)) {
        const args = []
        if (!this.check(TokenType.RPAREN)) {
          do {
            args.push(this.parseExpression())
          } while (this.match(TokenType.COMMA))
        }
        this.consume(TokenType.RPAREN)
        return createNode('CallExpr', { name, args }, identifier)
      }

      if (name !== identifier.value) throw this.error(this.peek())
      return createNode('Identifier', { name: identifier.value }, identifier)
    }
    if (this.match(TokenType.LPAREN)) {
      const expression = this.parseExpression()
      this.consume(TokenType.RPAREN)
      return expression
    }

    throw this.error(this.peek())
  }

  parseCallableName(identifier) {
    if (!this.match(TokenType.DOT)) return identifier.value

    const member = this.consume(TokenType.IDENTIFIER)
    return `${identifier.value}.${member.value}`
  }

  parseTemplateLiteral(token) {
    const parts = []
    let text = ''
    let index = 0

    while (index < token.value.length) {
      if (token.value[index] === '\\') {
        text += token.value.slice(index, index + 2)
        index += 2
        continue
      }

      if (token.value[index] !== '$' || token.value[index + 1] !== '{') {
        text += token.value[index]
        index += 1
        continue
      }

      if (text) {
        parts.push(this.decodeTemplateText(text))
        text = ''
      }

      const interpolation = this.readTemplateInterpolation(token, index + 2)
      parts.push(this.parseTemplateExpression(interpolation.source, token))
      index = interpolation.end + 1
    }

    if (text) parts.push(this.decodeTemplateText(text))
    return createNode('TemplateLiteral', { parts }, token)
  }

  readTemplateInterpolation(token, start) {
    let depth = 1
    let quote = null

    for (let index = start; index < token.value.length; index += 1) {
      const character = token.value[index]
      if (quote) {
        if (character === '\\') index += 1
        else if (character === quote) quote = null
        continue
      }
      if (character === "'") {
        quote = character
        continue
      }
      if (character === '{') depth += 1
      if (character === '}') {
        depth -= 1
        if (depth === 0) return { source: token.value.slice(start, index), end: index }
      }
    }

    throw this.error(token)
  }

  parseTemplateExpression(source, token) {
    const expressionParser = new Parser(tokenize(source), this.source)
    const expression = expressionParser.parseExpression()
    if (!expressionParser.isAtEnd()) throw expressionParser.error(expressionParser.peek())
    return expression
  }

  decodeTemplateText(text) {
    return text.replace(/\\([ntr`\\$])/g, (_, character) => ({
      n: '\n', t: '\t', r: '\r', '`': '`', '\\': '\\', $: '$'
    }[character]))
  }

  isAssignmentStart() {
    return ASSIGNMENT_OPERATORS.has(this.peekNext().type) ||
      this.peekNext().type === TokenType.INCREMENT ||
      this.peekNext().type === TokenType.DECREMENT
  }

  canStartExpression(token) {
    return [
      TokenType.NUMBER, TokenType.STRING, TokenType.BATUA, TokenType.SALAH,
      TokenType.KOSONG, TokenType.DATANTU, TokenType.IDENTIFIER,
      TokenType.LPAREN, TokenType.INDAK, TokenType.TEMPLATE
    ].includes(token.type)
  }

  match(...types) {
    for (const type of types) {
      if (this.check(type)) {
        this.advance()
        return true
      }
    }
    return false
  }

  consume(type) {
    if (this.check(type)) return this.advance()
    if (this.isAtEnd() && [TokenType.RBRACE, TokenType.RPAREN].includes(type)) {
      const closing = type === TokenType.RBRACE ? '}' : ')'
      throw this.error(this.peek(), 'E05', this.peek().line, closing)
    }
    throw this.error(this.peek())
  }

  check(type) {
    if (this.isAtEnd()) return type === TokenType.EOF
    return this.peek().type === type
  }

  advance() {
    if (!this.isAtEnd()) this.current += 1
    return this.previous()
  }

  isAtEnd() {
    return this.peek().type === TokenType.EOF
  }

  peek() {
    return this.tokens[this.current]
  }

  peekNext() {
    return this.tokens[this.current + 1] ?? this.tokens[this.current]
  }

  previous() {
    return this.tokens[this.current - 1]
  }

  error(token, code = 'E01', ...messageArguments) {
    return new CompilerError({
      code,
      message: getErrorMessage(code, ...(messageArguments.length > 0 ? messageArguments : [token.line])),
      line: token.line,
      column: token.column,
      source: this.source
    })
  }
}

function parse(tokens, source) {
  return new Parser(tokens, source).parse()
}

module.exports = { Parser, parse, parseTree: parse }
