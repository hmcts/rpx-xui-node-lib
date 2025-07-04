# Cleanup README: Repository Secrets Cleanup

This guide details the steps to remove secrets from our Git repositories using the `git-filter-repo` tool.

## Useful Resources

- [Git Filter-Repo Documentation](https://htmlpreview.github.io/?https://github.com/newren/git-filter-repo/blob/docs/html/git-filter-repo.html)
- [Replacing Text with Git Filter-Repo](https://htmlpreview.github.io/?https://github.com/newren/git-filter-repo/blob/docs/html/git-filter-repo.html#_content_based_filtering)
- [GitHub’s Guide on Removing Sensitive Data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)

## Preparation

* Perform cleanup during low repository activity to minimize disruption.

* For WIP feature branches created _before_ cleanup, developers must locally record commit SHAs. After cleanup, these commits must be cherry-picked onto a new feature branch created from a fresh, post-cleanup clone of the repo.

```bash
git checkout my-feature-branch
git log --oneline
# Note each relevant SHA in chronological order
```
---

## Installing Git-Filter-Repo

Run the following command (for mac) if not already installed:

```bash
brew install git-filter-repo
```

Ensure the installation was successful:

```bash
git filter-repo --version
```

## Backup Repo

Ensure you have a full backup of the repository prior to running the tool.

Create a backup folder on your local machine:

```bash
mkdir ~/repo-backups
cd ~/repo-backups
```

Create a clone of the repo locally:

```bash
git clone --mirror <repo-url> repo-backup.git
```

## Execution

Navigate to the repository folder on your local:

```bash
cd path/to/target/repo
```

Add the `secrets-to-remove.txt` file (found in the `Attachments` section of the Jira ticket) to the root of the repo directory.

Sanity check to confirm the repo has the correct remote URL configured:

```bash
git remote -v
```

> [!TIP]
> The repo username and name should look like:
>
> origin git@github.com:hmcts/rpx-xui-node-lib.git (fetch)
> origin git@github.com:hmcts/rpx-xui-node-lib.git (push)

Run the following command to replace secrets in your repository:

```bash
git filter-repo --replace-text secrets-to-remove.txt
```

After the script has been run:

Confirm removals by running this command for each secret string, it should return no commits:

```bash
git log -S"${SECRET_STRING}" --all -p —
```

Once happy, push changes to remote (force push required):

*optional* dry run sanity check:

```bash
git push --force --dry-run origin <branch-name>
```

Command to push changes to remote:

```bash
git push --force origin <branch-name>
```

## Post Cleanup Actions

* Immediately inform all team members upon completion of cleanup.
* All users of that repo must then discard their local clone and clone a fresh copy of the repository:

```bash
git clone <repo-url>
```

* WIP branches can then be recreated by cherry picking stored commit SHA's onto a new branch off the fresh clone:

```bash
git checkout -b <new-feature-branch> origin/main
git cherry-pick <SHA1> <SHA2> <SHA3>
```

## CI/CD Pipeline Verification

* Verify CI/CD pipelines immediately post-cleanup to ensure they operate correctly with the updated repository.
* Update this documentation for post cleanup actions that are missing
