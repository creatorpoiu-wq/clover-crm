const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');
const tableColumns = {};

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  
  // Find all .from('TableName').upsert({ ... }) or .insert({ ... }) or .update({ ... })
  // This regex is a simple heuristic.
  const regex = /\.from\(['"]([^'"]+)['"]\)\.(?:upsert|insert|update)\(\s*(?:\[\s*{|{)([^}]+)}/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const tableName = match[1];
    const objectBody = match[2];
    
    if (!tableColumns[tableName]) tableColumns[tableName] = new Set();
    
    // Extract keys
    const lines = objectBody.split('\n');
    lines.forEach(line => {
      const keyMatch = line.match(/^\s*([A-Za-z0-9_]+)\s*:/);
      if (keyMatch) {
        tableColumns[tableName].add(keyMatch[1]);
      }
    });
  }
});

for (const table in tableColumns) {
  console.log(`Table: ${table}`);
  Array.from(tableColumns[table]).forEach(col => console.log(`  - ${col}`));
}
