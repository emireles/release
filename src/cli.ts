#!/usr/bin/env node

import path from 'path';

import chalk from 'chalk';
import { config } from 'dotenv';
import fse from 'fs-extra';
import yargs from 'yargs';

config({ path: path.join(__dirname, '../.env') }); // Relative to dist/

const { version } = fse.readJsonSync(path.join(__dirname, '../package.json'));

console.log(chalk`{cyan.bold Release Tool} {cyan v${version}\n}`);

yargs.commandDir('./cmd').help().strict();

(() => yargs.argv)();
