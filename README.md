### Monorepo Deploy Nightly

Deploy projects which have changed on a nightly basis. You might not need this [pleb](https://github.com/wixplosives/pleb) might provide everything you need.

This will look in `packages/*` for packages which have _any_ changes based on the [`since` option in git](https://www.git-scm.com/docs/git-log#_commit_limiting):
 
 - Packages marked 'private' are ignored
 - Packages with vscode in engines are:
   - deployed via [`vsce`](https://code.visualstudio.com/api/working-with-extensions/publishing-extension) when there is a `VSCE_TOKEN` in the env
   - deployed via [`ovsx`](https://www.npmjs.com/package/ovsx) when there is a `OVSX_TOKEN` in the env

It will grab the latest semver number from either npm or the vscode marketplace, and then bump it by a patch. For npm, if the project's `package.json` version is higher than that on npm, it will use that version instead.

```yml
name: Deploy Daily Builds

# For testing
# on: push

# For production
on:
  schedule:
    - cron: "0 4 * * *"

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v1
        with:
          registry-url: "https://registry.npmjs.org"

      # Ensure everything is compiling
      - run: "yarn install"
      - run: "yarn build"

      # Shipit
      - uses: orta/monorepo-deploy-nightly@master
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
          VSCE_TOKEN: ${{ secrets.AZURE_PAN_TOKEN }}
```

For a weekly deploy, with npm installs and a custom sort order:

```yml
      - uses: orta/monorepo-deploy-nightly@master
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
          VSCE_TOKEN: ${{ secrets.AZURE_PAN_TOKEN }}
        with: 
          since: '1 week ago'
          sort: '["one", "three", "two"]'
          install: 'true'
```


### TODO

For a build where a specific file changing in the build triggers a deploy

```yml
      - uses orta/monorepo-deploy-nightly@master
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
          VSCE_TOKEN: ${{ secrets.AZURE_PAN_TOKEN }}
        with: 
          since: '1 week ago'
          changed: "relative/path/to/file/from/package'
```
