'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const { buildAst } = require('../src/ast/ast-builder')
const { tokenize } = require('../src/lexer/lexer')
const { optimize } = require('../src/optimizer/optimizer')
const { parse } = require('../src/parser/parser')
const { analyze } = require('../src/semantic/semantic-analyzer')

function optimizeSource(source) {
  const ast = buildAst(parse(tokenize(source), source))
  analyze(ast, source)
  return optimize(ast)
}

test('optimizer melakukan constant folding pada angka, string, dan boolean', () => {
  const ast = optimizeSource("buek angka = 3 + 5 * 2 buek teks = 'Baso' + 'Minang' buek aktif = indak salah")

  assert.equal(ast.body[0].value.type, 'NumberLiteral')
  assert.equal(ast.body[0].value.value, 13)
  assert.equal(ast.body[1].value.value, 'BasoMinang')
  assert.equal(ast.body[2].value.value, true)
})

test('optimizer mengganti referensi konstanta dengan literal dan melipat ekspresi hasilnya', () => {
  const ast = optimizeSource('tapek pi = 3.14 buek diameter = pi * 2')

  assert.equal(ast.body[1].value.type, 'NumberLiteral')
  assert.equal(ast.body[1].value.value, 6.28)
})

test('optimizer menghapus cabang jiko yang pasti salah atau memilih cabang yang pasti benar', () => {
  const removed = optimizeSource("jiko (salah) { cetak('hapus') }")
  const selected = optimizeSource("jiko (batua) { cetak('pakai') } lain { cetak('hapus') }")

  assert.equal(removed.body.length, 0)
  assert.equal(selected.body[0].type, 'Block')
  assert.equal(selected.body[0].body[0].value.value, 'pakai')
})

test('optimizer tidak mengganti parameter fungsi atau variabel yang dapat berubah', () => {
  const ast = optimizeSource('tapek nilai = 10 karajo tambah(nilai) { baliakan nilai + 1 } buek x = nilai x += 1')
  const functionReturn = ast.body[1].body.body[0].value

  assert.equal(functionReturn.left.type, 'Identifier')
  assert.equal(ast.body[2].value.type, 'NumberLiteral')
})
