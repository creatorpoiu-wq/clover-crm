const fs = require('fs');

const file = 'src/app/dashboard/contacts/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Find the start of the grid
const gridStart = content.indexOf('{/* Main Layout Grid */}');

// Let's replace the whole tabs structure safely
// I will output the file from line 400 to 650 to see it properly.
const lines = content.split('\n');
console.log(lines.slice(395, 420).join('\n'));
console.log('---');
console.log(lines.slice(515, 530).join('\n'));
console.log('---');
console.log(lines.slice(610, 625).join('\n'));
