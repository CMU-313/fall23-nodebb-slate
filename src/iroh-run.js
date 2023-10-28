const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// Set the directory where your NodeBB project is located
const projectDirectory = '';

// Enable Iroh
const iroh = require('iroh');
iroh.enable();

// Function to recursively traverse directories and execute JavaScript files
function executeJavaScriptFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      executeJavaScriptFiles(filePath);
    } else if (file.endsWith('.js')) {
      console.log(`Running Iroh on ${filePath}`);
      spawnSync('node', [filePath], { stdio: 'inherit' });
    }
  }
}

// Start executing JavaScript files
executeJavaScriptFiles(projectDirectory);
