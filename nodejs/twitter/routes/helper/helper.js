/**
 * Created by wang on 2015/10/4.
 */
var helper = {};//common functions
var util = require('util');
//获取数组的键
helper.arrayKeys = function(data){
    if(data || data.length ==0) return -1;
    if(!util.isArray(data)) return -1;
    var keys = [];
    for(var i in data){
        keys.push(i);
    }
    return keys;
}
//获取数组的值
helper.arrayValues = function(data){
    if(data || data.length ==0) return -1;
    if(!util.isArray(data)) return -1;
    var values = [];
    for(var i in data){
        values.push(data[i]);
    }
    return values;
}
helper.arrayKey = function(data,search){
    if(search) return -1;
    for(var i in data){
        if(data[i] === search) return i;
        else return -1;
    }
}
helper.filter = function(data,filter){
    if(!filter) return data;
    if(filter === 'trim'){

    }else if(filter === 'upperCase'){

    }else if(filter === 'lowerCase'){

    }else if(filter === 'a'){

    }
}
module.exports = helper;