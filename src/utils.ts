import execa from 'execa';

const MAIN_BRANCHES_RE = /remotes\/origin\/(?<branch>develop|main|master)$/;

export const exec = (
  bin: string,
  args: Array<string>,
  cwd: string
): Promise<execa.ExecaReturnValue> =>
  execa(bin, args, {
    cwd,
    buffer: false,
    stdout: 'inherit',
    stderr: 'inherit',
  });

export const getBranches = async (cwd: string): Promise<Array<string>> => {
  const branches = await execa('git', ['branch', '-a'], { cwd, all: true });

  if (!branches.all) {
    throw new Error(`Could not get all branches.`);
  }

  return branches.all.split('\n').map((branch) => branch.replace(/^\*? +/, ''));
};

export const getMainBranches = async (cwd: string): Promise<string[]> => {
  const branches = await getBranches(cwd);

  return branches
    .map((branch) => branch.match(MAIN_BRANCHES_RE))
    .reduce(
      (arr, match) =>
        match && match.groups?.branch ? arr.concat([match.groups.branch]) : arr,
      [] as string[]
    );
};

export const getCurrentBranch = async (cwd: string): Promise<string> => {
  const branch = await execa('git', ['branch', '--show-current'], {
    cwd,
    all: true,
  });

  if (!branch.all) {
    throw new Error(`Could not get current branch.`);
  }

  return branch.all;
};

export const getRepoName = async (cwd: string): Promise<string> => {
  const remote = await execa('git', ['config', '--get', 'remote.origin.url'], {
    cwd,
    all: true,
  });

  const match = remote.all?.match(/labforward\/(?<repoName>.*)\.git/);

  if (!match || !match.groups?.repoName) {
    throw new Error(`Could not get repo name in "${remote.all}".`);
  }

  return match.groups.repoName;
};
