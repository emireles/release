import path from 'path';

import fse from 'fs-extra';

import { exec, getBranches, getCurrentBranch } from '../utils';

interface Arguments {
  readonly [x: string]: unknown;
  readonly reviewers: Array<string>;
}

const MAIN_BRANCHES_RE = /remotes\/origin\/(?<branch>develop|main|master)$/;
const RELEASE_RE = /^release\/v(.*)$/;

export const command = 'pr [reviewers..]';
export const describe = 'Open pull-requests for a release branch.';
export const builder = {
  reviewers: {
    describe: 'GitHub users to review the pull-request.',
    type: 'array',
    demandOption: true,
    ...(process.env.DEFAULT_PR_REVIEWER
      ? {
          default: process.env.DEFAULT_PR_REVIEWER,
        }
      : {}),
  },
};

// eslint-disable-next-line max-statements
export const handler = async (argv: Arguments): Promise<void> => {
  const cwd = process.cwd();

  const currentBranch = await getCurrentBranch(cwd);

  if (!RELEASE_RE.test(currentBranch))
    throw new Error('Command requires a release branch.');

  const packageFile = path.join(cwd, 'package.json');
  const { version } = await fse.readJson(packageFile);
  const branches = await getBranches(cwd);
  const reviewers = argv.reviewers
    .map((reviewer) => ['--reviewer', reviewer])
    .flat();

  const prMessage = `### Release v${version}`;

  await branches
    .map((branch) => branch.match(MAIN_BRANCHES_RE))
    .reduce(
      (lastTarget, target) =>
        lastTarget.then(async () => {
          if (target && target.groups?.branch) {
            const { branch } = target.groups;

            console.log(`${branch}`);
            await exec(
              'gh',
              [
                'pr',
                'create',
                '--title',
                `Release v${version}`,
                '--body',
                prMessage,
                '--base',
                branch,
                ...reviewers,
              ],
              cwd
            );
          }
        }),
      Promise.resolve()
    );
};
