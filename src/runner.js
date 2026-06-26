'use strict'

const vm = require('node:vm')
const readlineSync = require('readline-sync')

function tanyo(prompt) {
  return readlineSync.question(prompt)
}

function runJavaScript(code, { filename = 'program.bm.js', context = null, input = tanyo } = {}) {
  if (context) {
    if (typeof context.tanyo !== 'function') context.tanyo = input
    return vm.runInContext(code, context, { filename })
  }
  return vm.runInNewContext(code, { console, tanyo: input }, { filename })
}

module.exports = { runJavaScript, tanyo }
