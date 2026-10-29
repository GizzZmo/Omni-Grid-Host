import { createWriteStream } from 'node:fs';
import { mkdir, readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { crc32 } from 'node:zlib';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public', 'download');
const outFile = path.join(outDir, 'Omni-Grid-Host.zip');
const skip = new Set(['node_modules', 'dist', 'web-static', '.git', 'download']);

async function walk(dir, prefix = '') {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (skip.has(entry.name) || entry.name.endsWith('.tsbuildinfo')) continue;
    const abs = path.join(dir, entry.name);
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...await walk(abs, rel));
    else if (entry.isFile()) files.push({ abs, rel: rel.replaceAll('\\', '/') });
  }
  return files;
}

function u16(n) {
  const b = Buffer.alloc(2);
  b.writeUInt16LE(n);
  return b;
}
function u32(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n >>> 0);
  return b;
}

const files = await walk(root);
await mkdir(outDir, { recursive: true });
const parts = [];
const central = [];
let offset = 0;
const now = new Date();
const time = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
const date = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();

for (const file of files) {
  const data = await readFile(file.abs);
  const name = Buffer.from(`Omni-Grid-Host/${file.rel}`);
  const crc = crc32(data) >>> 0;
  const local = Buffer.concat([
    u32(0x04034b50), u16(20), u16(0), u16(0), u16(time), u16(date),
    u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0),
    name, data,
  ]);
  parts.push(local);
  central.push(Buffer.concat([
    u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(time), u16(date),
    u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0),
    u16(0), u16(0), u16(0), u32(0), u32(offset), name,
  ]));
  offset += local.length;
}

const centralDir = Buffer.concat(central);
const end = Buffer.concat([
  u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length),
  u32(centralDir.length), u32(offset), u16(0),
]);
await new Promise((resolve, reject) => {
  const stream = createWriteStream(outFile);
  stream.on('error', reject);
  stream.on('finish', resolve);
  for (const part of parts) stream.write(part);
  stream.end(Buffer.concat([centralDir, end]));
});
console.log(`packed ${files.length} files -> ${outFile}`);
