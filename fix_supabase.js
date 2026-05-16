const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('./src');
let changedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('@/utils/supabase/server')) {
        let changed = false;
        // Replace `const supabase = createClient();` with `const supabase = await createClient();`
        if (content.includes('const supabase = createClient();')) {
            content = content.replace(/const supabase = createClient\(\);/g, 'const supabase = await createClient();');
            changed = true;
        }
        if (content.includes('let supabase = createClient();')) {
            content = content.replace(/let supabase = createClient\(\);/g, 'let supabase = await createClient();');
            changed = true;
        }
        
        if (changed) {
            fs.writeFileSync(file, content, 'utf8');
            console.log('Fixed', file);
            changedCount++;
        }
    }
});
console.log('Total fixed:', changedCount);
