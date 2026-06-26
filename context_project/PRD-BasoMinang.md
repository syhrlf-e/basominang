# PRD — BasoMinang Compiler
**Versi:** 1.0.0  
**Tanggal:** 26 Juni 2026  
**Author:** Syahrul Efendi  
**Mata Kuliah:** Teknik Kompilasi  
**Institusi:** Universitas Pamulang

---

## 1. Overview

**BasoMinang** adalah bahasa pemrograman mini berbasis bahasa daerah Minangkabau (Sumatera Barat). Dibangun sebagai tugas akhir mata kuliah Teknik Kompilasi, BasoMinang mengimplementasikan pipeline compiler lengkap mulai dari Lexer, Parser, AST, Semantic Analysis, Code Optimization, hingga Code Generator yang menghasilkan output JavaScript.

Compiler didistribusikan sebagai file `.exe` (Windows executable) sehingga dapat diinstal dan dijalankan langsung dari terminal tanpa dependensi tambahan.

---

## 2. Identitas Bahasa

| Atribut | Detail |
|---|---|
| Nama Bahasa | BasoMinang |
| Ekstensi File | `.bm` |
| Bahasa Dasar | Minangkabau (Sumatera Barat) |
| Target Output | JavaScript (`.js`) |
| Runtime | Node.js (bundled dalam `.exe`) |
| Platform | Windows (`.exe`), cross-platform via Node.js |

---

## 3. Tujuan Proyek

1. Mengimplementasikan compiler mini yang fungsional dengan pipeline lengkap
2. Melestarikan bahasa daerah Minangkabau melalui medium teknologi
3. Memenuhi seluruh komponen penilaian tugas akhir Teknik Kompilasi
4. Menghasilkan installer `.exe` yang dapat digunakan langsung

---

## 4. Target Pengguna

- Mahasiswa Teknik Informatika (konteks akademik)
- Dosen penguji mata kuliah Teknik Kompilasi
- Penutur bahasa Minangkabau yang tertarik dengan pemrograman

---

## 5. Fitur & Requirement

### 5.1 Fitur Wajib (Core)

| Fitur | Deskripsi |
|---|---|
| Variabel | Deklarasi dengan `buek` (mutable) dan `tapek` (immutable) |
| Tipe Data | Number (integer & float), String (single quote), Boolean, Null, Undefined |
| Operasi Aritmatika | `+`, `-`, `*`, `/`, `%` |
| Operasi Perbandingan | `==`, `!=`, `>`, `<`, `>=`, `<=` |
| Operasi Logika | `jo` (and), `atau` (or), `indak` (not) |
| Increment/Decrement | `i++`, `i--`, `i += n`, `i -= n` |
| Kondisi | `jiko`, `lain jiko`, `lain` |
| Loop While | `salamo` |
| Loop For | `untuak` |
| Fungsi | `karajo` dengan parameter dan `baliakan` |
| Print | `cetak` ke stdout terminal |
| Komentar | `-{jan dibaco: ... }-` (single & multi-line) |
| Scope | Block scope (variabel lokal dalam `{ }`) |
| Break & Continue | `baranti`, `lanjuik` |

### 5.2 Nilai Khusus

| Keyword | Nilai |
|---|---|
| `batua` | `true` |
| `salah` | `false` |
| `kosong` | `null` |
| `datantu` | `undefined` |

### 5.3 Fitur CLI

Compiler memiliki dua alias yang identik: `basominang` dan `bm`.

| Perintah | Fungsi |
|---|---|
| `bm` / `basominang` | Masuk mode REPL interaktif |
| `bm run <file.bm>` | Compile + langsung jalankan |
| `bm compile <file.bm>` | Compile saja, hasilkan file `.js` |
| `bm --version` | Tampilkan versi compiler |
| `bm --help` | Tampilkan daftar perintah |

### 5.4 Fitur REPL

| Fitur | Deskripsi |
|---|---|
| Mode interaktif | Masuk otomatis saat `bm` diketik tanpa argumen |
| State persistence | Variabel & fungsi yang dideklarasi tetap hidup selama session |
| Error recovery | Error tidak crash — tampil pesan lalu lanjut nunggu input |
| Keluar REPL | Ketik `kalua` atau tekan `Ctrl+C` |
| Keyword keluar | `kalua` |

### 5.5 Fitur Terminal Output

- Warna **hijau** untuk output sukses
- Warna **merah** untuk pesan error
- Warna **kuning** untuk peringatan (warning)
- **Highlight baris** saat terjadi error (tampilkan baris & nomor baris)
- **Loading indicator** saat proses compile berlangsung

---

## 6. Keyword & Syntax Reference

### 6.1 Tabel Keyword

| Konsep | Keyword BasoMinang | Padanan JS |
|---|---|---|
| Variabel mutable | `buek` | `let` |
| Variabel immutable | `tapek` | `const` |
| Print ke terminal | `cetak` | `console.log` |
| Kondisi | `jiko` | `if` |
| Kondisi lanjutan | `lain jiko` | `else if` |
| Kondisi default | `lain` | `else` |
| Loop kondisional | `salamo` | `while` |
| Loop iterasi | `untuak` | `for` |
| Fungsi | `karajo` | `function` |
| Kembalikan nilai | `baliakan` | `return` |
| Benar | `batua` | `true` |
| Salah | `salah` | `false` |
| Dan | `jo` | `&&` |
| Atau | `atau` | `\|\|` |
| Tidak | `indak` | `!` |
| Nilai kosong | `kosong` | `null` |
| Tidak terdefinisi | `datantu` | `undefined` |
| Hentikan loop | `baranti` | `break` |
| Lanjutkan loop | `lanjuik` | `continue` |

### 6.2 Syntax Rules

```
Variabel     : buek <nama> = <nilai>
Konstanta    : tapek <nama> = <nilai>
Kondisi      : jiko (<ekspresi>) { }
Else if      : lain jiko (<ekspresi>) { }
Else         : lain { }
While        : salamo (<ekspresi>) { }
For          : untuak (<init>; <kondisi>; <update>) { }
Fungsi       : karajo <nama>(<param>) { }
Return       : baliakan <nilai>
Print        : cetak <nilai>
Komentar     : -{jan dibaco: <teks> }-
```

### 6.3 Operator

| Jenis | Operator |
|---|---|
| Aritmatika | `+`, `-`, `*`, `/`, `%` |
| Perbandingan | `==`, `!=`, `>`, `<`, `>=`, `<=` |
| Logika | `jo`, `atau`, `indak` |
| Increment | `i++`, `i--` |
| Assignment | `=`, `+=`, `-=`, `*=`, `/=` |
| String concat | `+` |

---

## 7. Contoh Program BasoMinang

### 7.1 Hello World

```bm
buek namo = 'Urang Minang'
cetak 'Halo, ' + namo + '!'
```

### 7.2 Operasi Aritmatika

```bm
buek a = 10
buek b = 3

cetak a + b
cetak a - b
cetak a * b
cetak a / b
cetak a % b
```

### 7.3 Kondisi

```bm
buek niai = 85

jiko (niai >= 90) {
    cetak 'Sangaik Lamak'
} lain jiko (niai >= 75) {
    cetak 'Lamak'
} lain jiko (niai >= 60) {
    cetak 'Cukuik'
} lain {
    cetak 'Indak Luluih'
}
```

### 7.4 While Loop

```bm
buek i = 1

salamo (i <= 5) {
    cetak i
    i++
}
```

### 7.5 For Loop

```bm
untuak (i = 1; i < 6; i++) {
    cetak 'Langkah ka-' + i
}
```

### 7.6 Fungsi

```bm
karajo tambah(a, b) {
    baliakan a + b
}

karajo salamaik(namo) {
    cetak 'Assalamualaikum, ' + namo + '!'
}

buek hasil = tambah(10, 5)
cetak hasil

salamaik('Rull')
```

### 7.7 Rekursi

```bm
karajo faktorial(n) {
    jiko (n <= 1) {
        baliakan 1
    }
    baliakan n * faktorial(n - 1)
}

buek angko = 5
buek hasil = faktorial(angko)
cetak 'Faktorial dari ' + angko + ' adolah ' + hasil
```

### 7.8 Break & Continue

```bm
buek i = 1

salamo (i <= 10) {
    jiko (i == 5) {
        baranti
    }
    jiko (i == 3) {
        i++
        lanjuik
    }
    cetak i
    i++
}
```

### 7.9 Komentar

```bm
-{jan dibaco: iko komentar sebaris}-

-{jan dibaco:
iko komentar
nan banyak baris
jo bisa multi line
}-

buek x = 10
cetak x
```

### 7.10 Logika Boolean

```bm
buek a = batua
buek b = salah

jiko (a jo indak b) {
    cetak 'Kondisi batua!'
}

jiko (a atau b) {
    cetak 'Salah satu batua!'
}
```

---

## 8. Pesan Error (Bahasa Minang)

| Kondisi Error | Pesan |
|---|---|
| Syntax error variabel | `ado salah di barih <N>: 'buek' paralu nilai, jan kosong!` |
| Variabel tidak ditemukan | `variabel '<nama>' indak ado, buek dulu yo!` |
| Tipe data tidak sesuai | `ado salah di barih <N>: tipe data indak samo, pareso baliak!` |
| Fungsi tidak ditemukan | `karajo '<nama>' indak ado, buek dulu yo!` |
| Kurung tidak ditutup | `ado salah di barih <N>: kuruang indak ditutuik, tambahan '}'!` |
| Assignment ke konstanta | `ado salah di barih <N>: '<nama>' adalah tapek, indak bisa dirubah!` |
| Divisi dengan nol | `ado salah di barih <N>: indak bisa bagi jo nol!` |
| Return di luar fungsi | `ado salah di barih <N>: 'baliakan' hanyo bisa di dalam 'karajo'!` |
| Break di luar loop | `ado salah di barih <N>: 'baranti' hanyo bisa di dalam perulangan!` |

---

## 9. Output Flow

```
[input.bm]
    |
    v
[Lexer] — tokenisasi source code
    |
    v
[Parser] — bangun parse tree dari token
    |
    v
[AST] — Abstract Syntax Tree
    |
    v
[Semantic Analysis] — cek scope, tipe, referensi
    |
    v
[Code Optimizer] — sederhanakan AST
    |
    v
[Code Generator] — hasilkan output.js
    |
    v
[Node.js Runtime] — eksekusi output.js
    |
    v
[stdout Terminal] — hasil program tampil di terminal
```

---

## 10. Tech Stack

| Komponen | Teknologi |
|---|---|
| Bahasa implementasi | JavaScript (Node.js) |
| Packaging ke `.exe` | `pkg` (by Vercel) |
| Colored terminal output | `chalk` |
| Loading indicator | `ora` |
| CLI argument parser | `commander` |
| REPL input | `readline` (built-in Node.js) |
| Runtime target | Node.js 18+ |

---

## 11. Struktur Proyek

```
basominang/
├── src/
│   ├── lexer/
│   │   └── lexer.js          # Tokenizer
│   ├── parser/
│   │   └── parser.js         # Parser & Parse Tree
│   ├── ast/
│   │   └── ast.js            # AST Node definitions
│   ├── semantic/
│   │   └── semantic.js       # Semantic Analyzer
│   ├── optimizer/
│   │   └── optimizer.js      # Code Optimizer
│   ├── generator/
│   │   └── generator.js      # Code Generator (→ JS)
│   ├── cli/
│   │   └── cli.js            # CLI interface
│   ├── repl/
│   │   └── repl.js           # REPL mode interaktif
│   └── errors/
│       └── errors.js         # Error messages (Minang)
├── examples/
│   ├── hello.bm
│   ├── faktorial.bm
│   └── kondisi.bm
├── tests/
│   └── *.test.js
├── vscode-extension/
│   ├── package.json
│   ├── language-configuration.json
│   └── syntaxes/
│       └── basominang.tmLanguage.json
├── index.js                  # Entry point
├── package.json
└── README.md
```

---

## 12. Packaging & Distribusi

Compiler dibundel menjadi dua executable menggunakan `pkg` — keduanya identik, berbeda hanya nama alias:

```bash
# Build dua executable sekaligus
npx pkg index.js --targets node18-win-x64 --output dist/basominang.exe
npx pkg index.js --targets node18-win-x64 --output dist/bm.exe
```

Hasil:
- `basominang.exe` — alias panjang
- `bm.exe` — alias pendek

Keduanya dapat dijalankan langsung di Windows tanpa install Node.js.

### Cara Instalasi (User)

1. Download installer
2. Jalankan installer
3. `basominang` dan `bm` otomatis tersedia di PATH terminal
4. Buka terminal, ketik `bm --help`
5. Ketik `bm` saja untuk masuk mode REPL

---


## 12. VSCode Extension

### 12.1 Overview

BasoMinang menyediakan ekstensi VSCode resmi agar file `.bm` dapat dibaca dengan syntax highlighting yang proper di code editor.

### 12.2 Fitur Extension

| Fitur | Deskripsi |
|---|---|
| Syntax Highlighting | Keyword, string, number, boolean, komentar berwarna |
| Language Detection | File `.bm` otomatis dikenali sebagai BasoMinang |
| Comment Toggling | `Ctrl+/` untuk toggle komentar |
| Bracket Matching | Auto-match `{` `}` dan `(` `)` |
| Auto-closing | Kurung dan quote otomatis ditutup |

### 12.3 Warna Highlighting

| Elemen | Warna (Token) |
|---|---|
| Keyword (`buek`, `jiko`, dll) | Biru — `keyword.control` |
| Fungsi (`karajo`) | Kuning — `keyword.declaration` |
| String (`'teks'`) | Hijau — `string.quoted` |
| Number (`10`, `3.14`) | Oranye — `constant.numeric` |
| Boolean (`batua`, `salah`) | Ungu — `constant.language` |
| Komentar (`-{jan dibaco: }-`) | Abu-abu — `comment.block` |
| Identifier / variabel | Putih — default |
| Operator (`+`, `-`, `==`) | Cyan — `keyword.operator` |

### 12.4 Distribusi

Extension didistribusikan sebagai file `.vsix` yang dapat diinstall manual:

```
Extensions (Ctrl+Shift+X) → ··· → Install from VSIX → pilih basominang.vsix
```

---

## 13. Komponen Penilaian

| Komponen | Bobot | Status |
|---|---|---|
| Desain Bahasa / Grammar | 10% | ✅ Terdefinisi di PRD & TDD |
| Lexer | 15% | 🔲 Implementasi di TDD |
| Parser | 15% | 🔲 Implementasi di TDD |
| AST | 10% | 🔲 Implementasi di TDD |
| Semantic Analysis | 10% | 🔲 Implementasi di TDD |
| Code Optimization | 10% | 🔲 Implementasi di TDD |
| Code Generator | 10% | 🔲 Implementasi di TDD |
| Dokumentasi (Video 15 menit) | 20% | 🔲 Dibuat setelah implementasi |
| **Total** | **100%** | |

---

## 14. Timeline

| Fase | Kegiatan |
|---|---|
| Fase 1 | Desain bahasa, grammar, PRD & TDD |
| Fase 2 | Implementasi Lexer & Parser |
| Fase 3 | Implementasi AST & Semantic Analysis |
| Fase 4 | Implementasi Code Optimizer & Generator |
| Fase 5 | CLI, REPL, packaging `.exe`, testing |
| Fase 6 | Dokumentasi & rekaman video |
