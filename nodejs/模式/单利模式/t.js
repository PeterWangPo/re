/**
 * Created by wang on 2015/9/30.
 */
var I = require('./instance.js');
var i = new I('a');
var a = i.getInstance();
var b = i.getInstance();
console.log(a === b);
a.show();