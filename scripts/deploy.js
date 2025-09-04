#!/usr/bin/env node

/**
 * HALEU Supply Watch - Deployment Script
 * 
 * Automates the deployment process for both API and Web components
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import path from 'path';

const ENVIRONMENTS = {
  development: {
    api: 'http://localhost:8787',
    web: 'http://localhost:3000'
  },
  production: {
    api: process.env.PRODUCTION_API_URL || 'https://hsw-api.blake-coffee8.workers.dev',
    web: process.env.PRODUCTION_WEB_URL || 'https://haleu-supply-watch.pages.dev'
  }
};

function log(message) {
  console.log(`🚀 ${message}`);
}

function error(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function runCommand(command, cwd = process.cwd()) {
  log(`Running: ${command}`);
  try {
    execSync(command, { 
      cwd, 
      stdio: 'inherit',
      env: { ...process.env }
    });
  } catch (err) {
    error(`Command failed: ${command}`);
  }
}

function deployAPI() {
  log('Deploying API to Cloudflare Workers...');
  
  const apiDir = path.join(process.cwd(), 'apps', 'api');
  
  // Deploy the Worker
  runCommand('wrangler deploy', apiDir);
  
  log('✅ API deployed successfully');
  return ENVIRONMENTS.production.api;
}

function deployWeb(apiUrl) {
  log('Deploying Web App to Cloudflare Pages...');
  
  const webDir = path.join(process.cwd(), 'apps', 'web');
  
  // Set production API URL
  log(`Setting API URL to: ${apiUrl}`);
  runCommand(`wrangler pages secret put NEXT_PUBLIC_API_BASE_URL --value "${apiUrl}"`, webDir);
  
  // Build for production
  log('Building web app...');
  runCommand('pnpm pages:build', webDir);
  
  // Deploy to Pages
  log('Deploying to Cloudflare Pages...');
  runCommand('wrangler pages deploy .vercel/output/static --project-name haleu-supply-watch', webDir);
  
  log('✅ Web app deployed successfully');
}

function migrateDatabase() {
  log('Running database migrations...');
  
  const apiDir = path.join(process.cwd(), 'apps', 'api');
  
  // Run main migration
  runCommand('wrangler d1 execute hsw --remote --file ../../packages/database/migrations/0001_init.sql', apiDir);
  
  // Run schema updates
  runCommand('wrangler d1 execute hsw --remote --file ../../packages/database/migrations/0002_minimal_migration.sql', apiDir);
  
  log('✅ Database migrations completed');
}

function seedDatabase() {
  log('Seeding production database...');
  
  const apiDir = path.join(process.cwd(), 'apps', 'api');
  
  runCommand('wrangler d1 execute hsw --remote --file ../../packages/database/seeds/seed-remote.sql', apiDir);
  
  log('✅ Database seeded');
}

function verifyDeployment(apiUrl, webUrl) {
  log('Verifying deployment...');
  
  try {
    // Test API health
    execSync(`curl -f ${apiUrl}/v1/health`, { stdio: 'pipe' });
    log('✅ API health check passed');
    
    // Test API endpoints
    execSync(`curl -f ${apiUrl}/v1/allocations`, { stdio: 'pipe' });
    log('✅ API endpoints working');
    
    log(`🎉 Deployment successful!`);
    log(`📱 Web App: ${webUrl}`);
    log(`🔗 API: ${apiUrl}`);
    
  } catch (err) {
    error('Deployment verification failed');
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'api':
      deployAPI();
      break;
      
    case 'web':
      const apiUrl = args[1] || ENVIRONMENTS.production.api;
      deployWeb(apiUrl);
      break;
      
    case 'migrate':
      migrateDatabase();
      break;
      
    case 'seed':
      seedDatabase();
      break;
      
    case 'full':
    case 'all':
      // Full deployment workflow
      log('🚀 Starting full deployment...');
      
      const deployedApiUrl = deployAPI();
      migrateDatabase();
      seedDatabase();
      deployWeb(deployedApiUrl);
      verifyDeployment(deployedApiUrl, ENVIRONMENTS.production.web);
      break;
      
    case 'verify':
      const checkApiUrl = args[1] || ENVIRONMENTS.production.api;
      const checkWebUrl = args[2] || ENVIRONMENTS.production.web;
      verifyDeployment(checkApiUrl, checkWebUrl);
      break;
      
    default:
      console.log(`
HALEU Supply Watch - Deployment Script

Usage:
  node scripts/deploy.js <command> [options]

Commands:
  api                    Deploy API only
  web [api-url]         Deploy web app (optionally specify API URL)  
  migrate               Run database migrations
  seed                  Seed production database
  full                  Full deployment (API + DB + Web)
  verify [api] [web]    Verify deployment

Examples:
  node scripts/deploy.js full
  node scripts/deploy.js api
  node scripts/deploy.js web https://my-api.workers.dev
  node scripts/deploy.js verify
      `);
      break;
  }
}

main().catch(error);
