const fs = require('fs');
let code = fs.readFileSync('src/app/book/[slug]/page.tsx', 'utf8');

// 1. Remove the welcome block
const lines = code.split('\n');
const startIdx = lines.findIndex(l => l.includes('── STEP 0: Welcome ──'));
const endIdx = lines.findIndex(l => l.includes('── OTHER STEPS ──'));
if (startIdx !== -1 && endIdx !== -1) {
  lines.splice(startIdx, endIdx - startIdx + 2); // Also removes 'OTHER STEPS' and '{step !== \'welcome\' && ('
}
// Remove the closing bracket of the OTHER STEPS block near the end
const closingIdx = lines.findLastIndex(l => l.trim() === ')}' && lines[l+1]?.trim() === '</div>' && lines[l+2]?.trim() === ');');
if (closingIdx !== -1) {
  lines.splice(closingIdx, 1);
}
code = lines.join('\n');

// 2. Fix the padding logic
code = code.replace(
  "padding: step === 'welcome' ? 0 : '3rem 1rem'",
  "padding: '3rem 1rem'"
);

// 3. Fix the !isWedding logic in the header
code = code.replace("{!isWedding && `${session.Duration_Minutes} Minutes `}", "{`${session.Duration_Minutes} Minutes `}");
code = code.replace("{session.Location ? (!isWedding ? `· ${session.Location}` : session.Location) : ''}", "{session.Location ? `· ${session.Location}` : ''}");

// 4. Fix the datetime back button
const datetimeBackStr = `{isWedding && session.Packages && session.Packages.length > 0 ? (
                <button onClick={() => setStep('packages')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><ChevronLeft size={18} /></button>
              ) : (
                <button onClick={() => setStep('welcome')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><ChevronLeft size={18} /></button>
              )}`;
code = code.replace(datetimeBackStr, "");

// 5. Fix the custom time picker for isWedding
const timePickerRegex = /\{\s*isWedding \? \([\s\S]*?\) : session\?\.Duration_Minutes === 0 \? \(/;
code = code.replace(timePickerRegex, "{session?.Duration_Minutes === 0 ? (");

// 6. Fix the packages step back button
code = code.replace(
  "<button onClick={() => isWedding ? setStep('welcome') : setStep('details')}",
  "<button onClick={() => setStep('details')}"
);

// 7. Fix the contract step back button
code = code.replace(
  "if (isWedding) setStep('details');\n                else if",
  "if"
);

fs.writeFileSync('src/app/book/[slug]/page.tsx', code);
console.log('Replacements complete.');
