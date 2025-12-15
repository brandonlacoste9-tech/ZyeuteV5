#!/usr/bin/env node

/**
 * Automated Issue Creation Script for Audit Findings
 * 
 * Usage: node .github/scripts/create-triaged-issues.js findings.json
 * 
 * This script takes a JSON file of audit findings and creates GitHub issues
 * using the appropriate templates and labels.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function validateFinding(finding) {
  const required = ['type', 'priority', 'title', 'description'];
  const missing = required.filter(field => !finding[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
  
  const validTypes = ['bug', 'security', 'test-coverage'];
  if (!validTypes.includes(finding.type)) {
    throw new Error(`Invalid type: ${finding.type}. Must be one of: ${validTypes.join(', ')}`);
  }
  
  const validPriorities = ['critical', 'high', 'medium', 'low'];
  if (!validPriorities.includes(finding.priority)) {
    throw new Error(`Invalid priority: ${finding.priority}. Must be one of: ${validPriorities.join(', ')}`);
  }
  
  return true;
}

function createIssueFromFinding(finding) {
  log(`\n📋 Creating issue: ${finding.title}`, 'cyan');
  
  // Validate finding
  try {
    validateFinding(finding);
  } catch (error) {
    log(`❌ Validation failed: ${error.message}`, 'red');
    return false;
  }
  
  // Build issue body from finding
  const body = buildIssueBody(finding);
  
  // Build labels
  const labels = buildLabels(finding);
  
  // Build GitHub CLI command
  const titleWithPrefix = `[${finding.priority.toUpperCase()}] ${finding.component || 'Core'}: ${finding.title}`;
  
  // Escape special characters in body
  const escapedBody = body.replace(/"/g, '\\"').replace(/\n/g, '\\n');
  
  const command = `gh issue create --title "${titleWithPrefix}" --body "${escapedBody}" --label "${labels}"`;
  
  try {
    // Create issue using GitHub CLI
    const output = execSync(command, { encoding: 'utf8' });
    const issueUrl = output.trim();
    log(`✅ Created: ${issueUrl}`, 'green');
    return true;
  } catch (error) {
    log(`❌ Failed to create issue: ${error.message}`, 'red');
    return false;
  }
}

function buildIssueBody(finding) {
  const priority = getPriorityEmoji(finding.priority);
  
  let body = `## ${priority} ${finding.title}\n\n`;
  body += `**Priority:** ${priority} ${finding.priority.toUpperCase()}\n\n`;
  body += `### 📝 Description\n${finding.description}\n\n`;
  
  if (finding.rootCause) {
    body += `### 🔍 Root Cause\n`;
    body += `**File:** ${finding.rootCause.file || 'N/A'}\n`;
    body += `**Line:** ${finding.rootCause.line || 'N/A'}\n`;
    body += `**Cause:** ${finding.rootCause.description}\n\n`;
  }
  
  if (finding.currentBehavior) {
    body += `### ❌ Current Behavior\n${finding.currentBehavior}\n\n`;
  }
  
  if (finding.expectedBehavior) {
    body += `### ✅ Expected Behavior\n${finding.expectedBehavior}\n\n`;
  }
  
  if (finding.acceptanceCriteria && finding.acceptanceCriteria.length > 0) {
    body += `### ✅ Acceptance Criteria\n`;
    finding.acceptanceCriteria.forEach(criterion => {
      body += `- [ ] ${criterion}\n`;
    });
    body += '\n';
  }
  
  body += `### 🎯 Technical Details\n`;
  body += `**Severity:** ${finding.severity || finding.priority.toUpperCase()}\n`;
  body += `**Effort:** ${finding.effort || 'TBD'}\n`;
  body += `**Complexity:** ${finding.complexity || 'TBD'}\n`;
  body += `**Risk:** ${finding.risk || 'TBD'}\n\n`;
  
  if (finding.filesAffected && finding.filesAffected.length > 0) {
    body += `### 📂 Files Affected\n`;
    finding.filesAffected.forEach(file => {
      body += `- ${file}\n`;
    });
    body += '\n';
  }
  
  if (finding.relatedIssues) {
    body += `### 🔗 Related Issues\n`;
    if (finding.relatedIssues.dependsOn) {
      body += `- Depends on: ${finding.relatedIssues.dependsOn.map(n => `#${n}`).join(', ')}\n`;
    }
    if (finding.relatedIssues.blocks) {
      body += `- Blocks: ${finding.relatedIssues.blocks.map(n => `#${n}`).join(', ')}\n`;
    }
    if (finding.relatedIssues.related) {
      body += `- Related to: ${finding.relatedIssues.related.map(n => `#${n}`).join(', ')}\n`;
    }
    body += '\n';
  }
  
  if (finding.testingInstructions) {
    body += `### 🧪 Testing Instructions\n${finding.testingInstructions}\n\n`;
  }
  
  if (finding.proposedFix) {
    body += `### 🛠️ Proposed Fix\n${finding.proposedFix}\n\n`;
  }
  
  if (finding.sourceAudit) {
    body += `### 📊 Source Audit\n${finding.sourceAudit}\n\n`;
  }
  
  body += `---\n\n`;
  body += `*Created automatically from audit findings*\n`;
  
  return body;
}

function buildLabels(finding) {
  const labels = [];
  
  // Priority
  labels.push(finding.priority);
  
  // Type
  labels.push(finding.type);
  
  // Always add audit and triaged
  labels.push('audit', 'triaged');
  
  // Add blocker if critical
  if (finding.priority === 'critical') {
    labels.push('blocker');
  }
  
  // Component
  if (finding.component) {
    labels.push(finding.component.toLowerCase());
  }
  
  // Effort
  if (finding.effort) {
    const effortLabel = finding.effort.replace(/\s+/g, '').toLowerCase();
    labels.push(`effort/${effortLabel}`);
  }
  
  return labels.join(',');
}

function getPriorityEmoji(priority) {
  const emojis = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🟢',
  };
  return emojis[priority] || '⚪';
}

function main() {
  log('🚀 Automated Issue Creation for Audit Findings', 'magenta');
  log('='.repeat(50), 'blue');
  
  // Check if GitHub CLI is installed
  try {
    execSync('gh --version', { stdio: 'ignore' });
  } catch (error) {
    log('❌ GitHub CLI (gh) is not installed', 'red');
    log('Install from: https://cli.github.com/', 'yellow');
    process.exit(1);
  }
  
  // Get findings file from arguments
  const findingsFile = process.argv[2];
  
  if (!findingsFile) {
    log('❌ Usage: node create-triaged-issues.js <findings.json>', 'red');
    log('\nExample findings.json format:', 'yellow');
    log(JSON.stringify({
      findings: [
        {
          type: 'bug',
          priority: 'critical',
          title: 'Login button not clickable',
          description: 'Users cannot log in because button does not respond',
          component: 'auth',
          effort: '1-2h',
          complexity: 'Low',
          risk: 'Low',
          severity: 'CRITICAL',
          rootCause: {
            file: '/src/pages/LoginPage.tsx',
            line: '45',
            description: 'onClick handler missing',
          },
          currentBehavior: 'Button does not respond to clicks',
          expectedBehavior: 'Button triggers login flow',
          acceptanceCriteria: [
            'Button is clickable',
            'Form submits on click',
            'Loading state shows',
          ],
          filesAffected: ['/src/pages/LoginPage.tsx'],
          testingInstructions: '1. Navigate to /login\\n2. Click button\\n3. Verify submission',
          sourceAudit: 'Found in Issue #1 (SWE Agent) Phase 4',
        },
      ],
    }, null, 2), 'cyan');
    process.exit(1);
  }
  
  // Read and parse findings file
  let findings;
  try {
    const fileContent = fs.readFileSync(findingsFile, 'utf8');
    const data = JSON.parse(fileContent);
    findings = data.findings || [];
  } catch (error) {
    log(`❌ Failed to read findings file: ${error.message}`, 'red');
    process.exit(1);
  }
  
  if (findings.length === 0) {
    log('⚠️  No findings in file', 'yellow');
    process.exit(0);
  }
  
  log(`\n📊 Found ${findings.length} findings to process\n`, 'blue');
  
  // Process each finding
  let created = 0;
  let failed = 0;
  
  findings.forEach((finding, index) => {
    log(`\n[${index + 1}/${findings.length}]`, 'blue');
    if (createIssueFromFinding(finding)) {
      created++;
    } else {
      failed++;
    }
  });
  
  // Summary
  log('\n' + '='.repeat(50), 'blue');
  log(`✅ Successfully created: ${created} issues`, 'green');
  if (failed > 0) {
    log(`❌ Failed to create: ${failed} issues`, 'red');
  }
  log(`📊 Total processed: ${findings.length} findings`, 'blue');
  
  if (failed > 0) {
    process.exit(1);
  }
}

// Run main function
if (require.main === module) {
  main();
}

module.exports = { createIssueFromFinding, buildIssueBody, buildLabels };
