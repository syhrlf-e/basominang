'use strict'

const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')
const { spawnSync } = require('node:child_process')
const vm = require('node:vm')
const { compileFile } = require('../src/cli/cli')
const { CompilerError } = require('../src/errors/compiler-error')
const { clearScreen, createReplSession, ReplInputBuffer } = require('../src/repl/repl')

const projectRoot = path.resolve(__dirname, '..')

test('compileFile mengompilasi file .bm dan menolak ekstensi selain .bm', () => {
  const result = compileFile(path.join(projectRoot, 'examples', 'hello.bm'))

  assert.match(result.code, /console\.log/)
  assert.throws(
    () => compileFile(path.join(projectRoot, 'README.md')),
    (error) => error instanceof CompilerError && error.code === 'E13'
  )
})

test('REPL mempertahankan state semantic dan runtime antar input', () => {
  const output = []
  const session = createReplSession()
  session.context = vm.createContext({ console: { log: (value) => output.push(value) } })

  session.execute('buek namo = \'Rull\'')
  session.execute("cetak 'Halo, ' + namo")

  assert.deepEqual(output, ['Halo, Rull'])
})

test('REPL mengembalikan state bila input gagal dianalisis', () => {
  const session = createReplSession()

  assert.throws(() => session.execute('buek gagal = 1 cetak indak_ado'), CompilerError)
  assert.doesNotThrow(() => session.execute('buek gagal = 1'))
})

test('perintah cls dan clear menggunakan ANSI escape untuk membersihkan layar', () => {
  const writes = []
  clearScreen({ write: (value) => writes.push(value) })

  assert.deepEqual(writes, ['\x1b[2J\x1b[H'])
})

test('buffer REPL menunggu blok, string, dan komentar hingga struktur lengkap', () => {
  const buffer = new ReplInputBuffer()

  buffer.append('karajo tambah(a, b) {')
  assert.equal(buffer.isComplete(), false)
  buffer.append('  baliakan a + b')
  assert.equal(buffer.isComplete(), false)
  buffer.append('}')
  assert.equal(buffer.isComplete(), true)
  assert.match(buffer.take(), /baliakan a \+ b/)

  buffer.append("cetak 'Halo")
  assert.equal(buffer.isComplete(), false)
  buffer.append(" Minang'")
  assert.equal(buffer.isComplete(), true)
  buffer.take()

  buffer.append('-{jan dibaco:')
  assert.equal(buffer.isComplete(), false)
  buffer.append('}-')
  assert.equal(buffer.isComplete(), true)
})

test('REPL mengeksekusi fungsi yang dikirim sebagai input multi-baris', () => {
  const output = []
  const session = createReplSession()
  session.context = vm.createContext({ console: { log: (value) => output.push(value) } })
  const functionSource = ['karajo tambah(a, b) {', '  baliakan a + b', '}'].join('\n')

  session.execute(functionSource)
  session.execute('cetak tambah(2, 3)')

  assert.deepEqual(output, [5])
})

test('CLI menjalankan contoh program secara end-to-end', () => {
  const result = spawnSync(process.execPath, ['index.js', 'run', 'examples/faktorial.bm'], {
    cwd: projectRoot,
    encoding: 'utf8'
  })

  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /Kompilasi barasiah!/)
  assert.match(result.stdout, /Faktorial dari 5 adolah 120/)
})

test('CLI help memuat panduan REPL dan contoh BasoMinang', () => {
  const result = spawnSync(process.execPath, ['index.js', '--help'], {
    cwd: projectRoot,
    encoding: 'utf8'
  })

  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /REPL/)
  assert.match(result.stdout, /Ketik cls atau clear untuk membersihkan layar\./)
  assert.match(result.stdout, /Prompt \.\. berarti kode multi-baris belum selesai\./)
  assert.match(result.stdout, /bm run hello\.bm/)
  assert.match(result.stdout, /buek namo = 'Urang Minang'/)
})

test('manifest VS Code extension valid dan menunjuk grammar yang ada', () => {
  const extensionDirectory = path.join(projectRoot, 'vscode-extension')
  const manifest = JSON.parse(fs.readFileSync(path.join(extensionDirectory, 'package.json'), 'utf8'))
  const grammarPath = manifest.contributes.grammars[0].path.replace('./', '')

  assert.equal(manifest.contributes.languages[0].extensions[0], '.bm')
  assert.equal(fs.existsSync(path.join(extensionDirectory, grammarPath)), true)
  assert.doesNotThrow(() => JSON.parse(fs.readFileSync(path.join(extensionDirectory, grammarPath), 'utf8')))
})
