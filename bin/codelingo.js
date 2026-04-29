#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { createHarness, TASKS, listAgents } = require('../lib');

const COMMANDS = ['explain-file.md', 'change-impact.md', 'handoff.md'];
const PKG_COMMANDS = path.join(__dirname, '..', 'commands');

const args = process.argv.slice(2);
const cmd = args[0];

function install() {
  const dest = path.join(os.homedir(), '.claude', 'commands');
  fs.mkdirSync(dest, { recursive: true });

  for (const file of COMMANDS) {
    fs.copyFileSync(path.join(PKG_COMMANDS, file), path.join(dest, file));
    console.log(`  ✓ ${file}`);
  }

  console.log(`\nInstalled to ~/.claude/commands/`);
  console.log('\nAvailable commands in Claude Code:');
  console.log('  /explain-file <path>       — explain a source file');
  console.log('  /change-impact <path>      — blast radius before a change');
  console.log('  /handoff <path>            — generate a handoff document');
}

function uninstall() {
  const dest = path.join(os.homedir(), '.claude', 'commands');
  let removed = 0;

  for (const file of COMMANDS) {
    const target = path.join(dest, file);
    if (fs.existsSync(target)) {
      fs.unlinkSync(target);
      console.log(`  ✓ removed ${file}`);
      removed++;
    }
  }

  if (removed === 0) {
    console.log('No CodeLingo commands found in ~/.claude/commands/');
  } else {
    console.log('\nUninstalled.');
  }
}

function list() {
  const dest = path.join(os.homedir(), '.claude', 'commands');
  console.log('CodeLingo commands:');
  for (const file of COMMANDS) {
    const installed = fs.existsSync(path.join(dest, file));
    console.log(`  ${installed ? '✓' : '✗'} /${path.basename(file, '.md')}  ${installed ? '(installed)' : '(not installed)'}`);
  }
}

function listTasks() {
  console.log('CodeLingo harness tasks:');
  for (const task of Object.values(TASKS)) {
    const aliases = task.aliases.length > 0 ? ` (aliases: ${task.aliases.join(', ')})` : '';
    console.log(`  ${task.id}${aliases}`);
    console.log(`    ${task.description}`);
    console.log(`    agents: ${task.agents.join(' -> ')}`);
  }
}

function listAgentPrompts() {
  console.log('CodeLingo agents:');
  for (const agent of listAgents()) {
    console.log(`  ${agent.id}`);
    console.log(`    ${agent.description}`);
    console.log(`    ${agent.path}`);
  }
}

function parseRunArgs(runArgs) {
  const parsed = {
    task: runArgs[0],
    filePath: runArgs[1],
    change: undefined,
    language: undefined,
    skillLevel: undefined,
    audience: undefined,
    printPrompt: false,
  };

  for (let index = 2; index < runArgs.length; index++) {
    const arg = runArgs[index];
    const next = runArgs[index + 1];

    if (arg === '--change') {
      parsed.change = next;
      index++;
    } else if (arg === '--language') {
      parsed.language = next;
      index++;
    } else if (arg === '--skill' || arg === '--skill-level') {
      parsed.skillLevel = next;
      index++;
    } else if (arg === '--audience') {
      parsed.audience = next;
      index++;
    } else if (arg === '--print-prompt') {
      parsed.printPrompt = true;
    } else if (!parsed.change && (parsed.task === 'change-impact' || parsed.task === 'impact')) {
      parsed.change = arg;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return parsed;
}

function runHarness(runArgs) {
  const options = parseRunArgs(runArgs);
  if (!options.task || !options.filePath) {
    console.error('Usage: codelingo run <task> <file> [--change "..."] [--language en|ko|ja|zh] [--skill beginner|familiar|expert] [--audience "..."] [--print-prompt]');
    console.error('');
    listTasks();
    process.exit(1);
  }

  const harness = createHarness({ cwd: process.cwd() });
  const result = harness.prepareRun({
    task: options.task,
    filePath: options.filePath,
    change: options.change,
    language: options.language,
    skillLevel: options.skillLevel,
    audience: options.audience,
    write: !options.printPrompt,
  });

  if (result.status === 'excluded') {
    console.error(`Skipped ${result.file}: ${result.reason}`);
    process.exit(2);
  }

  if (options.printPrompt) {
    console.log(result.prompt);
    return;
  }

  console.log(`Prepared ${result.taskId} harness run.`);
  console.log(`  Source: ${result.file}`);
  console.log(`  Agents: ${result.agents.join(' -> ')}`);
  console.log(`  Prompt: ${result.runPath}`);
  console.log(`  Expected output: ${result.outputPath}`);
}

function help() {
  console.log('codelingo <command>');
  console.log('');
  console.log('Commands:');
  console.log('  install     Copy slash commands to ~/.claude/commands/');
  console.log('  uninstall   Remove slash commands from ~/.claude/commands/');
  console.log('  list        Show which commands are installed');
  console.log('  agents      Show available role prompts');
  console.log('  tasks       Show available harness tasks');
  console.log('  run         Prepare a harness run prompt for a source file');
  console.log('  help        Show this help');
  console.log('');
  console.log('Examples:');
  console.log('  codelingo run explain-file src/utils/scheduler.py --language ko --skill familiar');
  console.log('  codelingo run change-impact src/utils/scheduler.py --change "Add retry limit"');
  console.log('  codelingo run handoff src/utils/scheduler.py --audience "external developer"');
}

switch (cmd) {
  case 'install':
  case undefined:
    install();
    break;
  case 'uninstall':
    uninstall();
    break;
  case 'list':
    list();
    break;
  case 'agents':
    listAgentPrompts();
    break;
  case 'tasks':
    listTasks();
    break;
  case 'run':
    try {
      runHarness(args.slice(1));
    } catch (err) {
      console.error(err.message);
      process.exit(1);
    }
    break;
  case 'help':
  case '--help':
  case '-h':
    help();
    break;
  default:
    console.error(`Unknown command: ${cmd}`);
    help();
    process.exit(1);
}
