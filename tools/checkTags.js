const fs = require('fs');
const path = require('path');
const csvPath = path.join(__dirname, '..', 'config', 'tags.csv');
if (!fs.existsSync(csvPath)) {
  console.error('tags.csv not found');
  process.exit(2);
}
const data = fs.readFileSync(csvPath, 'utf8');
const lines = data.split(/\r?\n/).filter(Boolean);
console.log('Loaded', lines.length, 'tag lines (showing first 10):');
for (let i = 0; i < Math.min(10, lines.length); i++) {
  console.log(lines[i]);
}
// simple search
const queries = ['girl', 'highres', 'fantasy', 'notatag'];
for (const q of queries) {
  const matches = lines.filter(l => l.toLowerCase().includes(q.toLowerCase()));
  console.log(`query='${q}', matches=${matches.length}`);
}
