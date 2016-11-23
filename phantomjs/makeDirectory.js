/**
 * Created by wang on 2015/9/29.
 */
var fs = require('fs');

var path = './a';

if(fs.makeDirectory(path))
    console.log('"'+path+'" was created.');
else
    console.log('"'+path+'" is NOT created.');

phantom.exit();