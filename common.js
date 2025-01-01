const os = require('os');
const path = require('path');
const github = require('@actions/github');
const core = require('@actions/core');

let _cached_version = null;
async function getVersion() {
  if (_cached_version != null) {
    return _cached_version;
  }

  _cached_version = core.getInput('version');

  return _cached_version;
}

async function getTarballName() {
  const version = await getVersion();
  // https://github.com/c3lang/c3c/releases/download/latest/c3-linux.tar.gz

  return {
    linux:  `${version}/c3-linux`,
    darwin: `${version}/c3-macos`,
    win32:  `${version}/c3-windows`,
  }[os.platform()];
}

async function getTarballExt() {
  return {
    linux:  '.tar.gz',
    darwin: '.zip',
    win32:  '.zip',
  }[os.platform()];
}

async function getCachePrefix() {
  const tarball_name = await getTarballName();
  const job_name = github.context.job.replaceAll(/[^\w]/g, "_");
  return `setup-zig-cache-${job_name}-${tarball_name}-`;
}

async function getTarballCachePath() {
  return path.join(process.env['RUNNER_TEMP'], await getTarballName());
}

module.exports = {
  getVersion,
  getTarballName,
  getTarballExt,
  getCachePrefix,
  getTarballCachePath,
};
