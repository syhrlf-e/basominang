'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const vm = require('node:vm')
const { compileSource } = require('../src/compiler')
const { runJavaScript } = require('../src/runner')

test('runner menyediakan tanyo untuk program yang dijalankan', () => {
  const output = []
  const prompts = []
  const context = vm.createContext({ console: { log: (value) => output.push(value) } })
  const { code } = compileSource("buek namo = tanyo('Namo: ') cetak('Halo, ' + namo)")

  runJavaScript(code, {
    context,
    input: (prompt) => {
      prompts.push(prompt)
      return 'Syahrul'
    }
  })

  assert.deepEqual(prompts, ['Namo: '])
  assert.deepEqual(output, ['Halo, Syahrul'])
})
