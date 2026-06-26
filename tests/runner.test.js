'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const vm = require('node:vm')
const { compileSource } = require('../src/compiler')
const { readTerminalLine, runJavaScript } = require('../src/runner')

test('readTerminalLine menampilkan prompt dan membaca hasil dari proses terminal', () => {
  const writes = []
  const calls = []
  const value = readTerminalLine('Namo: ', {
    write: (text) => writes.push(text),
    spawn: (command, args, options) => {
      calls.push({ command, args, options })
      return { status: 0, stdout: 'Syahrul\r\n' }
    }
  })

  assert.equal(value, 'Syahrul')
  assert.deepEqual(writes, ['Namo: '])
  assert.equal(calls.length, 1)
  assert.deepEqual(calls[0].options.stdio, ['inherit', 'pipe', 'inherit'])
})

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
