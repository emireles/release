import path from 'path';

import fse from 'fs-extra';
import { inc } from 'semver';
import type { ReleaseType } from 'semver';

import { exec, getMainBranches, getRepoName } from '../utils';

interface Arguments {
  readonly [x: string]: unknown;
  readonly type: ReleaseType;
}

export const command = '$0 <type>';
export const describe = 'Bump a package and create a release branch.';
export const builder = {
  type: {
    describe: 'Desired version bump.',
    choices: ['patch', 'minor', 'major'],
    demandOption: true,
  },
};

// eslint-disable-next-line max-statements
export const handler = async (argv: Arguments): Promise<void> => {
  const cwd = process.cwd();

  // Pull latest changes in main/master and develop.
  const branches = await getMainBranches(cwd);

  await branches.reduce(
    (lastPromise, branch) =>
      lastPromise.then(async () => {
        await exec('git', ['fetch', 'origin', branch], cwd);
        await exec('git', ['checkout', branch], cwd);
        await exec('git', ['pull'], cwd);
      }),
    Promise.resolve()
  );

  // Bump version in package.json.
  const packageFile = path.join(cwd, 'package.json');
  const packageJson = await fse.readJson(packageFile);
  const nextVersion = packageJson?.version
    ? inc(packageJson.version, argv.type)
    : '1.0.0';

  packageJson.version = nextVersion;

  await fse.writeJson(packageFile, packageJson, { spaces: 2 });

  // Create a release section in CHANGELOG.md.
  const changelogFile = path.join(cwd, 'CHANGELOG.md');
  const changelog = await fse.readFile(changelogFile, 'utf-8');
  const repoName = await getRepoName(cwd);
  const [today] = new Date().toISOString().split('T');

  await fse.writeFile(
    changelogFile,
    changelog.replace(
      '## [Unreleased]',
      `## [Unreleased]

### Added

### Changed

### Deprecated

### Fixed

### Removed

## [v${nextVersion}](https://github.com/labforward/${repoName}/releases/tag/v${nextVersion}) - ${today}`
    )
  );

  // All repos should contain one production branch.
  // Most repositories either have main or master, but not both.
  const mainBranch = branches.find(
    (branch) => branch === 'main' || branch === 'master'
  );

  // Create release branch.
  await exec('git', ['checkout', '-b', `release/v${nextVersion}`], cwd);

  // Sync release branch with production branch.
  if (mainBranch) {
    await exec('git', ['merge', mainBranch], cwd);
  }

  // Commit changes.
  await exec('git', ['add', 'package.json', 'CHANGELOG.md'], cwd);
  await exec('git', ['commit', '-m', `v${nextVersion}`], cwd);
};
