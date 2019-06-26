const checker = require('../src/index')
const path = require('path')
const options = { srcPath: path.join(__dirname , 'test-src') }

checker(options)

// TODO: Add mocha and write proper tests for this. Have different directories with different faults etc.
// TODO: Make this an acual CLI (https://medium.com/netscape/a-guide-to-create-a-nodejs-command-line-package-c2166ad0452e)