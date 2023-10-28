const fs = require('fs');
const exec = require('child_process').exec;

// Get a list of all the files in the NodeBB directory.
const files = fs.readdirSync('/Users/nityagirase/Desktop/fall23-nodebb-slate');

// Split the files into smaller groups.
const groups = [];
for (let i = 0; i < files.length; i += 100) {
  groups.push(files.slice(i, i + 100));
}

// Run Iroh on each group of files in parallel.
groups.forEach(group => {
  exec(`iroh ${group.join(' ')} > iroh-output.log`);
});
