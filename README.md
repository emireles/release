# :wrench: Release Tool

### Installation

1. Create a copy of `.env.example` called `.env`.
2. Define `DEFAULT_PR_REVIEWER` in `.env`.
3. Run `npm` and `npm link`.

### Available Commands

#### `release <patch | minor | major>`

Bumps the version of a package, opens a release branch, and commits the changes. The command does not push to the remote repository.

#### `release pr [reviewers...]`

Open a pull request for a release branch. A default reviewer can be defined using the  `.env` file.

##### Options

```
--reviewers string		GitHub username that will review the pull request.
```

