import axios from 'axios'
import {join} from 'path'
import {readFileSync, writeFileSync} from 'fs'
import {PackageMetadata} from '../runner'

export const bumpVersionOpenVsx = async (md: PackageMetadata) => {
  const pkgPath = join(md.path, 'package.json')
  const oldPackageJSON = JSON.parse(readFileSync(pkgPath, 'utf8'))
  let version = oldPackageJSON.version
  try {
    const prod = await getPackageVersion(
      md.packageJSON.publisher,
      md.packageJSON.name
    )
    version = prod.version
  } catch (error) {
    console.log(
      `${md.name} is a new package, starting from version in package.json`
    )
  }

  const semverMarkers = version.split('.')
  const newVersion = `${semverMarkers[0]}.${semverMarkers[1]}.${Number(
    semverMarkers[2]
  ) + 1}`

  oldPackageJSON.version = newVersion
  writeFileSync(pkgPath, JSON.stringify(oldPackageJSON))
  console.log(`Updated ${md.name} to ${newVersion} from OpenVsx marketplace`)
}

const getPackageVersion = async (namespace: string, name: string) => {
  const query = `${namespace}.${name}`

  const extensionSearchResults = await axios({
    url: `https://open-vsx.org/api/-/search?query=${query}&offset=0&size=10&sortBy=relevance&sortOrder=desc`,
    method: 'GET'
  })

  if (!extensionSearchResults.data || !extensionSearchResults.data.extensions) {
    throw new Error('Got a bad response from marketplace')
  }

  const foundExtension = extensionSearchResults.data.extensions.find((extension: any) => {
      return extension.name === name && extension.namespace === namespace
    }
  )

  if (!foundExtension) {
    throw new Error('Extension not found in the marketplace query')
  }

  return foundExtension
}
