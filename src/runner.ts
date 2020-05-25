// This file does the real work, you can test it locally via 
// 
// node lib/runner.js

import { execSync } from "child_process"
import { EOL } from "os"
import {sep, join} from "path"
import { readFileSync } from "fs"

type RunSettings = {
  since: string
  cwd: string
}

type PackageMetadata = {
  path: string
  dirname: string
  name: string
  packageJSON: any
  isPrivate: boolean
  type: "npm" | "vscode"
}

export const run = async (settings: RunSettings) => {
  console.log("Looking up git")
  const files = execSync(`git log --pretty=format: --name-only --since="${settings.since}"`,  { encoding: "utf8", cwd: settings.cwd })
  
  const changedPackages = getChangedPackages(files)
  const packageMetadata = getPackageMetadata(changedPackages, settings)
  deploy(packageMetadata)
}

function deploy(pacakgeMetadata: Set<PackageMetadata>) {
  
}

function getPackageMetadata(changedPackages: Set<string>, settings: RunSettings) {
  const packageMetadata = new Set<PackageMetadata>()

  changedPackages.forEach(packagePath => {
    const root = join(settings.cwd, "packages", packagePath)

    const packageJSONPath = join(root, "package.json")
    const json = JSON.parse(readFileSync(packageJSONPath, "utf8"))


    const isVSCode = json && json.engines && json.engines.vscode
    const type = isVSCode ? "vscode" : "npm"
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
    if (!path.length)
      return

    const dirs = path.split(sep)

    if (dirs[0] !== "packages")
      return
    if (dirs.length < 2)
      return

    changedPackages.add(dirs[1])
  })
  return changedPackages
}

if (!module.parent) {
  run({ since: "30 day ago", cwd: "../language-tools" })
}
