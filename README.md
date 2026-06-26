# BasoMinang

<p align="center">
  <img src="assets/branding/basominang.png" alt="Icon BasoMinang" width="180">
</p>

**BasoMinang** adalah bahasa pemrograman mini bernuansa Minangkabau yang dikompilasi menjadi JavaScript. Proyek ini dibuat untuk memperlihatkan alur compiler lengkap: lexer, parser, AST, semantic analysis, optimizer, code generator, CLI, REPL, dan integrasi VS Code.

## Fitur

- File source berekstensi `.bm`
- Variabel dan konstanta
- Aritmatika, perbandingan, dan logika
- Kondisi `jiko`, `lain jiko`, dan `lain`
- Perulangan `salamo` dan `untuak`
- Fungsi, rekursi, `baliakan`, `baranti`, dan `lanjuik`
- Input terminal dengan `tanyo()` dan output dengan `cetak()`
- Template literal dengan backtick dan `${...}`
- REPL interaktif, installer Windows, serta syntax highlighting VS Code

## Instalasi Windows

Gunakan file installer `BasoMinang-Setup-1.0.0.exe` dari folder `installer-output`.

Setelah instalasi selesai, tutup dan buka kembali PowerShell atau Command Prompt. Perintah berikut akan tersedia secara global:

```powershell
bm --help
bm --version
```

## Menjalankan Program

Buat file, misalnya `halo.bm`:

```bm
buek namo = 'Urang Minang'
cetak(`Halo, ${namo}!`)
```

Jalankan file tersebut:

```powershell
bm run halo.bm
```

Untuk menghasilkan JavaScript tanpa langsung menjalankannya:

```powershell
bm compile halo.bm
```

> Gunakan `bm run` untuk program yang memakai `tanyo()`, karena input terminal disediakan oleh runtime BasoMinang.

## REPL Interaktif

Jalankan `bm` tanpa argumen:

```powershell
bm
```

Contoh sesi:

```text
>> buek namo = 'Rull'
>> cetak(`Halo, ${namo}!`)
Halo, Rull!
```

Perintah khusus REPL:

| Perintah | Fungsi |
|---|---|
| `kalua` | Keluar dari REPL |
| `cls` atau `clear` | Bersihkan layar dan riwayat terminal |
| `..` | Prompt otomatis saat blok, string, atau komentar belum selesai |

## Syntax Dasar

### Variabel dan Konstanta

`buek` membuat variabel yang dapat diubah. Nilai awal boleh dikosongkan.

```bm
buek namo
namo = 'Rull'

buek umur = 20
umur += 1
umur++
```

`tapek` membuat konstanta dan wajib langsung diberi nilai.

```bm
tapek pi = 3.14
```

Assignment yang tersedia:

```bm
nilai = 10
nilai += 5
nilai -= 2
nilai *= 3
nilai /= 2
nilai++
nilai--
```

### Nilai dan String

| BasoMinang | Nilai JavaScript |
|---|---|
| `batua` | `true` |
| `salah` | `false` |
| `kosong` | `null` |
| `datantu` | `undefined` |

String biasa memakai single quote:

```bm
buek pesan = 'Salam dari Minangkabau'
```

Template literal memakai backtick. Ekspresi di dalam `${...}` akan dievaluasi oleh compiler.

```bm
buek namo = 'Rull'
buek umur = 21
cetak(`Halo, ${namo}! Umur ang ${umur} taun.`)
```

Escape sequence yang didukung: `\n`, `\t`, `\r`, `\\`, dan `\'`.

```bm
cetak('Baris partamo\nBaris kaduo')
```

### Input dan Output

Gunakan `cetak(<nilai>)` untuk menampilkan nilai ke terminal.

```bm
cetak('Halo dunia')
cetak(10 + 5)
```

Gunakan `tanyo(<prompt>)` untuk menerima input teks dari pengguna. Hasilnya selalu berupa string.

```bm
buek namo = tanyo('Masuakkan namo: ')
cetak(`Halo, ${namo}!`)
```

### Operator

| Jenis | Operator |
|---|---|
| Aritmatika | `+`, `-`, `*`, `/`, `%` |
| Perbandingan | `==`, `!=`, `>`, `<`, `>=`, `<=` |
| Logika | `jo`, `atau`, `indak` |
| Assignment | `=`, `+=`, `-=`, `*=`, `/=` |
| Update | `++`, `--` |

Contoh:

```bm
jiko (nilai >= 75 jo indak salah) {
  cetak('Lulus')
}
```

### Kondisi

```bm
buek nilai = 85

jiko (nilai >= 90) {
  cetak('A')
} lain jiko (nilai >= 75) {
  cetak('B')
} lain {
  cetak('C')
}
```

### Perulangan `salamo`

```bm
buek i = 1

salamo (i <= 3) {
  cetak(`Putaran ka-${i}`)
  i++
}
```

### Perulangan `untuak`

```bm
untuak (i = 1; i <= 5; i++) {
  jiko (i == 3) {
    lanjuik
  }

  jiko (i == 5) {
    baranti
  }

  cetak(`Angko: ${i}`)
}
```

### Fungsi dan Rekursi

```bm
karajo tambah(a, b) {
  baliakan a + b
}

karajo faktorial(n) {
  jiko (n <= 1) {
    baliakan 1
  }

  baliakan n * faktorial(n - 1)
}

cetak(`10 + 5 = ${tambah(10, 5)}`)
cetak(`Faktorial 5 = ${faktorial(5)}`)
```

### Komentar

Komentar memakai bentuk berikut dan dapat lebih dari satu baris:

```bm
-{jan dibaco: Ini komentar satu baris}-

-{jan dibaco:
Ini komentar
multi-baris.
}-
```

## Contoh Program Lengkap

```bm
-{jan dibaco: Program sapaan dan perhitungan sederhana}-

buek namo = tanyo('Masuakkan namo: ')
buek nilai = 80

jiko (nilai >= 75) {
  cetak(`Selamat, ${namo}! Ang lulus jo nilai ${nilai}.`)
} lain {
  cetak(`Jan putuih asa, ${namo}. Coba baliak yo.`)
}
```

## Pesan Error

Compiler menampilkan pesan error berbahasa Minang lengkap dengan nomor baris dan penunjuk lokasi.

```text
nilai angko '900aa' indak sah, pareso baliak!

1 | buek nilai = 900aa
                 ^
```

Beberapa error yang akan dideteksi:

- Variabel atau fungsi belum dibuat
- Deklarasi ganda dalam scope yang sama
- Perubahan pada `tapek`
- Ketidaksesuaian tipe dasar
- Pembagian dengan nol literal
- `baliakan` di luar `karajo`
- `baranti` atau `lanjuik` di luar perulangan
- Kurung atau blok yang belum ditutup
- Literal angka tidak valid, misalnya `900aa`

## VS Code Extension

Install file `basominang-1.0.5.vsix` dari folder `vscode-extension`:

1. Buka VS Code.
2. Tekan `Ctrl+Shift+X`.
3. Klik menu `...`.
4. Pilih **Install from VSIX...**.
5. Pilih file `basominang-1.0.5.vsix`.
6. Reload VS Code.

Extension menyediakan syntax highlighting untuk keyword, operator, komentar, string, template literal, serta file `.bm`.

## Build dari Source

Prasyarat: Node.js 18+ dan Windows untuk menghasilkan executable/installer.

```powershell
npm install
npm test
npm run build
npm run installer
```

Perintah `npm run build` menghasilkan `dist\bm.exe` dan `dist\basominang.exe`. Perintah `npm run installer` menghasilkan installer di folder `installer-output`.

## Lisensi

Dibuat oleh Syahrul Efendi untuk proyek Teknik Kompilasi.
