import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { inspectGlb } from './inventory-glb.mjs';
import { ASSETS, SOURCE_DIRECTORY } from '../assets/js/showroom-catalog.js';

// The input directory is read-only. Archived models are never imported.
const project = resolve(import.meta.dirname, '..');
mkdirSync(resolve(project, 'public/models'), { recursive: true });
const inventory = [];
for (const asset of ASSETS) {
  const source = resolve(SOURCE_DIRECTORY, asset.source);
  const target = resolve(project, 'public/models', asset.file);
  if (!existsSync(source)) throw new Error(`Missing ${source}`);
  copyFileSync(source, target);
  const sha256 = createHash('sha256').update(readFileSync(target)).digest('hex');
  if (sha256 !== createHash('sha256').update(readFileSync(source)).digest('hex')) throw new Error('Import checksum mismatch');
  inventory.push({ id: asset.id, source, ...inspectGlb(target), sha256 });
}
writeFileSync(resolve(project, 'Context/ASSET_INVENTORY.json'), JSON.stringify(inventory, null, 2));
console.log(`Imported exactly ${inventory.length} authorized models (${(inventory.reduce((n,a)=>n+a.bytes,0)/1e6).toFixed(2)} MB total).`);
