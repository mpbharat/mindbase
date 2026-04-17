#!/usr/bin/env node
import { Command } from 'commander';
import { runContext } from './context.js';
import { runSave } from './save.js';

const program = new Command();

program
  .name('brain-cli')
  .description('Brain session hooks for Claude Code and Hermes')
  .version('1.0.0');

program
  .command('context')
  .description('Fetch brain context and print for session injection')
  .action(runContext);

program
  .command('save')
  .description('Save session summary and memories on session end')
  .requiredOption('--summary <text>', 'One sentence: what was done this session')
  .option('--memory <text>', 'Key memory to store (can repeat)', collect, [])
  .option('--next <text>', 'What to do next session')
  .option('--duration <minutes>', 'Session duration in minutes', '60')
  .action(runSave);

function collect(val: string, prev: string[]): string[] {
  return prev.concat([val]);
}

program.parse();
