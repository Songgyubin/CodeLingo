const { createHarness, prepareRun } = require('./harness');
const { shouldExclude } = require('./fileGuard');
const { TASKS, normalizeTaskId, outputPathFor, buildPrompt } = require('./tasks');
const { readConfig, mergeConfig } = require('./config');
const { listAgents, loadAgent, loadAgents } = require('./agents');

module.exports = {
  createHarness,
  prepareRun,
  shouldExclude,
  TASKS,
  normalizeTaskId,
  outputPathFor,
  buildPrompt,
  readConfig,
  mergeConfig,
  listAgents,
  loadAgent,
  loadAgents,
};
