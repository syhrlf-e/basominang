'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const { CompilerError } = require('../src/errors/compiler-error')
const { buildAst } = require('../src/ast/ast-builder')
const { tokenize } = require('../src/lexer/lexer')
const { parse } = require('../src/parser/parser')

function parseSource(source) {
  return buildAst(parse(tokenize(source), source))
}

test('parser menghasilkan Parse Tree terpisah sebelum AST dibangun', () => {
  const source = 'buek hasil = 1 + 2'
  const parseTree = parse(tokenize(source), source)
  const ast = buildAst(parseTree)

  assert.equal(parseTree.kind, 'Program')
  assert.equal(parseTree.body[0].kind, 'VarDecl')
  assert.equal(parseTree.body[0].value.kind, 'BinaryExpr')
  assert.equal(ast.type, 'Program')
  assert.equal(ast.body[0].type, 'VarDecl')
})

test('parser membangun AST untuk deklarasi dan print', () => {
  const ast = parseSource("buek namo = 'Rull'\ncetak namo")

  assert.equal(ast.type, 'Program')
  assert.equal(ast.body[0].type, 'VarDecl')
  assert.equal(ast.body[0].name, 'namo')
  assert.equal(ast.body[0].value.value, 'Rull')
  assert.equal(ast.body[1].type, 'PrintStmt')
  assert.deepEqual(ast.body[1].value, {
    type: 'Identifier', name: 'namo', loc: { line: 2, column: 7 }
  })
})

test('parser menerapkan precedence dan associativity operator', () => {
  const ast = parseSource('buek hasil = 1 + 2 * 3 atau batua jo indak salah')
  const expression = ast.body[0].value

  assert.equal(expression.type, 'BinaryExpr')
  assert.equal(expression.operator, 'atau')
  assert.equal(expression.left.operator, '+')
  assert.equal(expression.left.right.operator, '*')
  assert.equal(expression.right.operator, 'jo')
  assert.equal(expression.right.right.type, 'UnaryExpr')
})

test('parser membangun kondisi if, lain jiko, dan lain', () => {
  const ast = parseSource(`jiko (nilai >= 90) {
  cetak 'A'
} lain jiko (nilai >= 75) {
  cetak 'B'
} lain {
  cetak 'C'
}`)
  const statement = ast.body[0]

  assert.equal(statement.type, 'IfStmt')
  assert.equal(statement.alternates.length, 1)
  assert.equal(statement.alternates[0].condition.operator, '>=')
  assert.equal(statement.fallback.body[0].value.value, 'C')
})

test('parser membangun while, for, assignment, dan update', () => {
  const ast = parseSource(`salamo (i < 3) { i++ }
untuak (i = 0; i < 3; i += 1) { cetak i }`)

  assert.equal(ast.body[0].type, 'WhileStmt')
  assert.equal(ast.body[0].body.body[0].type, 'UpdateStmt')
  assert.equal(ast.body[1].type, 'ForStmt')
  assert.equal(ast.body[1].init.type, 'AssignStmt')
  assert.equal(ast.body[1].update.type, 'AssignStmt')
  assert.equal(ast.body[1].update.operator, '+=')
})

test('parser membangun deklarasi fungsi, return, dan function call', () => {
  const ast = parseSource(`karajo tambah(a, b) {
  baliakan a + b
}
buek hasil = tambah(2, 3)`)

  const [functionDeclaration, variableDeclaration] = ast.body
  assert.deepEqual(functionDeclaration.params, ['a', 'b'])
  assert.equal(functionDeclaration.body.body[0].type, 'ReturnStmt')
  assert.equal(variableDeclaration.value.type, 'CallExpr')
  assert.deepEqual(variableDeclaration.value.args.map((argument) => argument.value), [2, 3])
})

test('parser menerima statement separator titik koma opsional', () => {
  const ast = parseSource('buek a = 1; cetak a;')

  assert.equal(ast.body.length, 2)
})

test('parser menolak syntax yang tidak sesuai grammar', () => {
  assert.throws(() => parseSource('buek = 1'), CompilerError)
  assert.throws(() => parseSource('jiko (batua) cetak 1'), CompilerError)
  assert.throws(() => parseSource('untuak (i = 0; i < 3; i) {}'), CompilerError)
})

test('parser menggunakan kontrak E01 dan E05 untuk syntax yang relevan', () => {
  assert.throws(
    () => parseSource('buek nilai ='),
    (error) => error instanceof CompilerError &&
      error.code === 'E01' &&
      error.message === "ado salah di barih 1: 'buek' paralu nilai, jan kosong!"
  )
  assert.throws(
    () => parseSource('jiko (batua) { cetak 1'),
    (error) => error instanceof CompilerError &&
      error.code === 'E05' &&
      error.message === "ado salah di barih 1: kuruang indak ditutuik, tambahan '}'!"
  )
  assert.throws(
    () => parseSource('jiko (batua'),
    (error) => error instanceof CompilerError &&
      error.code === 'E05' &&
      error.message === "ado salah di barih 1: kuruang indak ditutuik, tambahan ')'!"
  )
})
