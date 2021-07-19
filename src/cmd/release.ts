import path from 'path';

import fse from 'fs-extra';
import { inc } from 'semver';
import type { ReleaseType } from 'semver';

import { exec, getRepoName } from '../utils';

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

  // Pull latest changes.
  await exec('git', ['checkout', 'develop'], cwd);
  await exec('git', ['pull'], cwd);

  // Bump version in package.json.
  const packageFile = path.join(cwd, 'package.json');
  const packageJson = await fse.readJson(packageFile);
  const nextVersion = packageJson?.version
    ? inc(packageJson.version, argv.type)
    : '1.0.0';

  packageJson.version = nextVersion;

  await fse.writeJson(packageFile, packageJson, { spaces: 2 });

  // Bump all device types.
  const deviceTypesDir = path.join(cwd, 'device-types');
  const hasDeviceTypes = fse.existsSync(deviceTypesDir);

  if (hasDeviceTypes) {
    const deviceTypes = await fse.readdir(deviceTypesDir);

    await Promise.all(
      deviceTypes.map(async (dir) => {
        const attributesFile = path.join(
          deviceTypesDir,
          dir,
          'attributes.json'
        );

        const attributes = await fse.readJson(attributesFile);

        attributes.driver_type.version = nextVersion;

        await fse.writeJson(attributesFile, attributes, { spaces: 2 });
      })
    );
  }

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

  // Create release branch and commit changes.
  await exec('git', ['checkout', '-b', `release/v${nextVersion}`], cwd);
  await exec(
    'git',
    [
      'add',
      'package.json',
      'CHANGELOG.md',
      ...(hasDeviceTypes ? ['device-types/*/attributes.json'] : []),
    ],
    cwd
  );
  await exec('git', ['commit', '-m', `v${nextVersion}`], cwd);
};
