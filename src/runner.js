'use strict'

const vm = require('node:vm')

function runJavaScript(code, { filename = 'program.bm.js', context = null } = {}) {
  if (context) {
    return vm.runInContext(code, context, { filename })
  }
  return vm.runInThisContext(code, { filename })
}

module.exports = { runJavaScript }
