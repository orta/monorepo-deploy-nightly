import { PackageMetadata } from "../runner";
import axios from "axios"
import { join } from "path";
import { readFileSync, writeFileSync } from "fs";

export const bumpVersionVscode = async (md: PackageMetadata) => {
  const pkgPath = join(md.path, "package.json");
  const oldPackageJSON = JSON.parse(readFileSync(pkgPath, "utf8"));
  let version = oldPackageJSON.version
  try {
    const prod = await getBetaExtension(md.packageJSON.publisher, md.packageJSON.name)
    version = prod.versions[0].version;
  } catch (error) {
    console.log(`${md.name} is a new package, starting from version in package.json`) 
  }
  
  const semverMarkers = version.split(".");
  const newVersion = `${semverMarkers[0]}.${semverMarkers[1]}.${Number(semverMarkers[2]) + 1}`;

  oldPackageJSON.version = newVersion;
  writeFileSync(pkgPath, JSON.stringify(oldPackageJSON));
  console.log(`Updated ${md.name} to ${newVersion} from vscode marketplace`);
}

const getBetaExtension = async (org: string, name: string) => {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json;api-version=5.2-preview.1;excludeUrls=true",
    Host: "marketplace.visualstudio.com",
    Origin: "https://marketplace.visualstudio.com",
    Referer:
      // prettier-ignore
      `https://marketplace.visualstudio.com/search?term=svelte&category=All%20categories&vsVersion=&sortBy=Relevance`,
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.1 Safari/605.1.15",
    "Content-Length": "1082",
    Connection: "keep-alive",
    "X-TFS-Session": "e16c1b5b-850f-42ee-ab7c-519c79f6e356",
    "X-Requested-With": "XMLHttpRequest",
    "X-VSS-ReauthenticationAction": "Suppress",
  };
  const query = (name: string) =>
    `{"assetTypes":["Microsoft.VisualStudio.Services.Icons.Default","Microsoft.VisualStudio.Services.Icons.Branding","Microsoft.VisualStudio.Services.Icons.Small"],"filters":[{"criteria":[{"filterType":7,"value":"${name}"},{"filterType":12,"value":"37888"}],"direction":2,"pageSize":54,"pageNumber":1,"sortBy":0,"sortOrder":0,"pagingToken":null}],"flags":870}`;

  const extensionSearchResults = await axios({
    url:
      "https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery",
    method: "POST",
    headers: headers,
    data: query(`${org}.${name}`),
  });

  if (!extensionSearchResults.data || !extensionSearchResults.data.results) {
    throw new Error("Got a bad response from VS marketplace");
  }

  const extensions = extensionSearchResults.data.results[0].extensions[0];
  return extensions;
};
