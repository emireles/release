import execa from 'execa';

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

  if (branches.all)
    return branches.all
      .split('\n')
      .map((branch) => branch.replace(/^\*? +/, ''));

  throw new Error(`Could not get all branches.`);
};

export const getCurrentBranch = async (cwd: string): Promise<string> => {
  const branch = await execa('git', ['branch', '--show-current'], {
    cwd,
    all: true,
  });

  if (branch.all) return branch.all;

  throw new Error(`Could not get current branch.`);
};

export const getRepoName = async (cwd: string): Promise<string> => {
  const remote = await execa('git', ['config', '--get', 'remote.origin.url'], {
    cwd,
    all: true,
  });

  const match = remote.all?.match(/labforward\/(?<repoName>.*)\.git/);

  if (match && match.groups?.repoName) return match.groups.repoName;

  throw new Error(`Could not get repo name in \`${remote.all}\``);
};
