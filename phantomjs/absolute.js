/**
 * Created by wang on 2015/9/8.
 */
var fs = require("fs");
var path = fs.absolute("./");
var subPath = fs.absolute("../");
console.log(path);
console.log(subPath);
phantom.exit();