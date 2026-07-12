import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const VERCEL_TOKEN = process.env.VERCEL_API_TOKEN;
const PROJECT_NAME = 'clover-crm'; // update if different

if (!VERCEL_TOKEN) {
  console.error('❌ VERCEL_API_TOKEN is not set in .env.local');
  process.exit(1);
}

// First, get project ID
const projectRes = await fetch(`https://api.vercel.com/v9/projects/${PROJECT_NAME}`, {
  headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
});
const project = await projectRes.json();
if (!project.id) {
  console.error('❌ Could not find project. Response:', JSON.stringify(project));
  process.exit(1);
}
const projectId = project.id;
console.log('Project ID:', projectId);

const envVarsToSet = [
  { key: 'R2_BUCKET_NAME', value: 'clover' },
  { key: 'NEXT_PUBLIC_R2_PUBLIC_URL', value: 'https://pub-5465d0894bc903660806cd5d573959d1.r2.dev' },
];

for (const { key, value } of envVarsToSet) {
  // Check if env var exists
  const listRes = await fetch(`https://api.vercel.com/v9/projects/${projectId}/env?decrypt=false`, {
    headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
  });
  const list = await listRes.json();
  const existing = list.envs?.find(e => e.key === key);

  if (existing) {
    // Update existing
    const updateRes = await fetch(`https://api.vercel.com/v9/projects/${projectId}/env/${existing.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${VERCEL_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ value, target: ['production', 'preview', 'development'] }),
    });
    const updated = await updateRes.json();
    if (updated.key) {
      console.log(`✅ Updated ${key} = ${value}`);
    } else {
      console.error(`❌ Failed to update ${key}:`, JSON.stringify(updated));
    }
  } else {
    // Create new
    const createRes = await fetch(`https://api.vercel.com/v9/projects/${projectId}/env`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${VERCEL_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value, type: 'plain', target: ['production', 'preview', 'development'] }),
    });
    const created = await createRes.json();
    if (created.key) {
      console.log(`✅ Created ${key} = ${value}`);
    } else {
      console.error(`❌ Failed to create ${key}:`, JSON.stringify(created));
    }
  }
}

console.log('\nDone! Trigger a new Vercel deployment to apply the changes.');
