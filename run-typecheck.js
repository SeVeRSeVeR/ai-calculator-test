const { exec } = require('child_process');

exec('npm run typecheck 2>&1', (error, stdout, stderr) => {
  const output = stdout + stderr;
  console.log(output);
});
