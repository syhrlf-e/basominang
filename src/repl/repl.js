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

function clearScreen(output) {
  output.write('\x1b[2J\x1b[H')
}

class ReplInputBuffer {
  constructor() {
    this.lines = []
  }

  get hasContent() {
    return this.lines.length > 0
  }

  append(line) {
    this.lines.push(line)
  }

  isComplete() {
    const source = this.lines.join('\n')
    const delimiters = []
    let mode = 'code'

    for (let index = 0; index < source.length; index += 1) {
      const character = source[index]

      if (mode === 'comment') {
        if (source.startsWith('}-', index)) {
          mode = 'code'
          index += 1
        }
        continue
      }

      if (mode === 'string') {
        if (character === '\\') {
          index += 1
        } else if (character === "'") {
          mode = 'code'
        }
        continue
      }

      if (source.startsWith('-{jan dibaco:', index)) {
        mode = 'comment'
        index += '-{jan dibaco:'.length - 1
        continue
      }
      if (character === "'") {
        mode = 'string'
        continue
      }
      if (character === '{' || character === '(') {
        delimiters.push(character)
        continue
      }
      if (character === '}' || character === ')') {
        const opening = delimiters.at(-1)
        const matches = (opening === '{' && character === '}') || (opening === '(' && character === ')')
        if (!matches) return true
        delimiters.pop()
      }
    }

    return mode === 'code' && delimiters.length === 0
  }

  take() {
    const source = this.lines.join('\n')
    this.clear()
    return source
  }

  clear() {
    this.lines = []
  }
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
  const buffer = new ReplInputBuffer()
  const rl = readline.createInterface({ input, output, prompt: chalk.green('>> ') })

  output.write(`${chalk.cyan('BasoMinang v1.0.0 — Mod Interaktif')}\n`)
  output.write(`${chalk.gray("Ketik 'kalua' untuk keluar.")}\n`)
  rl.prompt()

  rl.on('line', (rawInput) => {
    const command = rawInput.trim()
    if (!buffer.hasContent && !command) {
      rl.prompt()
      return
    }
    if (command === 'kalua') {
      output.write(`${chalk.cyan('Sampai juo!')}\n`)
      rl.close()
      return
    }
    if (!buffer.hasContent && (command === 'cls' || command === 'clear')) {
      clearScreen(output)
      rl.prompt()
      return
    }

    buffer.append(rawInput)
    if (!buffer.isComplete()) {
      rl.setPrompt(chalk.yellow('.. '))
      rl.prompt()
      return
    }

    try {
      session.execute(buffer.take())
    } catch (error) {
      buffer.clear()
      output.write(`${chalk.red(formatError(error))}\n`)
    }
    rl.setPrompt(chalk.green('>> '))
    rl.prompt()
  })

  return rl
}

module.exports = { clearScreen, createReplSession, formatError, ReplInputBuffer, startRepl }
