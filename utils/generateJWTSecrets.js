import crypto from 'crypto';

/**
 * Generate ultra-secure JWT secrets
 * Run this script once to generate secrets for your .env file
 *
 * Usage: node utils/generateJWTSecrets.js
 */

console.log('\n🔐 Generating Ultra-Secure JWT Secrets...\n');
console.log('Add these to your .env file:\n');
console.log('=' .repeat(80));

const jwtSecret = crypto.randomBytes(64).toString('hex');
const jwtRefreshSecret = crypto.randomBytes(64).toString('hex');

console.log(`\nJWT_SECRET=${jwtSecret}`);
console.log(`JWT_REFRESH_SECRET=${jwtRefreshSecret}`);
console.log(`JWT_ISSUER=myapi`);
console.log(`JWT_AUDIENCE=myapi-users`);

console.log('\n' + '='.repeat(80));
console.log('\n✅ Secrets generated successfully!');
console.log('⚠️  Keep these secrets safe and never commit them to version control\n');
