import * as core from '@actions/core'
import {RunSettings, runDeployer} from './runner'

async function run(): Promise<void> {
  try {
    const since = core.getInput('since') || '1 day ago'
    const cwd = core.getInput('cwd') || '.'

    const settings: RunSettings = {
      since,
      cwd
    }

    await runDeployer(settings)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
