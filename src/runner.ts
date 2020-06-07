// This file does the real work, you can test it locally via
//
// node lib/runner.js

import {execSync} from 'child_process'
import {EOL} from 'os'
import {sep, join} from 'path'
import {readFileSync} from 'fs'
import {bumpVersionVscode} from './bumping/vscode'
import {bumpVersionNPM} from './bumping/npm'
import { Settings } from 'http2'

export type RunSettings = {
  since: string
  cwd: string
  sort: [],
  install: boolean
}

export type PackageMetadata = {
  path: string
  dirname: string
  name: string
  packageJSON: any
  isPrivate: boolean
  type: 'npm' | 'vscode'
}

export const runDeployer = async (settings: RunSettings) => {
  console.log(`Looking at changes in ${settings.cwd} since ${settings.since}`)

  const files = execSync(
    `git log --pretty=format: --name-only --since="${settings.since}"`,
    {encoding: 'utf8', cwd: settings.cwd}
  )

  const changedPackages = getChangedPackages(files)
  const packageMetadata = getPackageMetadata(changedPackages, settings)
  console.log("Found the following packages with changes: ", [...packageMetadata].map(m => m.name))
  
  const deployablePackages = filterPackages(packageMetadata)
  await bumpVersions(deployablePackages)
  await deploy(deployablePackages, settings)
}

async function deploy(packageMetadata: Set<PackageMetadata>, settings: RunSettings) {
  const packages = sortedPackages(packageMetadata, settings.sort);

  for (const packageMD of packages) {
    if (settings.install) {
      console.log(`\n\n# npm installing for ${packageMD.name}.`)
      execSync(`npm install`, { encoding: 'utf8', cwd: packageMD.path, stdio: 'inherit' })
    }

    console.log(`\n\n# Deploying ${packageMD.name}.`)
    if (packageMD.type === 'vscode') {
      execSync(`npx vsce publish --yarn -p ${process.env.VSCE_TOKEN}`, {
        encoding: 'utf8',
        cwd: packageMD.path,
        stdio: 'inherit'
      })
    } else if (packageMD.type === 'npm') {
      execSync(`npm publish`, { encoding: 'utf8', cwd: packageMD.path, stdio: 'inherit' })
    }
  }
}

async function bumpVersions(packageMetadata: Set<PackageMetadata>) {
  console.log("Bumping versions:")
  for (const packageMD of packageMetadata) {
    if (packageMD.type === 'vscode') {
      await bumpVersionVscode(packageMD)
    } else if (packageMD.type === 'npm') {
      await bumpVersionNPM(packageMD)
    }
  }
}

function filterPackages(packageMetadata: Set<PackageMetadata>) {
  const deployable = new Set<PackageMetadata>()
  const removedForPrivate: string[] = []

  packageMetadata.forEach(md => {
    if (md.isPrivate) {
      removedForPrivate.push(md.name)
      return
    }
    
    deployable.add(md)
  })

  if (removedForPrivate.length) {
    console.log(`Removed ${removedForPrivate.length} for being private modules`)
  }

  return deployable
}

function getPackageMetadata(
  changedPackages: Set<string>,
  settings: RunSettings
) {
  const packageMetadata = new Set<PackageMetadata>()

  changedPackages.forEach(packagePath => {
    const root = join(settings.cwd, 'packages', packagePath)

    const packageJSONPath = join(root, 'package.json')
    const json = JSON.parse(readFileSync(packageJSONPath, 'utf8'))

    const isVSCode = json && json.engines && json.engines.vscode
    const type = isVSCode ? 'vscode' : 'npm'
    const isPrivate = json.private

    packageMetadata.add({
      path: root,
      name: json.name,
      packageJSON: json,
      type,
      isPrivate,
      dirname: packagePath
    })
  })

  return packageMetadata
}

function getChangedPackages(files: string) {
  const changedPackages = new Set<string>()
  files.split(EOL).forEach(path => {
    if (!path.length) return

    const dirs = path.split(sep)

    if (dirs[0] !== 'packages') return
    if (dirs.length < 2) return

    changedPackages.add(dirs[1])
  })
  return changedPackages
}

function sortedPackages(packageMetadata: Set<PackageMetadata>, sort: string[]) {
  const items = [...packageMetadata]

  items.sort(function(a, b){  
    return sort.indexOf(a.name) - sort.indexOf(b.name);
  });

  return items
}

if (require.main === module) {
  console.log("Running with 30 days")
  runDeployer({since: '30 day ago', cwd: '../language-tools', install: true, sort: []})
}
