#!/usr/bin/env node
import { execSync } from 'child_process';
import inquirer from 'inquirer';
import fs from 'fs';


const configFile = 'global-files.config.json';
let globalFilesConfig = [];
try {
  globalFilesConfig = JSON.parse(fs.readFileSync(configFile, 'utf8'));
} catch (error) {
  // choose to ignore or handle errors if no config is provided
  // console.error(`Error loading ${configFile}:`, error);
}

export async function prompter(inquirer, commit) {
  // Step 1: Check for global file changes 
  try {
    const stdout = execSync('git diff --cached --name-only', { encoding: 'utf8' });
    const stagedFiles = stdout.split('\n').filter(Boolean);
    
    // If have a config file, check against it:
    const modifiedGlobalFiles = stagedFiles.filter(file =>
      globalFilesConfig.length
        ? globalFilesConfig.includes(file)
        : (file.includes('/global/') || file.startsWith('src/global/'))
    );
    
    if (modifiedGlobalFiles.length > 0) {
      console.log('Detected changes in global files:');
      console.log(modifiedGlobalFiles.join('\n'));
      
      // Prompt the user for confirmation
      const { proceed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'proceed',
          message: '🚨 Are you sure you want to proceed with this commit? 🚨',
          default: false
        }
      ]);
      
      if (!proceed) {
        console.log('Commit aborted by user.');
        process.exit(1);
      }
    }
  } catch (error) {
    console.error('Error during global file check:', error);
    process.exit(1);
  }

  //Now define commit questions.
  const questions = [
    {
      type: 'list',
      name: 'type',
      message: "Select the type of change that you're committing:",
      choices: [
        { name: 'feat:     A new feature', value: 'feat' },
        { name: 'fix:      A bug fix', value: 'fix' },
        // ... add more choices as needed
      ]
    },
    // Define other questions (scope, subject, body, footer, etc.)
  ];

  inquirer.prompt(questions).then(answers => {
    // Format the commit message as desired.
    // This is a simple example.
    const commitMessage = `${answers.type}: ${answers.subject || ''}`.trim();
    commit(commitMessage);
  });
}
