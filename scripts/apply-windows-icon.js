'use strict'

const fs = require('node:fs')
const path = require('node:path')
const { Data, NtExecutable, NtExecutableResource, Resource } = require('@shockpkg/resedit')

const projectRoot = path.resolve(__dirname, '..')
const iconPath = path.join(projectRoot, 'assets', 'branding', 'basominang.ico')
const executablePaths = ['bm.exe', 'basominang.exe']
  .map((name) => path.join(projectRoot, 'dist', name))

function toArrayBuffer(buffer) {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
}

function applyIcon(executablePath, iconFile) {
  const executable = NtExecutable.from(toArrayBuffer(fs.readFileSync(executablePath)), { ignoreCert: true })
  const resources = NtExecutableResource.from(executable)

  Resource.IconGroupEntry.replaceIconsForResource(
    resources.entries,
    1,
    1033,
    iconFile.icons.map(({ data }) => data)
  )
  resources.outputResource(executable)
  fs.writeFileSync(executablePath, Buffer.from(executable.generate()))
}

function main() {
  if (!fs.existsSync(iconPath)) throw new Error(`Icon tidak ditemukan: ${iconPath}`)

  const iconFile = Data.IconFile.from(toArrayBuffer(fs.readFileSync(iconPath)))
  for (const executablePath of executablePaths) {
    if (!fs.existsSync(executablePath)) throw new Error(`Executable tidak ditemukan: ${executablePath}`)
    applyIcon(executablePath, iconFile)
    console.log(`Icon diterapkan: ${path.relative(projectRoot, executablePath)}`)
  }
}

main()
