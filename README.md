# github-tag-action

[![MIT License](https://img.shields.io/github/license/KoaLaYT/github-tag-action)](https://github.com/KoaLaYT/github-tag-action/blob/main/LICENSE)
[![GitHub Release](https://img.shields.io/github/v/release/KoaLaYT/github-tag-action)](https://github.com/KoaLaYT/github-tag-action/releases/latest)

A GitHub Action to automatically bump and tag master, on merge, with the latest
SemVer formatted version.

## Usage

```yaml
# example: on merge to master from pull request
name: Bump version
on:
  pull_request:
    types:
      - closed
    branches:
      - master

jobs:
  build:
    if: github.event.pull_request.merged == true
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.pull_request.merge_commit_sha }}
          fetch-depth: '0'

      - name: Bump version and push tag
        uses: KoaLaYT/github-tag-action@v1 # Don't use @master or @v1 unless you're happy to test the latest version
```

### Outputs

- **new_tag** - The value of the newly created tag.

> **_Note:_** This action creates a
> [lightweight tag](https://developer.github.com/v3/git/refs/#create-a-reference).

### Bumping

**Manual Bumping:** If PR title contains `#major`

**Automatic Bumping:** If PR title does not contains `#major`, it will bump
based on PR's branch name.

1. Bump `minor` if branch name starts with `feat/` or `feature/`.
2. Bump `patch` if branch name starts with `fix/`, `hotfix/` or `bugfix/`.
3. Other branch names will fallback to 2.

### Workflow

- Add this action to your repo
- Commit some changes
- Open a PR and on merge, the action will:
  - Get latest tag
  - Bump tag based on your branch name, unless the PR title contains `#major`
  - Pushes tag to GitHub

### Credits

- [anothrNick/github-tag-action](https://github.com/anothrNick/github-tag-action)
