import * as core from '@actions/core'
import * as github from '@actions/github'
import * as exec from '@actions/exec'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    // const ms: string = core.getInput('milliseconds')

    const prBranch = github.context.payload.pull_request?.head?.ref ?? ''
    const prBody = github.context.payload.pull_request?.body ?? ''
    core.info(`PR branch is ${prBranch}`)
    core.info(`PR body is ${prBody}`)

    const latestTag = exec.getExecOutput(
      'git describe --tags "$(git rev-list --tags --max-count=1)"'
    )
    core.info(`Latest tag is ${latestTag}`)

    // Set outputs for other workflow steps to use
    // core.setOutput('time', new Date().toTimeString())
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
