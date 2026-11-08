import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
test('format-specific importer produces an offline request plan',()=>{const output=execFileSync(process.execPath,['example.mjs'],{encoding:'utf8'});assert.match(output,/integrations/);assert.doesNotMatch(output,/Bearer [A-Za-z0-9_-]{20}/);});
