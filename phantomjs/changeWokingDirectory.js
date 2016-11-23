/**
 * Created by wang on 2015/9/8.
 */
var fs = require("fs");
var path = fs.workingDirectory;
console.log(path);
fs.changeWorkingDirectory("../");
console.log(fs.workingDirectory);
phantom.exit();