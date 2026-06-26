'use strict'

const vscode = require('vscode')

function activate(context) {
  const provider = {
    provideFileDecoration(uri) {
      if (!uri.path.toLowerCase().endsWith('.bm')) return undefined

      return new vscode.FileDecoration(
        'BM',
        'BasoMinang source file',
        new vscode.ThemeColor('charts.yellow')
      )
    }
  }

  context.subscriptions.push(vscode.window.registerFileDecorationProvider(provider))
}

function deactivate() {}

module.exports = { activate, deactivate }
