'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const { CompilerError } = require('../src/errors/compiler-error')
const { tokenize } = require('../src/lexer/lexer')
const { TokenType } = require('../src/lexer/token-types')

test('lexer mengubah deklarasi dan print menjadi token beserta posisi', () => {
  const tokens = tokenize("buek namo = 'Rull'\ncetak namo")

  assert.deepEqual(tokens, [
    { type: TokenType.BUEK, value: 'buek', line: 1, column: 1 },
    { type: TokenType.IDENTIFIER, value: 'namo', line: 1, column: 6 },
    { type: TokenType.ASSIGN, value: '=', line: 1, column: 11 },
    { type: TokenType.STRING, value: 'Rull', line: 1, column: 13 },
    { type: TokenType.CETAK, value: 'cetak', line: 2, column: 1 },
    { type: TokenType.IDENTIFIER, value: 'namo', line: 2, column: 7 },
    { type: TokenType.EOF, value: null, line: 2, column: 11 }
  ])
})

test('lexer mengenali seluruh keyword dan membedakannya dari identifier', () => {
  const source = 'buek tapek cetak jiko lain salamo untuak karajo baliakan batua salah jo atau indak kosong datantu baranti lanjuik buekan'
  const tokens = tokenize(source)

  assert.deepEqual(
    tokens.map(({ type }) => type),
    [
      TokenType.BUEK, TokenType.TAPEK, TokenType.CETAK, TokenType.JIKO,
      TokenType.LAIN, TokenType.SALAMO, TokenType.UNTUAK, TokenType.KARAJO,
      TokenType.BALIAKAN, TokenType.BATUA, TokenType.SALAH, TokenType.JO,
      TokenType.ATAU, TokenType.INDAK, TokenType.KOSONG, TokenType.DATANTU,
      TokenType.BARANTI, TokenType.LANJUIK, TokenType.IDENTIFIER, TokenType.EOF
    ]
  )
  assert.equal(tokens.at(-2).value, 'buekan')
})

test('lexer mendahulukan operator dua karakter dibanding operator satu karakter', () => {
  const tokens = tokenize('a == b != c <= d >= e += 1 -= 2 *= 3 /= 4 ++ --')

  assert.deepEqual(
    tokens.map(({ type }) => type),
    [
      TokenType.IDENTIFIER, TokenType.EQ, TokenType.IDENTIFIER, TokenType.NEQ,
      TokenType.IDENTIFIER, TokenType.LTE, TokenType.IDENTIFIER, TokenType.GTE,
      TokenType.IDENTIFIER, TokenType.PLUS_ASSIGN, TokenType.NUMBER,
      TokenType.MINUS_ASSIGN, TokenType.NUMBER, TokenType.STAR_ASSIGN,
      TokenType.NUMBER, TokenType.SLASH_ASSIGN, TokenType.NUMBER,
      TokenType.INCREMENT, TokenType.DECREMENT, TokenType.EOF
    ]
  )
})

test('lexer melewati komentar multi-baris dan menjaga posisi token sesudahnya', () => {
  const tokens = tokenize('-{jan dibaco:\nini komentar\n}-\nbuek x = 3.14')

  assert.deepEqual(tokens.slice(0, 4), [
    { type: TokenType.BUEK, value: 'buek', line: 4, column: 1 },
    { type: TokenType.IDENTIFIER, value: 'x', line: 4, column: 6 },
    { type: TokenType.ASSIGN, value: '=', line: 4, column: 8 },
    { type: TokenType.NUMBER, value: 3.14, line: 4, column: 10 }
  ])
})

test('lexer mendukung escape sequence pada string', () => {
  const [token] = tokenize("'baris satu\\nbaris dua\\'!'" )

  assert.deepEqual(token, {
    type: TokenType.STRING,
    value: "baris satu\nbaris dua'!",
    line: 1,
    column: 1
  })
})

test('lexer melempar CompilerError untuk karakter atau literal yang tidak valid', () => {
  assert.throws(() => tokenize('buek x = @'), CompilerError)
  assert.throws(() => tokenize("buek x = 'tak ditutup"), CompilerError)
  assert.throws(() => tokenize('-{jan dibaco: tak ditutup'), CompilerError)
})
