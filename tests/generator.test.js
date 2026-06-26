'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const vm = require('node:vm')
const { compileSource } = require('../src/compiler')

function execute(code) {
  const output = []
  vm.runInNewContext(code, { console: { log: (value) => output.push(value) } })
  return output
}

test('generator menghasilkan JavaScript valid dan mempertahankan precedence expression', () => {
  const { code } = compileSource('buek hasil = (1 + 2) * 3 cetak(hasil)', { optimize: false })

  assert.match(code, /let hasil = \(\(1 \+ 2\) \* 3\);/)
  assert.deepEqual(execute(code), [9])
})

test('generator memetakan control flow, logical operator, dan string secara benar', () => {
  const source = [
    "buek namo = 'Rull'",
    'jiko (batua jo indak salah) {',
    "  cetak('Halo, ' + namo)",
    '}'
  ].join('\n')
  const { code } = compileSource(source, { optimize: false })

  assert.match(code, /if \(\(true && \(!false\)\)\)/)
  assert.deepEqual(execute(code), ['Halo, Rull'])
})

test('pipeline lengkap menghasilkan JavaScript untuk rekursi dan loop for', () => {
  const source = [
    'karajo faktorial(n) {',
    '  jiko (n <= 1) { baliakan 1 }',
    '  baliakan n * faktorial(n - 1)',
    '}',
    'untuak (i = 1; i <= 3; i++) { cetak(faktorial(i)) }'
  ].join('\n')
  const { code } = compileSource(source)

  assert.match(code, /function faktorial\(n\)/)
  assert.match(code, /for \(let i = 1;/)
  assert.deepEqual(execute(code), [1, 2, 6])
})

test('pipeline meneruskan built-in tanyo dan menggunakan hasil string-nya', () => {
  const { code } = compileSource("buek namo = tanyo('Namo: ') cetak('Halo, ' + namo)")
  const output = []
  const context = vm.createContext({
    console: { log: (value) => output.push(value) },
    tanyo: (prompt) => {
      assert.equal(prompt, 'Namo: ')
      return 'Syahrul'
    }
  })

  vm.runInContext(code, context)
  assert.deepEqual(output, ['Halo, Syahrul'])
})
