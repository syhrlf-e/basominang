# BasoMinang — VSCode Extension

Syntax highlighting resmi untuk bahasa pemrograman **BasoMinang** (`.bm`) — bahasa pemrograman berbasis Bahasa Minangkabau.

## Fitur

- ✅ Syntax highlighting lengkap (keyword, string, number, boolean, komentar, operator)
- ✅ Otomatis deteksi file `.bm`
- ✅ Auto-closing bracket `{ }` dan `( )`
- ✅ Auto-closing single quote `'`
- ✅ Indentasi otomatis
- ✅ Toggle komentar dengan `Ctrl+/` (block comment)

## Cara Install

1. Download file `basominang-1.0.0.vsix`
2. Buka VSCode
3. Tekan `Ctrl+Shift+X` untuk buka Extensions
4. Klik ikon `···` di pojok kanan atas
5. Pilih **"Install from VSIX..."**
6. Pilih file `basominang-1.0.0.vsix`
7. Reload VSCode
8. Buka file `.bm` — syntax highlighting langsung aktif!

## Contoh Kode

```bm
-{jan dibaco: Ini program faktorial dalam BasoMinang}-

karajo faktorial(n) {
    jiko (n <= 1) {
        baliakan 1
    }
    baliakan n * faktorial(n - 1)
}

buek angko = 5
buek hasil = faktorial(angko)
cetak('Faktorial dari ' + angko + ' adolah ' + hasil)
```

## Keyword yang Didukung

| Keyword | Fungsi |
|---|---|
| `buek` | Deklarasi variabel |
| `tapek` | Deklarasi konstanta |
| `cetak` | Print ke terminal |
| `jiko` | If |
| `lain` | Else |
| `salamo` | While loop |
| `untuak` | For loop |
| `karajo` | Deklarasi fungsi |
| `baliakan` | Return |
| `batua` | true |
| `salah` | false |
| `kosong` | null |
| `datantu` | undefined |
| `jo` | and |
| `atau` | or |
| `indak` | not |
| `baranti` | break |
| `lanjuik` | continue |

## Build dari Source

```bash
npm install -g @vscode/vsce
cd vscode-extension
vsce package
```

---

Dibuat untuk tugas akhir Teknik Kompilasi — Universitas Pamulang
