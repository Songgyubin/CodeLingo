const fs = require('fs');
const path = require('path');

const DEFAULT_CONFIG = {
  language: 'en',
};

function configPath(cwd) {
  return path.join(cwd, '.codelingo', 'config.json');
}

function readConfig(cwd) {
  const target = configPath(cwd);
  if (!fs.existsSync(target)) {
    return { ...DEFAULT_CONFIG };
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(target, 'utf8'));
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch (_err) {
    return { ...DEFAULT_CONFIG };
  }
}

function mergeConfig(cwd, updates) {
  const dir = path.join(cwd, '.codelingo');
  fs.mkdirSync(dir, { recursive: true });

  const current = readConfig(cwd);
  const next = { ...current, ...updates };
  fs.writeFileSync(configPath(cwd), `${JSON.stringify(next, null, 2)}\n`);
  return next;
}

module.exports = {
  readConfig,
  mergeConfig,
};
