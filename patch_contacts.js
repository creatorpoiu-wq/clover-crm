const fs = require('fs');

const path = 'src/app/dashboard/contacts/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove comm state
content = content.replace(/\/\/ Communication form state[\s\S]*?const \[loadingHistory, setLoadingHistory\] = useState\(false\);\n/, '');

// 2. Remove comm fetch logic
content = content.replace(/if \(commInquiryId\) \{[\s\S]*?\}, \[commInquiryId, commSuccess\]\);\n/, '');

// 3. Remove handleLogComm
content = content.replace(/const handleLogComm = async \(e: React\.FormEvent\) => \{[\s\S]*?setCommLoading\(false\);\n    \}\n  \};\n/, '');

// 4. Remove tab button
content = content.replace(/<button \n\s*onClick=\{\(\) => setActiveTab\("communication"\)\}[\s\S]*?<\/button>/, '');

// 5. Remove tab content
content = content.replace(/\{\/\* LOG COMMUNICATION TAB \*\/\}[\s\S]*?\{\/\* END LOG COMMUNICATION TAB \*\/\}|\{\/\* LOG COMMUNICATION TAB \*\/\}[\s\S]*?<\/div>\n          \)\}/, '');

fs.writeFileSync(path, content);
console.log('Done modifying contacts/page.tsx');
