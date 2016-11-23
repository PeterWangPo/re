/**
 * Created by wang on 2015/9/30.
 */
var Student = require('./b.js');
function overLoad(){
    Student.call(this);
    this.eat = function(){
        console.log('this is overLoad function');
    }
}
module.exports = overLoad;