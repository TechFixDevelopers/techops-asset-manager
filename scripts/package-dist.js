/**
 * TechOps Asset Manager - Package for Distribution
 *
 * Creates a distributable ZIP file containing the standalone build,
 * migration files, seed scripts, and deployment guide.
 *
 * Usage: node scripts/package-dist.js
 * (Run AFTER `npm run build`)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const version = pkg.version || '0.1.0';
const outName = `techops-asset-manager-v${version}`;
const distDir = path.join(ROOT, 'dist', outName);

console.log(`\n=== Packaging TechOps Asset Manager v${version} ===\n`);

// Check that build exists
const standalonePath = path.join(ROOT, '.next', 'standalone');
if (!fs.existsSync(standalonePath)) {
  console.error('ERROR: .next/standalone not found. Run "npm run build" first.');
  process.exit(1);
}

// Clean dist
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Copy standalone build
console.log('  Copying standalone build...');
copyDirSync(standalonePath, distDir);

// Copy static assets
const staticSrc = path.join(ROOT, '.next', 'static');
const staticDest = path.join(distDir, '.next', 'static');
if (fs.existsSync(staticSrc)) {
  console.log('  Copying static assets...');
  copyDirSync(staticSrc, staticDest);
}

// Copy public
const publicSrc = path.join(ROOT, 'public');
if (fs.existsSync(publicSrc)) {
  console.log('  Copying public folder...');
  copyDirSync(publicSrc, path.join(distDir, 'public'));
}

// Copy deployment files
const filesToCopy = [
  'DEPLOY.md',
  'ecosystem.config.js',
  'docker-compose.yml',
  'Dockerfile',
  'drizzle.config.ts',
  'package.json',
];

for (const file of filesToCopy) {
  const src = path.join(ROOT, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(distDir, file));
    console.log(`  Copied ${file}`);
  }
}

// Copy drizzle migrations
const drizzleSrc = path.join(ROOT, 'drizzle');
if (fs.existsSync(drizzleSrc)) {
  console.log('  Copying drizzle migrations...');
  copyDirSync(drizzleSrc, path.join(distDir, 'drizzle'));
}

// Copy scripts
const scriptsSrc = path.join(ROOT, 'scripts');
if (fs.existsSync(scriptsSrc)) {
  console.log('  Copying scripts...');
  copyDirSync(scriptsSrc, path.join(distDir, 'scripts'));
}

// Copy schema (needed by drizzle-kit)
const schemaSrc = path.join(ROOT, 'src', 'lib', 'db', 'schema.ts');
const schemaDest = path.join(distDir, 'src', 'lib', 'db', 'schema.ts');
fs.mkdirSync(path.dirname(schemaDest), { recursive: true });
fs.copyFileSync(schemaSrc, schemaDest);
console.log('  Copied schema.ts');

// Create .env.local.example in dist
const envExample = `# TechOps Asset Manager - Environment Configuration
# Copy this file to .env.local and edit values

# PostgreSQL connection
DATABASE_URL=postgresql://techops:your-password@localhost:5432/techops_assets

# Auth.js secret (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
AUTH_SECRET=CHANGE_ME

# Base URL of the application
AUTH_URL=http://localhost:3000

# Optional: ServiceNow integration
# SERVICENOW_INSTANCE_URL=https://your-instance.service-now.com
# SERVICENOW_USERNAME=
# SERVICENOW_PASSWORD=
`;
fs.writeFileSync(path.join(distDir, '.env.local.example'), envExample);
console.log('  Created .env.local.example');

console.log(`\n  Package ready at: dist/${outName}/`);
console.log('  To create ZIP: compress the folder and share via OneDrive/Google Drive.\n');

// ---- Helper ----
function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
