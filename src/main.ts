import * as core from '@actions/core'
import {RunSettings, runDeployer} from './runner'

async function run(): Promise<void> {
  try {
    const since = core.getInput('since') || '1 day ago'
    const cwd = core.getInput('cwd') || '.'
    const sort = core.getInput('sort') ? JSON.parse(core.getInput('sort')) : []
    const install = !!core.getInput('install') || false
    const only = core.getInput('only')
      ? JSON.parse(core.getInput('only'))
      : undefined
    const preview = !!core.getInput('preview') || false

    const settings: RunSettings = {
      since,
      cwd,
      sort,
      install,
      only,
      preview
    }

    await runDeployer(settings)
  } catch (error) {
    const err = error as any
    core.setFailed(err.message)
  }
}

run()
