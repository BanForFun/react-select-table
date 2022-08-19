const fs = require('node:fs')
const path = require('node:path')
const { files } = require('./package.json')

const destDir = path.join(__dirname, '/package')

fs.rmSync(destDir, { recursive: true })
fs.mkdirSync(destDir)

for (const file of files.concat('package.json'))
  fs.cpSync(file, path.join(destDir, file), { recursive: true })

console.log('Built package')
