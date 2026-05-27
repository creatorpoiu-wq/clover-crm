const fs = require('fs');
const file = 'src/app/dashboard/contacts/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace grid start
let s1 = `      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
          
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">`;
let r1 = `      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
        
        {/* Left Column (Tab Contents) */}
        <div className="lg:col-span-2 space-y-8">
          
          {activeTab === 'overview' && (
            <div className="space-y-8">`;
content = content.replace(s1, r1);

// Close overview tab properly
let s2 = `              </div>
            </div>

          </div>

          {/* Right Column - Contact Info */}`;
let r2 = `              </div>
            </div>
          )}

          </div>

          {/* Right Column - Contact Info */}`;
content = content.replace(s2, r2);

// Remove the old closing of activeTab === 'overview' which was `)}` at line ~616
let s3 = `            </div>
          </div>

        </div>
      )}
           {activeTab === 'documents' && (`;
let r3 = `            </div>
          </div>

        </div>
           {activeTab === 'documents' && (`;
content = content.replace(s3, r3);

// Now, the Right Column is still inside `Main Layout Grid` because we closed `Left Column` but not `Main Layout Grid`.
// BUT the other tabs (documents, payments, sessions, communications) are currently OUTSIDE `Main Layout Grid`!
// We need to move the other tabs INSIDE `Left Column`.

// The other tabs start at `           {activeTab === 'documents' && (`
// And end right before `      {/* Add Note Modal */}`

let tabsArr = content.split('           {activeTab === \'documents\' && (');
if (tabsArr.length === 2) {
  let beforeTabs = tabsArr[0]; // This ends with `</div>` (Main Layout Grid) and `\n`
  let tabsAndAfter = '           {activeTab === \'documents\' && (' + tabsArr[1];
  
  let split2 = tabsAndAfter.split('      {/* Add Note Modal */}');
  let theTabs = split2[0];
  let theAfter = '      {/* Add Note Modal */}' + split2[1];
  
  // Clean up theTabs: remove the very last `</div>` which belonged to the main page container
  theTabs = theTabs.trimEnd();
  if (theTabs.endsWith('</div>')) {
    theTabs = theTabs.substring(0, theTabs.length - 6).trimEnd();
  }
  
  // Now, inject `theTabs` into `beforeTabs` right after `)}` that closed `overview` tab!
  // Find `          )}` inside `beforeTabs` (the one we just added in r2)
  let insertionPoint = `              </div>
            </div>
          )}

`;
  let insertionIndex = beforeTabs.lastIndexOf(insertionPoint);
  if (insertionIndex !== -1) {
    let newBeforeTabs = beforeTabs.substring(0, insertionIndex + insertionPoint.length) + theTabs + '\n' + beforeTabs.substring(insertionIndex + insertionPoint.length);
    content = newBeforeTabs + '\n      </div>\n' + theAfter;
  }
}

fs.writeFileSync(file, content);
console.log('Fixed');
