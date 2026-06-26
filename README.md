# BasoMinang

Compiler untuk bahasa pemrograman mini berbasis Bahasa Minangkabau. Source file
memakai ekstensi `.bm` dan dikompilasi menjadi JavaScript.

## Status Pengembangan

Compiler pipeline, CLI, REPL, contoh program, dan extension VS Code telah tersedia.

## Penggunaan

```bash
npm install
npm start -- --help
npm start -- run examples/hello.bm
npm start -- compile examples/faktorial.bm
```

Menjalankan `npm start` tanpa argumen membuka REPL. Ketik `kalua` untuk keluar.

## Build Distribusi

```bash
npm run build
cd vscode-extension
npx @vscode/vsce package
```

Executable akan berada di `dist/`, sedangkan extension berada di
`vscode-extension/basominang-1.0.0.vsix`.

## Menjalankan Test

```bash
npm test
```

Spesifikasi produk dan teknis awal tersedia di folder `context_project/`.
