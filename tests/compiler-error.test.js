'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const { CompilerError } = require('../src/errors/compiler-error')
const { getErrorMessage } = require('../src/errors/messages')

test('CompilerError menyimpan lokasi dan menampilkan cuplikan source', () => {
  const error = new CompilerError({
    code: 'E01',
    message: getErrorMessage('E01', 2),
    line: 2,
    column: 10,
    source: "buek namo = 'Rull'\nbuek x ="
  })

  assert.equal(error.code, 'E01')
  assert.match(error.format(), /2 \| buek x =/)
  assert.match(error.format(), /\^$/)
})

test('kamus pesan error menggunakan bahasa Minang yang telah ditetapkan', () => {
  assert.equal(
    getErrorMessage('E02', 'hasil'),
    "variabel 'hasil' indak ado, buek dulu yo!"
  )
  assert.equal(
    getErrorMessage('E01', 3, 'buek'),
    "ado salah di barih 3: 'buek' paralu nilai, jan kosong!"
  )
  assert.equal(
    getErrorMessage('E05', 4),
    "ado salah di barih 4: kuruang indak ditutuik, tambahan '}'!"
  )
})
