#!/usr/bin/env node

/**
 * Pre-commit hook to check for security issues
 * This runs before each commit to catch potential security problems
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Check for sensitive files
function checkSensitiveFiles() {
  const sensitiveFiles = ['.env', '.env.local', '.env.development', '.env.production'];
  let hasErrors = false;

  sensitiveFiles.forEach(file => {
    if (fs.existsSync(file)) {
      error(`Sensitive file '${file}' should not be committed!`);
      error(`Add '${file}' to .gitignore and remove it from git tracking.`);
      hasErrors = true;
    }
  });

  return hasErrors;
}

// Check for hardcoded secrets in staged files
function checkHardcodedSecrets() {
  try {
    // Get list of staged files
    const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' })
      .split('\n')
      .filter(file => file.trim() && (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.tsx')));

    let hasErrors = false;

    stagedFiles.forEach(file => {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');

        // Check for common patterns of hardcoded secrets
        const secretPatterns = [
          /password\s*[:=]\s*['"][^'"]*['"]/i,
          /secret\s*[:=]\s*['"][^'"]*['"]/i,
          /token\s*[:=]\s*['"][^'"]*['"]/i,
          /api[_-]?key\s*[:=]\s*['"][^'"]*['"]/i,
          /mongodb\+srv:\/\/[^:]+:[^@]+@/i, // MongoDB connection strings with credentials
        ];

        secretPatterns.forEach(pattern => {
          if (pattern.test(content)) {
            error(`Potential hardcoded secret found in ${file}`);
            error(`Make sure sensitive data uses environment variables!`);
            hasErrors = true;
          }
        });
      }
    });

    return hasErrors;
  } catch (err) {
    warning('Could not check staged files for secrets');
    return false;
  }
}

// Main check
function main() {
  log('🔒 Running security checks...', 'yellow');

  let hasErrors = false;

  // Check for sensitive files
  if (checkSensitiveFiles()) {
    hasErrors = true;
  }

  // Check for hardcoded secrets
  if (checkHardcodedSecrets()) {
    hasErrors = true;
  }

  if (hasErrors) {
    error('Security checks failed! Please fix the issues before committing.');
    process.exit(1);
  } else {
    success('All security checks passed!');
  }
}

main();