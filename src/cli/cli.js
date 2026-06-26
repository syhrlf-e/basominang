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
REPL
  Ketik kalua untuk keluar.
  Ketik cls atau clear untuk membersihkan layar dan riwayat terminal.
  Prompt .. berarti kode multi-baris belum selesai.

CONTOH
  bm run hello.bm
  bm compile faktorial.bm
  bm

CONTOH BASOMINANG
  buek namo = 'Urang Minang'
  cetak('Halo, ' + namo + '!')

  buek namo = tanyo('Masuakkan namo: ')
  cetak('Halo, ' + namo)

CATATAN INPUT
  tanyo(<prompt string>) menerima input teks saat menjalankan bm run.

DOKUMENTASI
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
    .addHelpText('after', HELP_TEXT)

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
  return createProgram().parse(argv)
}

module.exports = { HELP_TEXT, VERSION, compileFile, createProgram, formatError, startCli, writeCompiledFile }
