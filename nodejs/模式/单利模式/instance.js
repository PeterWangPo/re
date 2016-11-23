/**
 * Created by wang on 2015/9/30.
 */
var _instance = null;
module.exports = function(name){
    function i(name){
        this.age = 25;
        this.name = name;
    }
    i.prototype = {
        constructor:i,
        show: function(){
            console.log(this.name);
        }
    }
    this.getInstance = function(){
        if(_instance === null){
            _instance = new i(name);
        }
        return _instance;
    }
}