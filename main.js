const path = require('path');
const fs = require('fs').promises;
const core = require('@actions/core');
const tc = require('@actions/tool-cache');
const cache = require('@actions/cache');
const common = require('./common');

// The base URL of the official builds of Zig. This is only used as a fallback, if all mirrors fail.
const CANONICAL = 'https://github.com/c3lang/c3c/releases/download';

async function downloadTarball(tarball_name, tarball_ext) {
  const url = `${CANONICAL}/${tarball_name}${tarball_ext}?source=github-actions`
  core.info(`\turl: ${url}`)
  const tarball_path = await tc.downloadTool(url);
  return tarball_path
}

async function retrieveTarball(tarball_name, tarball_ext) {
  const cache_key = `setup-c3-tarball-${tarball_name}`;
  const tarball_cache_path = await common.getTarballCachePath();

  if (await cache.restoreCache([tarball_cache_path], cache_key)) {
    return tarball_cache_path;
  }

  core.info(`Cache miss. Fetching C3 ${await common.getVersion()}`);
  const downloaded_path = await downloadTarball(tarball_name, tarball_ext);

  const parent_dir = path.dirname(tarball_cache_path)
    
  // Ensure the parent directory exists
  await fs.mkdir(parent_dir, { recursive: true });

  await fs.copyFile(downloaded_path, tarball_cache_path)
  await cache.saveCache([tarball_cache_path], cache_key);
  return tarball_cache_path;
}

async function main() {
  try {
    // We will check whether C3 is stored in the cache. We use two separate caches.
    // * 'tool-cache' caches the final extracted directory if the same Zig build is used multiple
    //   times by one job. We have this dependency anyway for archive extraction.
    // * 'cache' only caches the unextracted archive, but it does so across runs. It's a little
    //   less efficient, but still much preferable to fetching Zig from a mirror. We have this
    //   dependency anyway for caching the global Zig cache.

    let c3_dir = tc.find('c3', await common.getVersion());
    if (!c3_dir) {
      const tarball_name = await common.getTarballName();
      const tarball_ext = await common.getTarballExt();

      core.info(`Fetching ${tarball_name}${tarball_ext}`);
      const fetch_start = Date.now();
      const tarball_path = await retrieveTarball(tarball_name, tarball_ext);
      core.info(`fetch took ${Date.now() - fetch_start} ms`);

      core.info(`Extracting tarball ${tarball_name}${tarball_ext}`);

      const extract_start = Date.now();
      const c3_parent_dir = tarball_ext === '.zip'
        ? await tc.extractZip(tarball_path)
        : await tc.extractTar(tarball_path, null, 'x'); // J for xz
      core.info(`extract took ${Date.now() - extract_start} ms`);
      core.info(`extracted '${tarball_path}' to '${c3_parent_dir}'`);

      const c3_inner_dir = path.join(c3_parent_dir, 'c3');
      c3_dir = await tc.cacheDir(c3_inner_dir, 'c3', await common.getVersion());
    }

    core.addPath(c3_dir);
  } catch (err) {
    core.setFailed(err.message);
  }
}

main();
