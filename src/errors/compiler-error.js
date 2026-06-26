'use strict'

/**
 * Error terstruktur yang dapat ditampilkan CLI dengan konteks source code.
 */
class CompilerError extends Error {
  constructor({ code, message, line = null, column = null, source = null }) {
    super(message)

    this.name = 'CompilerError'
    this.code = code
    this.line = line
    this.column = column
    this.source = source
  }

  format() {
    if (!this.line || !this.source) {
      return this.message
    }

    const sourceLine = this.source.split(/\r?\n/)[this.line - 1] ?? ''
    const lineNumber = String(this.line)
    const caretOffset = Math.max(this.column ?? 1, 1) - 1
    const caretLine = `${' '.repeat(lineNumber.length + 3 + caretOffset)}^`

    return `${this.message}\n\n${lineNumber} | ${sourceLine}\n${caretLine}`
  }
}

module.exports = { CompilerError }
