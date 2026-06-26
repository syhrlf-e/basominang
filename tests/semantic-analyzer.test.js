'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const { CompilerError } = require('../src/errors/compiler-error')
const { buildAst } = require('../src/ast/ast-builder')
const { tokenize } = require('../src/lexer/lexer')
const { parse } = require('../src/parser/parser')
const { analyze } = require('../src/semantic/semantic-analyzer')

function analyzeSource(source) {
  return analyze(buildAst(parse(tokenize(source), source)), source)
}

function expectError(source, code) {
  assert.throws(
    () => analyzeSource(source),
    (error) => error instanceof CompilerError && error.code === code
  )
}

test('semantic analyzer menerima program valid dengan scope block dan fungsi rekursif', () => {
  const source = [
    'karajo faktorial(n) {',
    '  jiko (n <= 1) { baliakan 1 }',
    '  baliakan n * faktorial(n - 1)',
    '}',
    'buek hasil = faktorial(5)',
    'cetak hasil'
  ].join('\n')

  assert.equal(analyzeSource(source).type, 'Program')
})

test('semantic analyzer memberi metadata tipe dan simbol pada AST', () => {
  const ast = analyzeSource('buek nilai = 10 cetak nilai')

  assert.deepEqual(ast.body[0].semantic, {
    symbol: { kind: 'variable', mutable: true, type: 'number', line: 1 },
    inferredType: 'number'
  })
  assert.equal(ast.body[1].value.semantic.inferredType, 'number')
  assert.equal(ast.body[1].value.semantic.symbol.kind, 'variable')
})

test('semantic analyzer memperbolehkan shadowing namun menolak deklarasi ganda satu scope', () => {
  assert.equal(analyzeSource('buek nilai = 1 jiko (batua) { buek nilai = 2 cetak nilai }').type, 'Program')
  expectError('buek nilai = 1 buek nilai = 2', 'E11')
})

test('semantic analyzer menolak variabel tidak terdeklarasi dan perubahan konstanta', () => {
  expectError('cetak namo', 'E02')
  expectError('tapek pi = 3.14 pi = 3', 'E06')
})

test('semantic analyzer memvalidasi pemanggilan fungsi dan jumlah argumennya', () => {
  expectError('cetak tidak_ado()', 'E04')
  expectError('karajo tambah(a, b) { baliakan a + b } cetak tambah(1)', 'E03')
})

test('semantic analyzer memvalidasi konteks return, break, dan continue', () => {
  expectError('baliakan 1', 'E08')
  expectError('baranti', 'E09')
  expectError('lanjuik', 'E10')
  assert.equal(analyzeSource('salamo (batua) { lanjuik baranti }').type, 'Program')
})

test('semantic analyzer membuat initializer untuak sebagai variabel lokal loop', () => {
  assert.equal(analyzeSource('untuak (i = 0; i < 3; i++) { cetak i }').type, 'Program')
  expectError('untuak (i = 0; i < 3; i++) { cetak i } cetak i', 'E02')
})

test('semantic analyzer menangkap pembagian nol literal dan ketidaksesuaian tipe', () => {
  expectError('buek hasil = 10 / 0', 'E07')
  expectError("buek umur = 20 umur = 'dua puluh'", 'E03')
  expectError('jiko (1) { cetak 1 }', 'E03')
})

test('semantic analyzer mendukung konkatenasi string dan assignment dari nilai undefined', () => {
  assert.equal(analyzeSource("buek namo = 'Rull' cetak 'Halo, ' + namo").type, 'Program')
  assert.equal(analyzeSource('buek hasil = datantu hasil = 10 cetak hasil').type, 'Program')
})
