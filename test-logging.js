#!/usr/bin/env node

/**
 * Test script to demonstrate different logging formats
 * Usage: 
 * LOG_FORMAT=pretty node test-logging.js
 * LOG_FORMAT=json node test-logging.js  
 * LOG_FORMAT=mixed node test-logging.js
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Testing Enhanced Logging System\n');

// Test different log formats
const formats = ['pretty', 'json', 'mixed'];

formats.forEach(format => {
  console.log(`\n📋 Testing LOG_FORMAT=${format}:`);
  console.log('─'.repeat(50));
  
  const env = {
    ...process.env,
    LOG_FORMAT: format,
    LOG_LEVEL: 'debug',
    NODE_ENV: 'development'
  };
  
  const testProcess = spawn('node', [
    '-e', `
      const { logger } = require('./src/logger/pino.logger');
      
      logger.info('Application starting', { service: 'test-service' });
      logger.debug('Debug information', { debugId: '12345' });
      logger.warn('Warning message', { warning: 'test warning' });
      logger.error('Error occurred', new Error('Test error'), { errorContext: 'testing' });
      
      setTimeout(() => process.exit(0), 100);
    `
  ], {
    env,
    stdio: 'pipe',
    cwd: __dirname
  });
  
  testProcess.stdout.on('data', (data) => {
    process.stdout.write(data);
  });
  
  testProcess.stderr.on('data', (data) => {
    process.stderr.write(data);
  });
  
  testProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`Process exited with code ${code}`);
    }
  });
});

setTimeout(() => {
  console.log('\n✅ Logging system test completed!');
  console.log('\n📖 Key features demonstrated:');
  console.log('  • Structured JSON output for production');
  console.log('  • Pretty colored output for development');
  console.log('  • Adaptive mixed format based on TTY detection');
  console.log('  • Rich metadata enrichment (service, environment, pid)');
  console.log('  • Context-aware logging with proper error handling');
  console.log('  • Configurable log levels and formatting options');
}, 3000);
