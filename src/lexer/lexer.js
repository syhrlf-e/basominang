'use strict'

const { CompilerError } = require('../errors/compiler-error')
const { getErrorMessage } = require('../errors/messages')
const { KEYWORDS, TokenType } = require('./token-types')

const MULTI_CHARACTER_TOKENS = Object.freeze({
  '==': TokenType.EQ,
  '!=': TokenType.NEQ,
  '<=': TokenType.LTE,
  '>=': TokenType.GTE,
  '+=': TokenType.PLUS_ASSIGN,
  '-=': TokenType.MINUS_ASSIGN,
  '*=': TokenType.STAR_ASSIGN,
  '/=': TokenType.SLASH_ASSIGN,
  '++': TokenType.INCREMENT,
  '--': TokenType.DECREMENT
})

const SINGLE_CHARACTER_TOKENS = Object.freeze({
  '+': TokenType.PLUS,
  '-': TokenType.MINUS,
  '*': TokenType.STAR,
  '/': TokenType.SLASH,
  '%': TokenType.PERCENT,
  '<': TokenType.LT,
  '>': TokenType.GT,
  '=': TokenType.ASSIGN,
  '(': TokenType.LPAREN,
  ')': TokenType.RPAREN,
  '{': TokenType.LBRACE,
  '}': TokenType.RBRACE,
  ',': TokenType.COMMA,
  ';': TokenType.SEMICOLON
})

class Lexer {
  constructor(source) {
    if (typeof source !== 'string') {
      throw new TypeError('Source code harus berupa string.')
    }

    this.source = source
    this.current = 0
    this.line = 1
    this.column = 1
    this.tokens = []
  }

  tokenize() {
    while (!this.isAtEnd()) {
      this.scanToken()
    }

    this.tokens.push(this.createToken(TokenType.EOF, null))
    return this.tokens
  }

  scanToken() {
    const character = this.peek()

    if (this.isWhitespace(character)) {
      this.advance()
      return
    }

    if (this.matches('-{jan dibaco:')) {
      this.readComment()
      return
    }

    if (this.isDigit(character)) {
      this.readNumber()
      return
    }

    if (this.isIdentifierStart(character)) {
      this.readIdentifierOrKeyword()
      return
    }

    if (character === "'") {
      this.readString()
      return
    }

    if (character === '`') {
      this.readTemplate()
      return
    }

    this.readOperatorOrPunctuation()
  }

  readComment() {
    const startLine = this.line
    const startColumn = this.column
    this.advanceMany('-{jan dibaco:'.length)

    while (!this.isAtEnd() && !this.matches('}-')) {
      this.advance()
    }

    if (this.isAtEnd()) {
      this.throwSyntaxError(startLine, startColumn)
    }

    this.advanceMany(2)
  }

  readNumber() {
    const line = this.line
    const column = this.column
    const start = this.current

    while (this.isDigit(this.peek())) {
      this.advance()
    }

    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      this.advance()
      while (this.isDigit(this.peek())) {
        this.advance()
      }
    }

    if (this.isIdentifierStart(this.peek())) {
      while (this.isIdentifierPart(this.peek())) this.advance()
      const invalidNumber = this.source.slice(start, this.current)
      throw new CompilerError({
        code: 'E14',
        message: getErrorMessage('E14', invalidNumber),
        line,
        column,
        source: this.source
      })
    }

    const lexeme = this.source.slice(start, this.current)
    this.tokens.push(this.createToken(TokenType.NUMBER, Number(lexeme), line, column))
  }

  readIdentifierOrKeyword() {
    const line = this.line
    const column = this.column
    const start = this.current

    while (this.isIdentifierPart(this.peek())) {
      this.advance()
    }

    const lexeme = this.source.slice(start, this.current)
    const type = KEYWORDS[lexeme] ?? TokenType.IDENTIFIER
    this.tokens.push(this.createToken(type, lexeme, line, column))
  }

  readString() {
    const line = this.line
    const column = this.column
    this.advance()
    let value = ''

    while (!this.isAtEnd() && this.peek() !== "'") {
      if (this.peek() === '\\') {
        this.advance()
        value += this.readEscapeSequence(line, column)
      } else {
        value += this.advance()
      }
    }

    if (this.isAtEnd()) {
      this.throwSyntaxError(line, column)
    }

    this.advance()
    this.tokens.push(this.createToken(TokenType.STRING, value, line, column))
  }

  readTemplate() {
    const line = this.line
    const column = this.column
    this.advance()
    let value = ''

    while (!this.isAtEnd() && this.peek() !== '`') {
      const character = this.advance()
      value += character
      if (character === '\\' && !this.isAtEnd()) value += this.advance()
    }

    if (this.isAtEnd()) this.throwSyntaxError(line, column)

    this.advance()
    this.tokens.push(this.createToken(TokenType.TEMPLATE, value, line, column))
  }

  readEscapeSequence(line, column) {
    if (this.isAtEnd()) {
      this.throwSyntaxError(line, column)
    }

    const escaped = this.advance()
    const escapes = { n: '\n', t: '\t', r: '\r', "'": "'", '\\': '\\' }
    return escapes[escaped] ?? escaped
  }

  readOperatorOrPunctuation() {
    const line = this.line
    const column = this.column
    const pair = this.source.slice(this.current, this.current + 2)
    const multiCharacterType = MULTI_CHARACTER_TOKENS[pair]

    if (multiCharacterType) {
      this.advanceMany(2)
      this.tokens.push(this.createToken(multiCharacterType, pair, line, column))
      return
    }

    const character = this.advance()
    const singleCharacterType = SINGLE_CHARACTER_TOKENS[character]

    if (singleCharacterType) {
      this.tokens.push(this.createToken(singleCharacterType, character, line, column))
      return
    }

    this.throwSyntaxError(line, column)
  }

  createToken(type, value, line = this.line, column = this.column) {
    return { type, value, line, column }
  }

  isAtEnd() {
    return this.current >= this.source.length
  }

  peek() {
    return this.source[this.current] ?? '\0'
  }

  peekNext() {
    return this.source[this.current + 1] ?? '\0'
  }

  matches(value) {
    return this.source.startsWith(value, this.current)
  }

  advanceMany(count) {
    for (let index = 0; index < count; index += 1) {
      this.advance()
    }
  }

  advance() {
    const character = this.source[this.current]
    this.current += 1

    if (character === '\r') {
      if (this.peek() === '\n') {
        this.current += 1
      }
      this.line += 1
      this.column = 1
      return '\n'
    }

    if (character === '\n') {
      this.line += 1
      this.column = 1
      return character
    }

    this.column += 1
    return character
  }

  isWhitespace(character) {
    return character === ' ' || character === '\t' || character === '\n' || character === '\r'
  }

  isDigit(character) {
    return character >= '0' && character <= '9'
  }

  isIdentifierStart(character) {
    return (character >= 'a' && character <= 'z') ||
      (character >= 'A' && character <= 'Z') ||
      character === '_'
  }

  isIdentifierPart(character) {
    return this.isIdentifierStart(character) || this.isDigit(character)
  }

  throwSyntaxError(line, column) {
    throw new CompilerError({
      code: 'E01',
      message: getErrorMessage('E01', line),
      line,
      column,
      source: this.source
    })
  }
}

function tokenize(source) {
  return new Lexer(source).tokenize()
}

module.exports = { Lexer, tokenize }
