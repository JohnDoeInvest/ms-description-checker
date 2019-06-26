#!/usr/bin/env node

const msDescriptionChecker = require('./index')
const program = require('commander')
const chalk = require('chalk')

program
  .option('--srcPath <path>', 'Path to where the code is', './src')

program.parse(process.argv)

const errors = msDescriptionChecker(program.opts())

if (errors !== undefined) {
  for (const error of errors) {
    console.log(chalk.red(error.position) + ': ' + error.message)
  }
  process.exit(1)
} else {
  console.log(chalk.green('All checks passed'))
  process.exit(0)
}
