'use strict'

const readline = require('node:readline')
const vm = require('node:vm')
const chalk = require('chalk')
const { compileSource } = require('../compiler')
const { CompilerError } = require('../errors/compiler-error')
const { runJavaScript } = require('../runner')
const { SemanticAnalyzer } = require('../semantic/semantic-analyzer')

function formatError(error) {
  return error instanceof CompilerError ? error.format() : error.message
}

function createReplSession() {
  return {
    analyzer: new SemanticAnalyzer(),
    context: vm.createContext({ console }),
    execute(input) {
      const checkpoint = this.analyzer.createCheckpoint()
      try {
        const { code } = compileSource(input, { analyzer: this.analyzer })
        return runJavaScript(code, { filename: '<repl>', context: this.context })
      } catch (error) {
        this.analyzer.restore(checkpoint)
        throw error
      }
    }
  }
}

function startRepl({ input = process.stdin, output = process.stdout } = {}) {
  const session = createReplSession()
  const rl = readline.createInterface({ input, output, prompt: chalk.green('>> ') })

  output.write(`${chalk.cyan('BasoMinang v1.0.0 — Mod Interaktif')}\n`)
  output.write(`${chalk.gray("Ketik 'kalua' untuk keluar.")}\n`)
  rl.prompt()

  rl.on('line', (rawInput) => {
    const line = rawInput.trim()
    if (!line) {
      rl.prompt()
      return
    }
    if (line === 'kalua') {
      output.write(`${chalk.cyan('Sampai juo!')}\n`)
      rl.close()
      return
    }

    try {
      session.execute(line)
    } catch (error) {
      output.write(`${chalk.red(formatError(error))}\n`)
    }
    rl.prompt()
  })

  return rl
}

module.exports = { createReplSession, formatError, startRepl }
