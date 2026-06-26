# TDD — BasoMinang Compiler
**Versi:** 1.0.0  
**Tanggal:** 26 Juni 2026  
**Author:** Syahrul Efendi  
**Mata Kuliah:** Teknik Kompilasi  
**Institusi:** Universitas Pamulang

---

## 1. Arsitektur Compiler

Pipeline compiler BasoMinang terdiri dari 7 fase berurutan:

```
Source Code (.bm)
       |
       v
  ┌─────────┐
  │  LEXER  │  — Tokenisasi source code
  └─────────┘
       |
    [Tokens]
       |
       v
  ┌──────────┐
  │  PARSER  │  — Bangun Parse Tree dari token stream
  └──────────┘
       |
   [Parse Tree]
       |
       v
  ┌─────┐
  │ AST │  — Abstract Syntax Tree (representasi terstruktur)
  └─────┘
       |
    [AST]
       |
       v
  ┌───────────────────┐
  │ SEMANTIC ANALYSIS │  — Cek scope, tipe, referensi
  └───────────────────┘
       |
  [Annotated AST]
       |
       v
  ┌────────────────┐
  │ CODE OPTIMIZER │  — Sederhanakan & optimasi AST
  └────────────────┘
       |
  [Optimized AST]
       |
       v
  ┌────────────────┐
  │ CODE GENERATOR │  — Generate JavaScript output
  └────────────────┘
       |
   [output.js]
       |
       v
  ┌─────────────┐
  │ Node Runtime │  — Eksekusi output.js
  └─────────────┘
       |
      stdout
```

---

## 2. Lexer

Lexer bertugas membaca source code `.bm` karakter per karakter dan menghasilkan stream of tokens.

### 2.1 Daftar Token

| Token Type | Contoh | Regex / Rule |
|---|---|---|
| `KEYWORD` | `buek`, `tapek`, `jiko` | Daftar keyword tetap |
| `IDENTIFIER` | `namo`, `hasil`, `x` | `/[a-zA-Z_][a-zA-Z0-9_]*/` |
| `NUMBER` | `10`, `3.14`, `0` | `/[0-9]+(\.[0-9]+)?/` |
| `STRING` | `'Halo'` | `/\'[^\']*\'/` |
| `TEMPLATE` | `` `Halo, ${namo}!` `` | Backtick dengan interpolasi `${...}` |
| `BOOLEAN` | `batua`, `salah` | Keyword khusus |
| `NULL` | `kosong` | Keyword khusus |
| `UNDEFINED` | `datantu` | Keyword khusus |
| `PLUS` | `+` | `+` |
| `MINUS` | `-` | `-` |
| `STAR` | `*` | `*` |
| `SLASH` | `/` | `/` |
| `PERCENT` | `%` | `%` |
| `EQ` | `==` | `==` |
| `NEQ` | `!=` | `!=` |
| `LT` | `<` | `<` |
| `GT` | `>` | `>` |
| `LTE` | `<=` | `<=` |
| `GTE` | `>=` | `>=` |
| `ASSIGN` | `=` | `=` |
| `PLUS_ASSIGN` | `+=` | `+=` |
| `MINUS_ASSIGN` | `-=` | `-=` |
| `STAR_ASSIGN` | `*=` | `*=` |
| `SLASH_ASSIGN` | `/=` | `/=` |
| `INCREMENT` | `++` | `++` |
| `DECREMENT` | `--` | `--` |
| `LPAREN` | `(` | `(` |
| `RPAREN` | `)` | `)` |
| `LBRACE` | `{` | `{` |
| `RBRACE` | `}` | `}` |
| `COMMA` | `,` | `,` |
| `SEMICOLON` | `;` | `;` |
| `COMMENT` | `-{jan dibaco: ... }-` | `/\-\{jan dibaco:[\s\S]*?\}-/` |
| `EOF` | — | End of file |

### 2.2 Daftar Keyword

```javascript
const KEYWORDS = {
  'buek'      : 'BUEK',
  'tapek'     : 'TAPEK',
  'cetak'     : 'CETAK',
  'jiko'      : 'JIKO',
  'lain'      : 'LAIN',
  'salamo'    : 'SALAMO',
  'untuak'    : 'UNTUAK',
  'karajo'    : 'KARAJO',
  'baliakan'  : 'BALIAKAN',
  'batua'     : 'BATUA',
  'salah'     : 'SALAH',
  'jo'        : 'JO',
  'atau'      : 'ATAU',
  'indak'     : 'INDAK',
  'kosong'    : 'KOSONG',
  'datantu'   : 'DATANTU',
  'baranti'   : 'BARANTI',
  'lanjuik'   : 'LANJUIK',
};
```

> **Catatan:** `lain jiko` dikenali sebagai dua token terpisah (`LAIN` + `JIKO`) dan digabung oleh Parser.

### 2.3 Aturan Tokenisasi

1. Skip whitespace (spasi, tab, newline) — kecuali untuk tracking nomor baris
2. Skip komentar `-{jan dibaco: ... }-`
3. Cek multi-char operator terlebih dahulu (`==`, `!=`, `<=`, `>=`, `++`, `--`, `+=`, `-=`, `*=`, `/=`) sebelum single-char
4. Cek keyword sebelum identifier
5. Setiap token menyimpan `{ type, value, line, col }`

### 2.4 Contoh Tokenisasi

**Input:**
```bm
buek namo = 'Rull'
cetak(namo)
```

**Output Token Stream:**
```
{ type: 'BUEK',       value: 'buek',  line: 1, col: 1  }
{ type: 'IDENTIFIER', value: 'namo',  line: 1, col: 6  }
{ type: 'ASSIGN',     value: '=',     line: 1, col: 11 }
{ type: 'STRING',     value: 'Rull',  line: 1, col: 13 }
{ type: 'CETAK',      value: 'cetak', line: 2, col: 1  }
{ type: 'IDENTIFIER', value: 'namo',  line: 2, col: 7  }
{ type: 'EOF',        value: null,    line: 3, col: 1  }
```

### 2.5 Pseudocode Lexer

```
function tokenize(source):
  tokens = []
  pos = 0
  line = 1
  col = 1

  while pos < source.length:
    skip whitespace & track line/col
    skip comments (-{jan dibaco: ... }-)

    if current is digit:
      tokens.push(readNumber())
    else if current is single quote:
      tokens.push(readString())
    else if current is letter or '_':
      word = readWord()
      if word in KEYWORDS:
        tokens.push({ type: KEYWORDS[word], value: word, line, col })
      else:
        tokens.push({ type: 'IDENTIFIER', value: word, line, col })
    else:
      tokens.push(readOperatorOrPunct())

  tokens.push({ type: 'EOF', line, col })
  return tokens
```

---

## 3. Parser

Parser menerima token stream dari Lexer dan membangun Parse Tree menggunakan metode **Recursive Descent Parsing**.

### 3.1 Grammar EBNF

```ebnf
program         ::= statement* EOF

statement       ::= varDecl
                  | constDecl
                  | printStmt
                  | ifStmt
                  | whileStmt
                  | forStmt
                  | funcDecl
                  | returnStmt
                  | breakStmt
                  | continueStmt
                  | assignStmt
                  | exprStmt

varDecl         ::= 'buek' IDENTIFIER '=' expression
constDecl       ::= 'tapek' IDENTIFIER '=' expression

printStmt       ::= 'cetak' '(' expression ')'
inputExpr       ::= 'tanyo' '(' expression ')'

ifStmt          ::= 'jiko' '(' expression ')' block
                    ( 'lain' 'jiko' '(' expression ')' block )*
                    ( 'lain' block )?

whileStmt       ::= 'salamo' '(' expression ')' block

forStmt         ::= 'untuak' '(' forInit ';' expression ';' forUpdate ')' block
forInit         ::= IDENTIFIER '=' expression
forUpdate       ::= IDENTIFIER '++'
                  | IDENTIFIER '--'
                  | IDENTIFIER '+=' expression
                  | IDENTIFIER '-=' expression

funcDecl        ::= 'karajo' IDENTIFIER '(' params? ')' block
params          ::= IDENTIFIER ( ',' IDENTIFIER )*

returnStmt      ::= 'baliakan' expression?
breakStmt       ::= 'baranti'
continueStmt    ::= 'lanjuik'

assignStmt      ::= IDENTIFIER ( '=' | '+=' | '-=' | '*=' | '/=' ) expression
                  | IDENTIFIER ( '++' | '--' )

block           ::= '{' statement* '}'

exprStmt        ::= expression

expression      ::= logicOr
logicOr         ::= logicAnd ( 'atau' logicAnd )*
logicAnd        ::= equality ( 'jo' equality )*
equality        ::= comparison ( ( '==' | '!=' ) comparison )*
comparison      ::= addition ( ( '>' | '<' | '>=' | '<=' ) addition )*
addition        ::= multiplication ( ( '+' | '-' ) multiplication )*
multiplication  ::= unary ( ( '*' | '/' | '%' ) unary )*
unary           ::= 'indak' unary | primary
primary         ::= NUMBER
                  | STRING
                  | 'batua'
                  | 'salah'
                  | 'kosong'
                  | 'datantu'
                  | IDENTIFIER
                  | IDENTIFIER '(' args? ')'
                  | '(' expression ')'

args            ::= expression ( ',' expression )*
```

### 3.2 Precedence Table (Urutan Prioritas Operator)

| Level | Operator | Asosiasi |
|---|---|---|
| 1 (terendah) | `atau` | Kiri |
| 2 | `jo` | Kiri |
| 3 | `==`, `!=` | Kiri |
| 4 | `>`, `<`, `>=`, `<=` | Kiri |
| 5 | `+`, `-` | Kiri |
| 6 | `*`, `/`, `%` | Kiri |
| 7 | `indak` (unary) | Kanan |
| 8 (tertinggi) | primary, call, grouping | — |

### 3.3 Pseudocode Parser

```
function parse(tokens):
  pos = 0

  function peek():
    return tokens[pos]

  function consume(expectedType):
    if peek().type != expectedType:
      error("ado salah di barih " + peek().line)
    return tokens[pos++]

  function parseStatement():
    switch peek().type:
      case BUEK:    return parseVarDecl()
      case TAPEK:   return parseConstDecl()
      case CETAK:   return parsePrintStmt()
      case JIKO:    return parseIfStmt()
      case SALAMO:  return parseWhileStmt()
      case UNTUAK:  return parseForStmt()
      case KARAJO:  return parseFuncDecl()
      case BALIAKAN: return parseReturnStmt()
      case BARANTI:  return parseBreakStmt()
      case LANJUIK:  return parseContinueStmt()
      default:       return parseAssignOrExpr()

  return parseProgram()
```

---

## 4. AST (Abstract Syntax Tree)

### 4.1 Node Types

```javascript
// Program root
{ type: 'Program', body: [Statement] }

// Deklarasi variabel
{ type: 'VarDecl', name: string, value: Expression, mutable: true }

// Deklarasi konstanta
{ type: 'ConstDecl', name: string, value: Expression, mutable: false }

// Print statement
{ type: 'PrintStmt', value: Expression }

// If statement
{
  type: 'IfStmt',
  condition: Expression,
  consequent: Block,
  alternates: [{ condition: Expression, block: Block }],  // lain jiko
  fallback: Block | null                                  // lain
}

// While statement
{ type: 'WhileStmt', condition: Expression, body: Block }

// For statement
{
  type: 'ForStmt',
  init: AssignStmt,
  condition: Expression,
  update: UpdateStmt,
  body: Block
}

// Fungsi deklarasi
{ type: 'FuncDecl', name: string, params: [string], body: Block }

// Return statement
{ type: 'ReturnStmt', value: Expression | null }

// Break statement
{ type: 'BreakStmt' }

// Continue statement
{ type: 'ContinueStmt' }

// Assignment
{ type: 'AssignStmt', name: string, operator: '='|'+='|'-='|'*='|'/=', value: Expression }

// Increment / Decrement
{ type: 'UpdateStmt', name: string, operator: '++'|'--' }

// Block
{ type: 'Block', body: [Statement] }

// Binary expression
{ type: 'BinaryExpr', operator: string, left: Expression, right: Expression }

// Unary expression
{ type: 'UnaryExpr', operator: 'indak', value: Expression }

// Function call
{ type: 'CallExpr', name: string, args: [Expression] }

// Identifier
{ type: 'Identifier', name: string }

// Literals
{ type: 'NumberLiteral',  value: number  }
{ type: 'StringLiteral',  value: string  }
{ type: 'TemplateLiteral', parts: (string | Expression)[] }
{ type: 'BooleanLiteral', value: boolean }
{ type: 'NullLiteral' }
{ type: 'UndefinedLiteral' }
```

### 4.2 Contoh AST

**Input:**
```bm
buek x = 10
jiko (x > 5) {
    cetak('Labiah gadang')
}
```

**AST Output:**
```json
{
  "type": "Program",
  "body": [
    {
      "type": "VarDecl",
      "name": "x",
      "mutable": true,
      "value": { "type": "NumberLiteral", "value": 10 }
    },
    {
      "type": "IfStmt",
      "condition": {
        "type": "BinaryExpr",
        "operator": ">",
        "left":  { "type": "Identifier", "name": "x" },
        "right": { "type": "NumberLiteral", "value": 5 }
      },
      "consequent": {
        "type": "Block",
        "body": [
          {
            "type": "PrintStmt",
            "value": { "type": "StringLiteral", "value": "Labiah gadang" }
          }
        ]
      },
      "alternates": [],
      "fallback": null
    }
  ]
}
```

---

## 5. Semantic Analysis

Semantic Analyzer melakukan traversal AST dan memvalidasi kebenaran semantik program.

### 5.1 Scope Chain

```
Global Scope
  └── Function Scope (karajo)
        └── Block Scope (jiko / salamo / untuak)
```

Setiap scope disimpan sebagai stack of maps:

```javascript
class ScopeChain {
  constructor() {
    this.scopes = [new Map()]  // global scope
  }

  enter() { this.scopes.push(new Map()) }
  exit()  { this.scopes.pop() }

  define(name, { type, mutable, line }) {
    const current = this.scopes[this.scopes.length - 1]
    if (current.has(name))
      error(`variabel '${name}' alah ado, ganti namo yo!`)
    current.set(name, { type, mutable, line })
  }

  lookup(name) {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (this.scopes[i].has(name))
        return this.scopes[i].get(name)
    }
    error(`variabel '${name}' indak ado, buek dulu yo!`)
  }
}
```

### 5.2 Validasi yang Dilakukan

| Validasi | Deskripsi |
|---|---|
| Undeclared variable | Variabel dipakai sebelum dideklarasi |
| Const reassignment | Variabel `tapek` tidak boleh diubah |
| Undeclared function | Fungsi dipanggil sebelum dideklarasi |
| Return outside function | `baliakan` di luar blok `karajo` |
| Break outside loop | `baranti` di luar `salamo` / `untuak` |
| Continue outside loop | `lanjuik` di luar `salamo` / `untuak` |
| Division by zero | Literal `/ 0` terdeteksi saat compile |
| Duplicate declaration | Variabel dideklarasi dua kali di scope sama |

### 5.3 Context Flags

```javascript
class SemanticAnalyzer {
  constructor() {
    this.scope       = new ScopeChain()
    this.inFunction  = false   // tracking apakah di dalam karajo
    this.inLoop      = false   // tracking apakah di dalam salamo/untuak
  }
}
```

### 5.4 Pseudocode Semantic Analyzer

```
function analyze(node):
  switch node.type:

    case 'VarDecl':
      value = analyze(node.value)
      scope.define(node.name, { mutable: true })

    case 'ConstDecl':
      value = analyze(node.value)
      scope.define(node.name, { mutable: false })

    case 'AssignStmt':
      symbol = scope.lookup(node.name)
      if not symbol.mutable:
        error("ado salah di barih N: '" + node.name + "' adalah tapek, indak bisa dirubah!")
      analyze(node.value)

    case 'FuncDecl':
      scope.define(node.name, { mutable: false })
      scope.enter()
      prevInFunction = inFunction
      inFunction = true
      for param in node.params: scope.define(param)
      analyze(node.body)
      inFunction = prevInFunction
      scope.exit()

    case 'ReturnStmt':
      if not inFunction:
        error("ado salah di barih N: 'baliakan' hanyo bisa di dalam 'karajo'!")

    case 'BreakStmt':
      if not inLoop:
        error("ado salah di barih N: 'baranti' hanyo bisa di dalam perulangan!")

    case 'ContinueStmt':
      if not inLoop:
        error("ado salah di barih N: 'lanjuik' hanyo bisa di dalam perulangan!")

    case 'WhileStmt' | 'ForStmt':
      prevInLoop = inLoop
      inLoop = true
      scope.enter()
      analyze(node.body)
      inLoop = prevInLoop
      scope.exit()

    case 'Identifier':
      scope.lookup(node.name)

    case 'CallExpr':
      scope.lookup(node.name)
      for arg in node.args: analyze(arg)
```

---

## 6. Code Optimizer

Optimizer melakukan traversal AST hasil semantic analysis dan menyederhanakan ekspresi yang bisa dihitung saat compile time.

### 6.1 Teknik Optimasi

#### a) Constant Folding
Ekspresi dengan dua literal langsung dievaluasi:

```
BinaryExpr(+, NumberLiteral(3), NumberLiteral(5))
  → NumberLiteral(8)
```

```bm
buek x = 3 + 5   →   buek x = 8
buek y = 10 * 2  →   buek y = 20
```

#### b) Constant Propagation
Jika variabel `tapek` diassign literal, referensinya diganti langsung:

```bm
tapek PI = 3.14
buek luas = PI * 10   →   buek luas = 3.14 * 10
```

#### c) Dead Code Elimination
Blok yang kondisinya pasti `salah` dihapus:

```bm
jiko (salah) {
    cetak('ini indak akan jalan')   →   (dihapus)
}
```

#### d) Unary Folding
Negasi literal langsung dievaluasi:

```bm
indak batua   →   salah
indak salah   →   batua
```

### 6.2 Pseudocode Optimizer

```
function optimize(node):
  switch node.type:

    case 'BinaryExpr':
      left  = optimize(node.left)
      right = optimize(node.right)

      // Constant Folding
      if left.type == 'NumberLiteral' and right.type == 'NumberLiteral':
        return NumberLiteral(eval(left.value, node.operator, right.value))

      // String concatenation folding
      if left.type == 'StringLiteral' and right.type == 'StringLiteral' and operator == '+':
        return StringLiteral(left.value + right.value)

      return BinaryExpr(node.operator, left, right)

    case 'UnaryExpr':
      val = optimize(node.value)
      if val.type == 'BooleanLiteral':
        return BooleanLiteral(!val.value)
      return UnaryExpr(node.operator, val)

    case 'IfStmt':
      cond = optimize(node.condition)
      // Dead code elimination
      if cond.type == 'BooleanLiteral' and cond.value == false:
        return null  // hapus seluruh blok
      return IfStmt(cond, optimize(node.consequent), ...)

    default:
      // Traverse dan optimize semua child nodes
      return traverseAndOptimize(node)
```

---

## 7. Code Generator

Code Generator melakukan traversal Optimized AST dan menghasilkan kode JavaScript valid.

### 7.1 Mapping AST Node → JavaScript

| AST Node | Output JavaScript |
|---|---|
| `VarDecl` | `let <name> = <value>;` |
| `ConstDecl` | `const <name> = <value>;` |
| `PrintStmt` | `console.log(<value>);` |
| `CallExpr` (`tanyo`) | Runtime menerima input teks dari terminal |
| `IfStmt` | `if (<cond>) { } else if { } else { }` |
| `WhileStmt` | `while (<cond>) { }` |
| `ForStmt` | `for (<init>; <cond>; <update>) { }` |
| `FuncDecl` | `function <name>(<params>) { }` |
| `ReturnStmt` | `return <value>;` |
| `BreakStmt` | `break;` |
| `ContinueStmt` | `continue;` |
| `AssignStmt` | `<name> <op> <value>;` |
| `UpdateStmt` | `<name><op>;` |
| `BinaryExpr` | `<left> <op> <right>` |
| `UnaryExpr` (indak) | `!<value>` |
| `CallExpr` | `<name>(<args>)` |
| `Identifier` | `<name>` |
| `NumberLiteral` | `<value>` |
| `StringLiteral` | `` `<value>` `` |
| `BooleanLiteral` (batua) | `true` |
| `BooleanLiteral` (salah) | `false` |
| `NullLiteral` | `null` |
| `UndefinedLiteral` | `undefined` |
| `jo` | `&&` |
| `atau` | `\|\|` |
| `indak` | `!` |

### 7.2 Contoh Generate

**Input BasoMinang:**
```bm
karajo faktorial(n) {
    jiko (n <= 1) {
        baliakan 1
    }
    baliakan n * faktorial(n - 1)
}

buek hasil = faktorial(5)
cetak(hasil)
```

**Output JavaScript:**
```javascript
function faktorial(n) {
    if (n <= 1) {
        return 1;
    }
    return n * faktorial(n - 1);
}

let hasil = faktorial(5);
console.log(hasil);
```

### 7.3 Pseudocode Generator

```
function generate(node):
  switch node.type:

    case 'Program':
      return node.body.map(generate).join('\n')

    case 'VarDecl':
      return `let ${node.name} = ${generate(node.value)};`

    case 'ConstDecl':
      return `const ${node.name} = ${generate(node.value)};`

    case 'PrintStmt':
      return `console.log(${generate(node.value)});`

    case 'IfStmt':
      out = `if (${generate(node.condition)}) {\n`
      out += node.consequent.body.map(generate).join('\n')
      out += '\n}'
      for alt in node.alternates:
        out += ` else if (${generate(alt.condition)}) {\n`
        out += alt.block.body.map(generate).join('\n')
        out += '\n}'
      if node.fallback:
        out += ` else {\n`
        out += node.fallback.body.map(generate).join('\n')
        out += '\n}'
      return out

    case 'WhileStmt':
      return `while (${generate(node.condition)}) {\n${generateBlock(node.body)}\n}`

    case 'ForStmt':
      init   = `${node.init.name} = ${generate(node.init.value)}`
      cond   = generate(node.condition)
      update = `${node.update.name}${node.update.operator}`
      return `for (let ${init}; ${cond}; ${update}) {\n${generateBlock(node.body)}\n}`

    case 'FuncDecl':
      params = node.params.join(', ')
      return `function ${node.name}(${params}) {\n${generateBlock(node.body)}\n}`

    case 'ReturnStmt':
      return node.value ? `return ${generate(node.value)};` : 'return;'

    case 'BinaryExpr':
      op = mapOperator(node.operator)  // jo→&&, atau→||
      return `${generate(node.left)} ${op} ${generate(node.right)}`

    case 'UnaryExpr':
      return `!${generate(node.value)}`

    case 'CallExpr':
      args = node.args.map(generate).join(', ')
      return `${node.name}(${args})`

    case 'StringLiteral':
      return `'${node.value}'`

    case 'NumberLiteral':
      return `${node.value}`

    case 'BooleanLiteral':
      return node.value ? 'true' : 'false'
```

---

## 8. CLI Interface

### 8.1 Entry Point

Compiler memiliki dua alias: `basominang` dan `bm`. Jika dijalankan tanpa argumen, otomatis masuk mode REPL.

```javascript
// index.js
const { program } = require('commander')
const chalk        = require('chalk')
const ora          = require('ora')
const fs           = require('fs')
const { compile }  = require('./src/compiler')
const { run }      = require('./src/runner')
const { startRepl} = require('./src/repl/repl')

program
  .name('bm')
  .description('BasoMinang Compiler — Bahasa Pemrograman Minangkabau')
  .version('1.0.0')

// Jika tidak ada argumen → masuk REPL
if (process.argv.length === 2) {
  startRepl()
  process.exit(0)
}

program
  .command('run <file>')
  .description('Compile jo jalankan file .bm')
  .action(async (file) => {
    const spinner = ora('Mangompilasi...').start()
    try {
      const js = compile(file)
      spinner.succeed(chalk.green('Kompilasi barasiah!'))
      run(js)
    } catch (err) {
      spinner.fail(chalk.red(err.message))
      process.exit(1)
    }
  })

program
  .command('compile <file>')
  .description('Compile file .bm ka .js')
  .action(async (file) => {
    const spinner = ora('Mangompilasi...').start()
    try {
      const js = compile(file)
      const outFile = file.replace('.bm', '.js')
      fs.writeFileSync(outFile, js)
      spinner.succeed(chalk.green(`Barasiah! Output: ${outFile}`))
    } catch (err) {
      spinner.fail(chalk.red(err.message))
      process.exit(1)
    }
  })

program.parse()
```

### 8.2 REPL Implementation

```javascript
// src/repl/repl.js
const readline = require('readline')
const chalk    = require('chalk')
const { compile } = require('../compiler')
const { run }     = require('../runner')

function startRepl() {
  // State REPL — variabel & fungsi persist selama session
  let sessionCode = ''

  const rl = readline.createInterface({
    input : process.stdin,
    output: process.stdout,
  })

  console.log(chalk.cyan('BasoMinang v1.0.0 — Mod Interaktif'))
  console.log(chalk.gray("Ketik 'kalua' untuk keluar
"))

  const prompt = () => rl.question(chalk.green('>> '), (input) => {
    const line = input.trim()

    // Keluar REPL
    if (line === 'kalua') {
      console.log(chalk.cyan('
Sampai juo!'))
      rl.close()
      return
    }

    // Skip baris kosong
    if (!line) return prompt()

    // Tambah ke session dan coba compile
    const tryCode = sessionCode + '
' + line

    try {
      const js = compile(tryCode, { repl: true })
      run(js, { replMode: true, lastLine: line })
      sessionCode = tryCode  // simpan ke session jika berhasil
    } catch (err) {
      // Error tidak crash — tampil pesan lalu lanjut
      console.log(chalk.red(err.message))
    }

    prompt()
  })
}

module.exports = { startRepl }
```

### 8.3 Contoh Output Terminal

**Sukses:**
```
✔ Kompilasi barasiah!
Halo, Rull!
Faktorial dari 5 adolah 120
```

**Error:**
```
✖ ado salah di barih 3: 'buek' paralu nilai, jan kosong!

  3 | buek x =
              ^
```

### 8.4 Warna Output

| Kondisi | Warna | chalk method |
|---|---|---|
| Sukses | Hijau | `chalk.green()` |
| Error | Merah | `chalk.red()` |
| Warning | Kuning | `chalk.yellow()` |
| Info | Cyan | `chalk.cyan()` |
| Highlight baris error | Putih tebal | `chalk.bold.white()` |

---

## 9. Packaging — Build `.exe`

### 9.1 Dependencies

```json
{
  "dependencies": {
    "commander": "^11.0.0",
    "chalk": "^4.1.2",
    "ora": "^5.4.1"
  },
  "devDependencies": {
    "pkg": "^5.8.1"
  }
}
```

> **Catatan:** Gunakan `chalk` v4 dan `ora` v5 karena v5+ menggunakan ESM yang tidak kompatibel dengan `pkg`.
> `readline` tidak perlu diinstall — sudah built-in di Node.js.

### 9.2 Build Command

```bash
# Install dependencies
npm install

# Build dua executable sekaligus (alias basominang dan bm)
npx pkg index.js --targets node18-win-x64 --output dist/basominang.exe
npx pkg index.js --targets node18-win-x64 --output dist/bm.exe

# Build multi-platform (opsional)
npx pkg index.js --targets node18-win-x64,node18-linux-x64,node18-macos-x64 --output dist/basominang
npx pkg index.js --targets node18-win-x64,node18-linux-x64,node18-macos-x64 --output dist/bm
```

### 9.3 package.json Scripts

```json
{
  "scripts": {
    "start"  : "node index.js",
    "build"  : "pkg index.js --targets node18-win-x64 --output dist/basominang.exe",
    "test"   : "node tests/run.js"
  },
  "bin": {
    "basominang": "index.js",
    "bm": "index.js"
  },
  "pkg": {
    "assets": ["src/**/*"],
    "targets": ["node18-win-x64"]
  }
}
```

### 9.4 Struktur Output Build

```
dist/
├── basominang.exe    ← alias panjang
└── bm.exe            ← alias pendek (lebih praktis)
```

---


## 11. VSCode Extension

### 11.1 Struktur File

```
vscode-extension/
├── package.json                          ← manifest extension
├── language-configuration.json           ← bracket, comment, auto-close
└── syntaxes/
    └── basominang.tmLanguage.json        ← TextMate grammar
```

### 11.2 package.json Extension

```json
{
  "name": "basominang",
  "displayName": "BasoMinang",
  "description": "Syntax highlighting untuk bahasa pemrograman BasoMinang (.bm)",
  "version": "1.0.0",
  "engines": { "vscode": "^1.80.0" },
  "categories": ["Programming Languages"],
  "contributes": {
    "languages": [{
      "id": "basominang",
      "aliases": ["BasoMinang", "bm"],
      "extensions": [".bm"],
      "configuration": "./language-configuration.json"
    }],
    "grammars": [{
      "language": "basominang",
      "scopeName": "source.bm",
      "path": "./syntaxes/basominang.tmLanguage.json"
    }]
  }
}
```

### 11.3 language-configuration.json

```json
{
  "comments": {
    "blockComment": ["-{jan dibaco:", "}-"]
  },
  "brackets": [
    ["{", "}"],
    ["(", ")"]
  ],
  "autoClosingPairs": [
    { "open": "{", "close": "}" },
    { "open": "(", "close": ")" },
    { "open": "'", "close": "'" }
  ],
  "surroundingPairs": [
    ["{", "}"],
    ["(", ")"],
    ["'", "'"]
  ]
}
```

### 11.4 TextMate Grammar (tmLanguage.json)

```json
{
  "$schema": "https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json",
  "name": "BasoMinang",
  "scopeName": "source.bm",
  "patterns": [
    { "include": "#comments" },
    { "include": "#keywords" },
    { "include": "#strings" },
    { "include": "#numbers" },
    { "include": "#booleans" },
    { "include": "#operators" },
    { "include": "#functions" },
    { "include": "#identifiers" }
  ],
  "repository": {
    "comments": {
      "name": "comment.block.basominang",
      "begin": "-\{jan dibaco:",
      "end": "\}-",
      "beginCaptures": {
        "0": { "name": "punctuation.definition.comment.basominang" }
      },
      "endCaptures": {
        "0": { "name": "punctuation.definition.comment.basominang" }
      }
    },
    "keywords": {
      "patterns": [
        {
          "name": "keyword.declaration.basominang",
          "match": "\b(buek|tapek|karajo)\b"
        },
        {
          "name": "keyword.control.basominang",
          "match": "\b(jiko|lain|salamo|untuak|baliakan|baranti|lanjuik|cetak)\b"
        }
      ]
    },
    "strings": {
      "name": "string.quoted.single.basominang",
      "begin": "'",
      "end": "'",
      "patterns": [
        {
          "name": "constant.character.escape.basominang",
          "match": "\\."
        }
      ]
    },
    "numbers": {
      "name": "constant.numeric.basominang",
      "match": "\b([0-9]+\.?[0-9]*)\b"
    },
    "booleans": {
      "name": "constant.language.basominang",
      "match": "\b(batua|salah|kosong|datantu)\b"
    },
    "operators": {
      "name": "keyword.operator.basominang",
      "match": "(==|!=|<=|>=|\+=|-=|\*=|/=|\+\+|--|[+\-*/%<>=!])"
    },
    "functions": {
      "name": "entity.name.function.basominang",
      "match": "\b([a-zA-Z_][a-zA-Z0-9_]*)(?=\s*\()"
    },
    "identifiers": {
      "name": "variable.other.basominang",
      "match": "\b[a-zA-Z_][a-zA-Z0-9_]*\b"
    }
  }
}
```

### 11.5 Build & Install Extension

```bash
# Install vsce (VSCode Extension CLI)
npm install -g @vscode/vsce

# Masuk ke folder extension
cd vscode-extension

# Package jadi .vsix
vsce package

# Output: basominang-1.0.0.vsix
```

### 11.6 Cara Install Extension (User)

```
1. Buka VSCode
2. Ctrl+Shift+X (Extensions)
3. Klik ··· (titik tiga) pojok kanan atas
4. Pilih "Install from VSIX..."
5. Pilih file basominang-1.0.0.vsix
6. Reload VSCode
7. Buka file .bm → syntax highlighting aktif!
```

---

## 10. Error Handling — Referensi Lengkap

| Kode | Kondisi | Pesan Error (Bahasa Minang) |
|---|---|---|
| E01 | Syntax error variabel | `ado salah di barih <N>: 'buek' paralu nilai, jan kosong!` |
| E02 | Variabel tidak ditemukan | `variabel '<nama>' indak ado, buek dulu yo!` |
| E03 | Tipe data tidak sesuai | `ado salah di barih <N>: tipe data indak samo, pareso baliak!` |
| E04 | Fungsi tidak ditemukan | `karajo '<nama>' indak ado, buek dulu yo!` |
| E05 | Kurung tidak ditutup | `ado salah di barih <N>: kuruang indak ditutuik, tambahan '}'!` |
| E06 | Assignment ke konstanta | `ado salah di barih <N>: '<nama>' adalah tapek, indak bisa dirubah!` |
| E07 | Divisi dengan nol | `ado salah di barih <N>: indak bisa bagi jo nol!` |
| E08 | Return di luar fungsi | `ado salah di barih <N>: 'baliakan' hanyo bisa di dalam 'karajo'!` |
| E09 | Break di luar loop | `ado salah di barih <N>: 'baranti' hanyo bisa di dalam perulangan!` |
| E10 | Continue di luar loop | `ado salah di barih <N>: 'lanjuik' hanyo bisa di dalam perulangan!` |
| E11 | Variabel duplikat | `variabel '<nama>' alah ado, ganti namo yo!` |
| E12 | File tidak ditemukan | `file '<nama>.bm' indak ado, pareso pathnyo!` |
| E13 | Ekstensi file salah | `file paralu ekstensi .bm, bukan '<ext>'!` |
