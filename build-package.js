const fs = require('node:fs')
const path = require('node:path')
const { files } = require('./package.json')

// Don't delete the whole package folder, because that breaks docker volumes
for (const srcPath of files.concat('package.json')) {
  const destPath = path.join(__dirname, '/package', srcPath)
  fs.rmSync(destPath, { recursive: true })
  fs.cpSync(srcPath, destPath, { recursive: true })
}

console.log('Built package')
