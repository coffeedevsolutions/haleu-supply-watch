#!/usr/bin/env node

/**
 * HALEU Supply Watch - Development Script
 * 
 * Simplifies development workflow setup and common tasks
 */

import { execSync, spawn } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

function log(message) {
  console.log(`🔧 ${message}`);
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

function setupEnvironment() {
  log('Setting up development environment...');
  
  const webEnvPath = path.join(process.cwd(), 'apps', 'web', '.env.local');
  const exampleEnvPath = path.join(process.cwd(), 'config', 'env.example');
  
  if (!existsSync(webEnvPath)) {
    log('Creating .env.local for web app...');
    
    if (existsSync(exampleEnvPath)) {
      const exampleContent = readFileSync(exampleEnvPath, 'utf8');
      const webEnvContent = exampleContent
        .split('\n')
        .filter(line => line.includes('NEXT_PUBLIC_') || line.includes('NODE_ENV'))
        .join('\n');
      
      writeFileSync(webEnvPath, webEnvContent);
      log('✅ Created apps/web/.env.local');
    } else {
      writeFileSync(webEnvPath, 'NEXT_PUBLIC_API_BASE_URL=http://localhost:8787\n');
      log('✅ Created basic .env.local');
    }
  }
}

function setupDatabase() {
  log('Setting up local database...');
  
  // Run migrations
  runCommand('pnpm migrate:local');
  
  // Seed with development data
  runCommand('pnpm seed:local');
  
  log('✅ Database setup complete');
}

function startDevServers() {
  log('Starting development servers...');
  
  const apiProcess = spawn('pnpm', ['dev:api'], {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd()
  });
  
  const webProcess = spawn('pnpm', ['dev:web'], {
    stdio: 'inherit', 
    shell: true,
    cwd: process.cwd()
  });
  
  // Handle shutdown
  process.on('SIGINT', () => {
    log('Shutting down servers...');
    apiProcess.kill('SIGINT');
    webProcess.kill('SIGINT');
    process.exit(0);
  });
  
  log('🚀 Development servers started!');
  log('📱 Web: http://localhost:3000');
  log('🔗 API: http://localhost:8787');
  log('Press Ctrl+C to stop');
}

function runTests() {
  log('Running tests...');
  
  // Run API tests
  const apiDir = path.join(process.cwd(), 'apps', 'api');
  runCommand('pnpm test', apiDir);
  
  log('✅ Tests completed');
}

function resetDatabase() {
  log('Resetting local database...');
  
  const apiDir = path.join(process.cwd(), 'apps', 'api');
  
  // Clear all data
  runCommand('wrangler d1 execute hsw --local --command "DELETE FROM update_event;"', apiDir);
  runCommand('wrangler d1 execute hsw --local --command "DELETE FROM delivery_batch;"', apiDir);
  runCommand('wrangler d1 execute hsw --local --command "DELETE FROM allocation;"', apiDir);
  runCommand('wrangler d1 execute hsw --local --command "DELETE FROM document;"', apiDir);
  runCommand('wrangler d1 execute hsw --local --command "DELETE FROM source;"', apiDir);
  
  // Reseed
  runCommand('pnpm seed:local');
  
  log('✅ Database reset complete');
}

function checkStatus() {
  log('Checking development environment status...');
  
  try {
    // Check if API is running
    execSync('curl -f http://localhost:8787/v1/health', { stdio: 'pipe' });
    log('✅ API server is running');
    
    // Check if web is running
    execSync('curl -f http://localhost:3000', { stdio: 'pipe' });
    log('✅ Web server is running');
    
  } catch (err) {
    log('⚠️  Some servers may not be running');
    log('💡 Run: node scripts/dev.js start');
  }
  
  // Check database
  try {
    const apiDir = path.join(process.cwd(), 'apps', 'api');
    const result = execSync('wrangler d1 execute hsw --local --command "SELECT COUNT(*) as count FROM allocation;"', { 
      cwd: apiDir,
      stdio: 'pipe' 
    });
    log('✅ Database is accessible');
  } catch (err) {
    log('⚠️  Database may need setup');
    log('💡 Run: node scripts/dev.js setup');
  }
}

function showLogs() {
  log('Showing recent logs...');
  
  try {
    execSync('wrangler tail --local', { 
      stdio: 'inherit',
      cwd: path.join(process.cwd(), 'apps', 'api')
    });
  } catch (err) {
    log('No local logs available. Make sure API server is running.');
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'setup':
      setupEnvironment();
      setupDatabase();
      break;
      
    case 'start':
      setupEnvironment();
      startDevServers();
      break;
      
    case 'test':
      runTests();
      break;
      
    case 'reset':
      resetDatabase();
      break;
      
    case 'status':
      checkStatus();
      break;
      
    case 'logs':
      showLogs();
      break;
      
    case 'init':
      log('🚀 Initializing HALEU Supply Watch development environment...');
      setupEnvironment();
      setupDatabase();
      log('✅ Initialization complete!');
      log('💡 Run: node scripts/dev.js start');
      break;
      
    default:
      console.log(`
HALEU Supply Watch - Development Script

Usage:
  node scripts/dev.js <command>

Commands:
  init      Initialize development environment (first time setup)
  setup     Setup environment and database
  start     Start development servers (API + Web)
  test      Run tests
  reset     Reset local database
  status    Check development environment status
  logs      Show API logs

Examples:
  node scripts/dev.js init     # First time setup
  node scripts/dev.js start    # Start development
  node scripts/dev.js status   # Check what's running
      `);
      break;
  }
}

main().catch(error);
