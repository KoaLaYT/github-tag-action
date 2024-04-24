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

    const prBranch: string =
      github.context.payload.pull_request?.head?.ref ?? ''
    const prBody: string = github.context.payload.pull_request?.body ?? ''
    core.info(`PR branch is ${prBranch}`)
    core.info(`PR body is ${prBody}`)

    const latestTag = await getLatestTag()
    core.info(`Latest tag is ${JSON.stringify(latestTag)}`)

    let newTag = ''
    if (!latestTag) {
      newTag = 'v0.0.1'
    } else {
      newTag = bumpVersion({ tag: latestTag, branch: prBranch, body: prBody })
    }

    core.info(`Bump tag ${latestTag || '-'} to ${newTag}`)

    await exec.exec(`git tag -a "${newTag}" -m "${newTag} Release"`)
    await exec.exec(`git push --tags`)
    // Set outputs for other workflow steps to use
    core.setOutput('new_tag', newTag)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}

const bumpConfig = {
  branch: {
    minor: ['feat/', 'feature/'],
    patch: ['fix/', 'hotfix/', 'bugfix/']
  }
}

function bumpVersion({
  tag,
  branch,
  body
}: {
  tag: string
  branch: string
  body: string
}) {
  let [major, minor, patch] = tag.slice(1).split('.')

  do {
    // body's #major take highest pirority
    if (body.includes('#major')) {
      major = `${Number(major) + 1}`
      break
    }

    // branch likes feat/xxx etc...
    if (bumpConfig.branch.minor.some(it => branch.startsWith(it))) {
      minor = `${Number(minor) + 1}`
      break
    }

    // branch likes fix/xxx etc...
    if (bumpConfig.branch.patch.some(it => branch.startsWith(it))) {
      patch = `${Number(patch) + 1}`
      break
    }

    // strange branch name ?
    // default to bump patch
    patch = `${Number(patch) + 1}`
  } while (false)

  return `v${major}.${minor}.${patch}`
}

async function getLatestTag() {
  try {
    await exec.exec('git fetch --tags')
    const result = await exec.getExecOutput(
      'git describe --tags "$(git rev-list --tags --max-count=1)"'
    )
    if (result.exitCode === 0) {
      return result.stdout
    }
  } catch (error) {
    return ''
  }
}
