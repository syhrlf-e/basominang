'use strict'

const fs = require('node:fs')
const path = require('node:path')
const chalk = require('chalk')
const { Command } = require('commander')
const ora = require('ora')
const { compileSource } = require('../compiler')
const { CompilerError } = require('../errors/compiler-error')
const { getErrorMessage } = require('../errors/messages')
const { startRepl } = require('../repl/repl')
const { runJavaScript } = require('../runner')

const VERSION = '1.0.0'

const HELP_TEXT = `
Usage: bm [options] [command] [arguments]
       bm run <file.bm>
       bm compile <file.bm>
       bm

BasoMinang Compiler - Bahasa Pemrograman Minangkabau

Options:
  -h, --help, -help                                      tampilkan panduan penggunaan BasoMinang
  -V, --version                                          tampilkan versi BasoMinang

Commands:
  run <file.bm>                                          compile dan jalankan file .bm
  compile <file.bm>                                      compile file .bm menjadi file .js

Interactive Mode:
  bm                                                     masuk ke REPL jika tidak ada command
  kalua                                                  keluar dari REPL
  cls, clear                                             bersihkan layar dan riwayat terminal

Syntax:
  buek <namo> = <nilai>                                  buat variabel
  tapek <namo> = <nilai>                                 buat konstanta
  cetak(<nilai>)                                         tampilkan output
  tanyo(<prompt>)                                        input teks/string
  tanyo.nomor(<prompt>)                                  input angka/number
  jiko (<kondisi>) { ... } lain { ... }                  percabangan
  salamo (<kondisi>) { ... }                             perulangan while
  untuak (<init>; <kondisi>; <update>) { ... }           perulangan for
  karajo <namo>(<param>) { ... }                         buat fungsi
  baliakan <nilai>                                       kembalikan nilai dari fungsi
  baranti                                                hentikan loop
  lanjuik                                                lanjut ke putaran loop berikutnya

Examples:
  bm run hello.bm
  bm compile hello.bm
  bm --version

  buek namo = tanyo('Masuakkan namo: ')
  cetak('Halo, ' + namo)

  buek nilai = tanyo.nomor('Masuakkan nilai: ')
  jiko (nilai >= 80) { cetak('Nilai A') } lain { cetak('Nilai B') }

Documentation:
  https://github.com/syhrlf-e/basominang
`

function compileFile(filePath) {
  const extension = path.extname(filePath)
  if (extension.toLowerCase() !== '.bm') {
    throw new CompilerError({
      code: 'E13',
      message: getErrorMessage('E13', extension || 'tanpa ekstensi')
    })
  }
  if (!fs.existsSync(filePath)) {
    throw new CompilerError({
      code: 'E12',
      message: getErrorMessage('E12', filePath)
    })
  }

  const source = fs.readFileSync(filePath, 'utf8')
  return { source, ...compileSource(source) }
}

function writeCompiledFile(filePath, code) {
  const parsedPath = path.parse(filePath)
  const outputPath = path.join(parsedPath.dir, `${parsedPath.name}.js`)
  fs.writeFileSync(outputPath, code, 'utf8')
  return outputPath
}

function formatError(error) {
  return error instanceof CompilerError ? error.format() : error.message
}

function createSpinner(message) {
  return process.stdout.isTTY ? ora(message).start() : null
}

function handleCommandError(error, spinner = null) {
  if (spinner) spinner.fail(chalk.red(formatError(error)))
  else console.error(chalk.red(formatError(error)))
  process.exitCode = 1
}

function createProgram() {
  const program = new Command()
  program
    .name('bm')
    .description('BasoMinang Compiler — Bahasa Pemrograman Minangkabau')
    .helpOption('-h, --help', 'Tampilkan panduan penggunaan BasoMinang')
    .version(VERSION)
    .addHelpCommand(false)

  program.helpInformation = () => `${HELP_TEXT.trim()}\n`

  program
    .command('run <file>')
    .description('Compile jo jalankan file .bm')
    .action((file) => {
      try {
        const { code } = compileFile(file)
        runJavaScript(code, { filename: file })
      } catch (error) {
        handleCommandError(error)
      }
    })

  program
    .command('compile <file>')
    .description('Compile file .bm ka .js')
    .action((file) => {
      const spinner = createSpinner('Mangompilasi...')
      try {
        const { code } = compileFile(file)
        const outputPath = writeCompiledFile(file, code)
        const message = `Barasiah! Output: ${outputPath}`
        if (spinner) spinner.succeed(chalk.green(message))
        else console.log(chalk.green(message))
      } catch (error) {
        handleCommandError(error, spinner)
      }
    })

  return program
}

function startCli(argv = process.argv) {
  if (argv.length === 2) {
    startRepl()
    return null
  }
  const normalizedArgv = argv.map((argument) => argument === '-help' ? '--help' : argument)
  return createProgram().parse(normalizedArgv)
}

module.exports = { HELP_TEXT, VERSION, compileFile, createProgram, formatError, startCli, writeCompiledFile }
