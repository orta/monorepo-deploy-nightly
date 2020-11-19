export const bumpPatch = (version: string) => {
  const semverMarkers = version.split('.')
  return `${semverMarkers[0]}.${semverMarkers[1]}.${Number(semverMarkers[2]) +
    1}`
}

export const isPackageJSONVersionHigher = (
  packageJSONVersion: string,
  bumpedVersion: string
) => {
  const semverMarkersPackageJSON = packageJSONVersion.split('.')
  const semverMarkersBumped = bumpedVersion.split('.')
  for (let i = 0; i < 3; i++) {
    if (Number(semverMarkersPackageJSON[i]) > Number(semverMarkersBumped[i])) {
      return true
    }
  }

  return false
}
