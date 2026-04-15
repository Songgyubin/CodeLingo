#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

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

function help() {
  console.log('codelingo <command>');
  console.log('');
  console.log('Commands:');
  console.log('  install     Copy slash commands to ~/.claude/commands/');
  console.log('  uninstall   Remove slash commands from ~/.claude/commands/');
  console.log('  list        Show which commands are installed');
  console.log('  help        Show this help');
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
