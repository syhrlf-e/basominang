# BasoMinang

<p align="center">
  <img src="assets/branding/basominang.png" alt="BasoMinang logo" width="180">
</p>

<p align="center">
  <a href="https://github.com/syhrlf-e/basominang">
    <img alt="Version" src="https://img.shields.io/badge/version-1.0.0-2f80ed?style=for-the-badge">
  </a>
  <img alt="Node.js" src="https://img.shields.io/badge/node.js-%3E%3D18-339933?style=for-the-badge&logo=node.js&logoColor=white">
  <img alt="Platform" src="https://img.shields.io/badge/platform-Windows-0078d4?style=for-the-badge&logo=windows&logoColor=white">
  <img alt="Tests" src="https://img.shields.io/badge/tests-passing-22c55e?style=for-the-badge">
  <img alt="Language" src="https://img.shields.io/badge/language-BasoMinang-f59e0b?style=for-the-badge">
</p>

**BasoMinang** adalah mini programming language bernuansa Minangkabau yang dikompilasi menjadi JavaScript. Project ini menyediakan compiler pipeline lengkap, command-line interface, mode interaktif, installer Windows, dan extension Visual Studio Code untuk file `.bm`.

## Highlights

- Source file dengan ekstensi `.bm`
- Compiler pipeline: lexer, parser, AST, semantic analyzer, optimizer, dan code generator
- Variabel, konstanta, operator aritmatika, perbandingan, dan logika
- Control flow: `jiko`, `lain jiko`, `lain`, `salamo`, dan `untuak`
- Function, recursion, `baliakan`, `baranti`, dan `lanjuik`
- Input/output terminal melalui `tanyo()`, `tanyo.nomor()`, dan `cetak()`
- Template literal dengan backtick dan interpolasi `${...}`
- Error message dengan nomor baris dan penunjuk lokasi
- REPL, Windows installer, executable portable, dan VS Code syntax highlighting

## Quick Start

Install BasoMinang menggunakan installer Windows dari halaman release:

[Download release](https://github.com/syhrlf-e/basominang/releases)

Setelah instalasi selesai, buka terminal baru lalu jalankan:

```powershell
bm --version
bm --help
```

Buat file `hello.bm`:

```bm
buek pengguna = 'Minang'
cetak(`Halo, ${pengguna}!`)
```

Jalankan program:

```powershell
bm run hello.bm
```

Output:

```text
Halo, Minang!
```

## CLI

```text
Usage: bm [options] [command] [arguments]
       bm run <file.bm>
       bm compile <file.bm>
       bm

Options:
  -h, --help, -help      tampilkan panduan penggunaan BasoMinang
  -V, --version          tampilkan versi BasoMinang

Commands:
  run <file.bm>          compile dan jalankan file .bm
  compile <file.bm>      compile file .bm menjadi file .js
```

### Run

```powershell
bm run program.bm
```

### Compile to JavaScript

```powershell
bm compile program.bm
```

Command tersebut akan menghasilkan file `program.js`.

### REPL

Jalankan `bm` tanpa command:

```powershell
bm
```

Contoh sesi:

```text
>> buek pesan = 'Halo dunia'
>> cetak(pesan)
Halo dunia
```

Perintah khusus REPL:

| Command | Description |
|---|---|
| `kalua` | Keluar dari REPL |
| `cls` / `clear` | Membersihkan layar dan riwayat terminal |
| `..` | Prompt lanjutan saat blok, string, atau komentar belum selesai |

## Language Guide

### Variables and Constants

`buek` digunakan untuk membuat variabel yang dapat diubah.

```bm
buek pesan = 'Halo'
cetak(pesan)

pesan = 'Halo BasoMinang'
cetak(pesan)
```

Variabel juga dapat dibuat tanpa nilai awal.

```bm
buek hasil
hasil = 100
cetak(hasil)
```

`tapek` digunakan untuk membuat konstanta.

```bm
tapek pi = 3.14
cetak(pi)
```

### Input and Output

`cetak()` menampilkan output ke terminal.

```bm
cetak('Halo dunia')
cetak(10 + 5)
```

`tanyo()` menerima input teks.

```bm
buek nama = tanyo('Masukkan nama: ')
cetak(`Halo, ${nama}!`)
```

`tanyo.nomor()` menerima input angka.

```bm
buek nilai = tanyo.nomor('Masukkan nilai: ')

jiko (nilai >= 75) {
  cetak('Lulus')
} lain {
  cetak('Belum lulus')
}
```

### Data Values

| BasoMinang | JavaScript Target |
|---|---|
| `batua` | `true` |
| `salah` | `false` |
| `kosong` | `null` |
| `datantu` | `undefined` |

### Strings and Template Literals

String biasa menggunakan single quote.

```bm
buek pesan = 'Salam dari BasoMinang'
```

Template literal menggunakan backtick dan mendukung interpolasi `${...}`.

```bm
buek nama = 'Pengguna'
buek nilai = 90

cetak(`Halo, ${nama}. Nilai kamu ${nilai}.`)
```

Escape sequence yang didukung: `\n`, `\t`, `\r`, `\\`, dan `\'`.

```bm
cetak('Baris pertama\nBaris kedua')
```

### Operators

| Category | Operators |
|---|---|
| Arithmetic | `+`, `-`, `*`, `/`, `%` |
| Comparison | `==`, `!=`, `>`, `<`, `>=`, `<=` |
| Logic | `jo`, `atau`, `indak` |
| Assignment | `=`, `+=`, `-=`, `*=`, `/=` |
| Update | `++`, `--` |

### Conditions

```bm
buek nilai = 85

jiko (nilai >= 90) {
  cetak('A')
} lain jiko (nilai >= 80) {
  cetak('B')
} lain {
  cetak('C')
}
```

### Loops

`salamo` digunakan untuk while loop.

```bm
buek i = 1

salamo (i <= 3) {
  cetak(`Putaran ${i}`)
  i++
}
```

`untuak` digunakan untuk for loop.

```bm
untuak (i = 1; i <= 5; i++) {
  jiko (i == 3) {
    lanjuik
  }

  cetak(`Angka ${i}`)
}
```

### Functions

```bm
karajo tambah(a, b) {
  baliakan a + b
}

cetak(tambah(10, 5))
```

Recursion:

```bm
karajo faktorial(n) {
  jiko (n <= 1) {
    baliakan 1
  }

  baliakan n * faktorial(n - 1)
}

cetak(faktorial(5))
```

### Comments

```bm
-{jan dibaco: komentar satu baris}-

-{jan dibaco:
komentar
multi-baris
}-
```

## Complete Example

```bm
-{jan dibaco: Program penilaian sederhana}-

buek nama = tanyo('Masukkan nama: ')
buek nilai = tanyo.nomor('Masukkan nilai: ')

jiko (nilai >= 80) {
  cetak(`Halo ${nama}, predikat kamu A.`)
} lain jiko (nilai >= 70) {
  cetak(`Halo ${nama}, predikat kamu B.`)
} lain jiko (nilai >= 60) {
  cetak(`Halo ${nama}, predikat kamu C.`)
} lain {
  cetak(`Halo ${nama}, predikat kamu D.`)
}

cetak(`Nilai akhir: ${nilai}`)
```

## Error Reporting

BasoMinang menampilkan error dengan pesan, nomor baris, dan penunjuk lokasi.

```text
nilai angko '900aa' indak sah, pareso baliak!

1 | buek nilai = 900aa
                 ^
```

Error yang dideteksi antara lain:

- Variabel atau fungsi belum dideklarasikan
- Deklarasi ganda dalam scope yang sama
- Assignment ke konstanta `tapek`
- Ketidaksesuaian tipe dasar
- Pembagian dengan nol literal
- `baliakan` di luar function
- `baranti` atau `lanjuik` di luar loop
- Kurung atau blok yang belum ditutup
- Literal angka tidak valid

## VS Code Extension

Extension BasoMinang menyediakan syntax highlighting untuk file `.bm`, termasuk keyword, operator, komentar, string, template literal, dan function call.

Install dari file VSIX yang tersedia di halaman release:

[Download VSIX](https://github.com/syhrlf-e/basominang/releases)

Langkah instalasi:

1. Buka Visual Studio Code.
2. Buka tab Extensions.
3. Klik menu `...`.
4. Pilih **Install from VSIX...**.
5. Pilih file `basominang-1.0.5.vsix`.
6. Reload Visual Studio Code jika diperlukan.

## Build from Source

Requirements:

- Node.js 18+
- Windows untuk build executable dan installer
- Inno Setup untuk membuat installer Windows

Install dependencies:

```powershell
npm install
```

Run tests:

```powershell
npm test
```

Build executable:

```powershell
npm run build
```

Build installer:

```powershell
npm run installer
```

Output build lokal:

| Path | Description |
|---|---|
| `dist/bm.exe` | Executable utama |
| `dist/basominang.exe` | Alias executable |
| `installer-output/BasoMinang-Setup-1.0.0.exe` | Installer Windows |
| `vscode-extension/basominang-1.0.5.vsix` | VS Code extension package |

## Project Structure

```text
basominang/
├─ assets/               branding assets
├─ examples/             sample .bm programs
├─ installer/            Inno Setup script
├─ scripts/              build utilities
├─ src/                  compiler, CLI, runner, and REPL source
├─ tests/                automated tests
└─ vscode-extension/     VS Code syntax highlighting extension
```

## Status

BasoMinang is actively developed as a compact language/compiler project. The current release focuses on a stable core language, CLI workflow, Windows distribution, and editor integration.
