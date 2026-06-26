'use strict'

const { spawnSync } = require('node:child_process')
const vm = require('node:vm')

function readTerminalLine(prompt, { spawn = spawnSync, write = process.stdout.write.bind(process.stdout) } = {}) {
  write(String(prompt))

  const command = process.platform === 'win32' ? 'powershell.exe' : 'sh'
  const args = process.platform === 'win32'
    ? ['-NoProfile', '-Command', '[Console]::ReadLine()']
    : ['-c', 'IFS= read -r value; printf "%s" "$value"']
  const result = spawn(command, args, {
    encoding: 'utf8',
    stdio: ['inherit', 'pipe', 'inherit'],
    windowsHide: true
  })

  if (result.error) throw result.error
  if (result.status !== 0) throw new Error('Gagal mambaco input dari terminal.')
  return result.stdout.replace(/\r?\n$/, '')
}

function tanyo(prompt) {
  return readTerminalLine(prompt)
}

function runJavaScript(code, { filename = 'program.bm.js', context = null, input = tanyo } = {}) {
  if (context) {
    if (typeof context.tanyo !== 'function') context.tanyo = input
    return vm.runInContext(code, context, { filename })
  }
  return vm.runInNewContext(code, { console, tanyo: input }, { filename })
}

module.exports = { readTerminalLine, runJavaScript, tanyo }
