import * as core from '@actions/core'
import * as github from '@actions/github'
import * as exec from '@actions/exec'
import type { PullRequestEvent } from '@octokit/webhooks-definitions/schema'

/**
 * The main function for the action.
 */
export async function run(): Promise<void> {
  try {
    if (github.context.eventName !== 'pull_request') {
      throw new Error(`This action can only be used in pull_request event`)
    }
    const payload = github.context.payload as PullRequestEvent
    const prBranch: string = payload.pull_request.head.ref
    const prTitle: string = payload.pull_request.title
    core.info(`PR branch is ${prBranch}`)
    core.info(`PR title  is ${prTitle}`)

    const latestTag = await getLatestTag()
    core.info(`Latest tag is ${latestTag}`)

    let newTag = ''
    if (!latestTag) {
      newTag = 'v0.0.1'
    } else {
      newTag = bumpVersion({ tag: latestTag, branch: prBranch, title: prTitle })
    }

    core.info(`Bump tag ${latestTag || '-'} to ${newTag}`)

    await exec.exec(`git tag -f "${newTag}"`)
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
  title
}: {
  tag: string
  branch: string
  title: string
}): string {
  let [major, minor, patch] = tag.slice(1).split('.')

  do {
    // title's #major take highest pirority
    if (title.includes('#major')) {
      major = `${Number(major) + 1}`
      minor = `0`
      patch = `0`
      break
    }

    // branch likes feat/xxx etc...
    if (bumpConfig.branch.minor.some(it => branch.startsWith(it))) {
      minor = `${Number(minor) + 1}`
      patch = `0`
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
  } while (
    // eslint-disable-next-line no-constant-condition
    false
  )

  return `v${major}.${minor}.${patch}`
}

async function getLatestTag(): Promise<string> {
  await exec.exec('git fetch --tags')
  const result = await exec.getExecOutput(
    `git for-each-ref --sort=-v:refname --format '%(refname:lstrip=2)'`
  )
  if (result.exitCode !== 0) {
    throw new Error(`exitCode: ${result.exitCode}, err: ${result.stderr}`)
  }

  let raw = result.stdout.split('\n')[0].trim()
  if (raw.startsWith("'")) raw = raw.slice(1)
  if (raw.endsWith("'")) raw = raw.slice(0, -1)

  if (!/^v[0-9]+.[0-9]+.[0-9]+$/.test(raw)) return ''
  return raw
}
