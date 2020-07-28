import { PackageMetadata } from "../runner";

const { writeFileSync, readFileSync } = require("fs");
const { join } = require("path");

const axios = require("axios").default;

const getPackageVersion = async (packageMD: PackageMetadata) => {
  try {
    const npmInfo = await axios({ url: `https://registry.npmjs.org/${packageMD.name}`, method: "GET" });
    if (!npmInfo.data || !npmInfo.data._id) {
      throw new Error("Got a bad response from NPM");
    }
    return npmInfo.data['dist-tags'].latest;

  } catch (error) {
    console.log(`${packageMD.name} is a new package, starting from version in package.json`)
    const pkgPath = join(packageMD.path, "package.json");
    const oldPackageJSON = JSON.parse(readFileSync(pkgPath, "utf8"));
    return oldPackageJSON.version;
  }
};

const isPackageJSONVersionHigher = (packageJSONVersion: string, bumpedVersion: string) => {
  const semverMarkersPackageJSON = packageJSONVersion.split(".");
  const semverMarkersBumped = bumpedVersion.split(".");
  for (let i = 0; i < 3; i++) {
    if (Number(semverMarkersPackageJSON[i]) > Number(semverMarkersBumped[i])) {
      return true;
    }
  }

  return false;
}

const bumpPatch = (version: string) => {
  const semverMarkers = version.split(".");
  return `${semverMarkers[0]}.${semverMarkers[1]}.${Number(semverMarkers[2]) + 1}`;
}

export const bumpVersionNPM = async (packageMD: PackageMetadata) => {
  const version = await getPackageVersion(packageMD);
  if (!version) throw new Error("Could not find the npm version in the registry");

  const pkgPath = join(packageMD.path, "package.json");
  const packageJSON = JSON.parse(readFileSync(pkgPath, "utf8"));

  const newVersion = isPackageJSONVersionHigher(packageJSON.version, version)
    ? packageJSON.version
    : bumpPatch(version);

  packageJSON.version = newVersion;
  writeFileSync(pkgPath, JSON.stringify(packageJSON));

  console.log(`Updated ${packageMD.name} to ${newVersion} from npm`);
};
