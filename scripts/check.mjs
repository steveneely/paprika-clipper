import { readFile, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';

const manifest = JSON.parse(await readFile('extension/manifest.json', 'utf8'));
assert.equal(manifest.manifest_version, 3);
assert.deepEqual(manifest.host_permissions, ['https://www.paprikaapp.com/*']);
for (const name of await readdir('extension')) {
  if (name.endsWith('.js')) execFileSync(process.execPath, ['--check', `extension/${name}`]);
}
for (const file of [manifest.background.service_worker, manifest.action.default_popup,
  ...Object.values(manifest.icons),
  ...manifest.content_scripts.flatMap(script => script.js)]) await readFile(`extension/${file}`);
console.log('Manifest paths, permissions, and JavaScript syntax checked.');
