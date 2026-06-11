const fs = require('fs');
const path = require('path');
const seedFile = path.join(__dirname, 'backend', 'seeders', 'datosCompletos.seeder.js');
const text = fs.readFileSync(seedFile, 'utf8');
const regex = /imagen:\s*'([^']+)'/g;
const images = [];
let m;
while ((m = regex.exec(text)) !== null) images.push(m[1]);
const actualFiles = [];
const walk = (dir, prefix = '') => {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, prefix + name + '/');
    else actualFiles.push(prefix + name);
  }
};
walk(path.join(__dirname, 'frontend', 'public', 'images'));
const normalize = s => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-.]/g, '').replace(/-+/g, '-').replace(/(^-|-$)/g, '').toLowerCase();
const actualNorm = actualFiles.map(f => ({ orig: f, norm: normalize(f) }));
const findBest = img => {
  const candidate = normalize(img);
  const exact = actualNorm.filter(a => a.norm === candidate).map(a => a.orig);
  if (exact.length) return exact[0];
  const prefix = actualNorm.filter(a => a.norm.includes(candidate) || candidate.includes(a.norm)).map(a => a.orig);
  if (prefix.length) return prefix[0];
  const distances = actualNorm.map(a => {
    const b = a.norm;
    const dp = Array.from({ length: candidate.length + 1 }, (_, i) => Array(b.length + 1).fill(0));
    for (let i = 0; i <= candidate.length; i++) dp[i][0] = i;
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= candidate.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        dp[i][j] = Math.min(dp[i-1][j] + 1, dp[i][j-1] + 1, dp[i-1][j-1] + (candidate[i-1] === b[j-1] ? 0 : 1));
      }
    }
    return { orig: a.orig, d: dp[candidate.length][b.length] };
  });
  distances.sort((x, y) => x.d - y.d);
  return distances[0].orig;
};
const notFound = [];
for (const img of images) {
  const candidate = normalize(img);
  if (!actualNorm.some(a => a.norm === candidate)) {
    notFound.push({ img, best: findBest(img) });
  }
}
console.log(JSON.stringify(notFound, null, 2));
