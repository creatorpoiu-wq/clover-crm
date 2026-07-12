import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;

if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
  console.error('Missing R2 env vars');
  process.exit(1);
}

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

async function setCors() {
  const command = new PutBucketCorsCommand({
    Bucket: bucketName,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedOrigins: ['*'],
          AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
          AllowedHeaders: ['*'],
          ExposeHeaders: ['ETag'],
          MaxAgeSeconds: 3600,
        },
      ],
    },
  });

  try {
    await client.send(command);
    console.log('✅ CORS policy set successfully on bucket:', bucketName);

    // Verify
    const getCommand = new GetBucketCorsCommand({ Bucket: bucketName });
    const result = await client.send(getCommand);
    console.log('Current CORS rules:', JSON.stringify(result.CORSRules, null, 2));
  } catch (err) {
    console.error('❌ Failed to set CORS:', err.message);
    console.error(err);
  }
}

setCors();
