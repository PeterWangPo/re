/**
 * Created by wang on 2015/9/30.
 */
var Person = require('./a.js');
function Student(){
    Person.call(this);
}
Student.prototype.write = function(){
    console.log('I am writing');
}
module.exports = Student;