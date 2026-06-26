'use strict'

const ERROR_MESSAGES = Object.freeze({
  E01: (line, keyword = null) => keyword
    ? `ado salah di barih ${line}: '${keyword}' paralu nilai, jan kosong!`
    : `ado salah di barih ${line}: syntax indak sah, pareso baliak!`,
  E02: (name) => `variabel '${name}' indak ado, buek dulu yo!`,
  E03: (line) => `ado salah di barih ${line}: tipe data indak samo, pareso baliak!`,
  E04: (name) => `karajo '${name}' indak ado, buek dulu yo!`,
  E05: (line, closing = '}') => `ado salah di barih ${line}: kuruang indak ditutuik, tambahan '${closing}'!`,
  E06: (line, name) => `ado salah di barih ${line}: '${name}' adalah tapek, indak bisa dirubah!`,
  E07: (line) => `ado salah di barih ${line}: indak bisa bagi jo nol!`,
  E08: (line) => `ado salah di barih ${line}: 'baliakan' hanyo bisa di dalam 'karajo'!`,
  E09: (line) => `ado salah di barih ${line}: 'baranti' hanyo bisa di dalam perulangan!`,
  E10: (line) => `ado salah di barih ${line}: 'lanjuik' hanyo bisa di dalam perulangan!`,
  E11: (name) => `variabel '${name}' alah ado, ganti namo yo!`,
  E12: (name) => `file '${name}' indak ado, pareso pathnyo!`,
  E13: (extension) => `file paralu ekstensi .bm, bukan '${extension}'!`
})

function getErrorMessage(code, ...args) {
  const factory = ERROR_MESSAGES[code]

  if (!factory) {
    throw new Error(`Kode error tidak dikenal: ${code}`)
  }

  return factory(...args)
}

module.exports = { ERROR_MESSAGES, getErrorMessage }
