const fs = require('fs');
const file = 'src/app/dashboard/contacts/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// The file currently has:
//           {/* Right Column - Contact Info */}
//           <div className="lg:col-span-1">
//             ...
//           </div>
//
//         </div>
//       )}
//       {activeTab === 'documents' && (

// 1. We need to close the overview tab BEFORE "Left Column" closes.
// "Left Column" currently closes at line 518:
//             </div>
// 
//           </div>
// 
//           {/* Right Column - Contact Info */}
// We will replace this with:
//             </div>
//           )} // closes activeTab === 'overview'

// 2. We will move all other tabs right after this newly added `)}`.
// We will find the start of `activeTab === 'documents'` and the end of `activeTab === 'communications'`
const docsStart = content.indexOf('{activeTab === \'documents\' && (');
// The communications tab ends at:
//           )}
//         </div>
//       )}
//       </div>
//
//       {/* Add Note Modal */}
const commsEndText = '      {/* Add Note Modal */}';
const commsEnd = content.indexOf(commsEndText);

// Extract the tabs (documents, payments, sessions, communications)
let tabsContent = content.substring(docsStart, commsEnd);
// The tabsContent includes the closing div for the entire page container:
//         </div>
//       )}
//       </div>
// Let's clean that up.
// Actually, it's easier to use a regex or string replacement for the specific parts.

let newContent = content;

// Remove the rogue `)}` at line 616
newContent = newContent.replace(/\n\s*\}\)\s*\n\s*\{activeTab === 'documents' && \(/, "\n      {activeTab === 'documents' && (");

// Now move everything from `{activeTab === 'documents'` down to the end of `communications` tab
// to just before `{/* Right Column - Contact Info */}` and after the overview `)}`

let rightColStart = newContent.indexOf('          {/* Right Column - Contact Info */}');
// Insert `)}` before Right Column, wait no, we need to close the `overview` tab.
// Find:
//             </div>
// 
//           </div>
// 
//           {/* Right Column - Contact Info */}
let searchString = '            </div>\n\n          </div>\n\n          {/* Right Column - Contact Info */}';
let replacementString = '            </div>\n          )}\n\n          {/* OTHER TABS GO HERE */}\n\n          </div>\n\n          {/* Right Column - Contact Info */}';

if (newContent.includes(searchString)) {
  newContent = newContent.replace(searchString, replacementString);
} else {
  // Try alternate spacing
  searchString = '            </div>\n          </div>\n\n          {/* Right Column - Contact Info */}';
  replacementString = '            </div>\n          )}\n\n          {/* OTHER TABS GO HERE */}\n\n          </div>\n\n          {/* Right Column - Contact Info */}';
  newContent = newContent.replace(searchString, replacementString);
}

// Now extract the tabs from the end.
const otherTabsStart = newContent.indexOf('           {activeTab === \'documents\' && (');
const otherTabsStart2 = newContent.indexOf('      {activeTab === \'documents\' && (');
const startIdx = otherTabsStart !== -1 ? otherTabsStart : otherTabsStart2;
const addNoteModalIdx = newContent.indexOf('      {/* Add Note Modal */}');

// The tabs end before `</div>\n\n      {/* Add Note Modal */}`
let tabsBlock = newContent.substring(startIdx, addNoteModalIdx);
// Let's remove `</div>\n` at the end of tabsBlock if it belongs to the main container
// Actually, let's just find the exact string.
tabsBlock = tabsBlock.trimEnd();
if (tabsBlock.endsWith('</div>')) {
  tabsBlock = tabsBlock.substring(0, tabsBlock.length - 6).trimEnd();
}

// Replace in the placeholder
newContent = newContent.replace('{/* OTHER TABS GO HERE */}', tabsBlock);

// Delete the original tabs block
newContent = newContent.substring(0, startIdx) + '\n      </div>\n\n      {/* Add Note Modal */}' + newContent.substring(addNoteModalIdx + 28);

fs.writeFileSync(file, newContent);
console.log('Done fixing JSX');
