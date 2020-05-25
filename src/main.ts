import * as core from '@actions/core'
import {wait} from './wait'
import { execSync } from 'child_process'

async function run(): Promise<void> {
  try {
    const since = core.getInput('since') || "1 day ago"
    
    const files = execSync(`git log --pretty=format: --name-only --since="${since}"`,  { encoding: "utf8" })
    console.log(files)

    // core.debug(new Date().toTimeString())
    // await wait(parseInt(ms, 10))
    // core.debug(new Date().toTimeString())

    // core.setOutput('time', new Date().toTimeString())
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
