/**
 * Created by Administrator on 2016/6/27.
 */
(function(){
    var root = this;
    var previousUtils = this.utils;

    var utils = function(obj) {
        if (obj instanceof utils) return obj;
        if (!(this instanceof utils)) return new utils(obj);
    };

    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = utils;
        }
        exports.utils = utils;
    } else {
        root.utils = utils;
    }

    /****
     * 是否为数字
     * @params 待验证字符
     * @return bool
     * ****/
    utils.isNumeric = function(val){
        return !isNaN( parseFloat(val) ) && isFinite(val);
    };

    /*****
     * 输入是否为价格格式的数字
     * @params val 为输入
     * @return bool
     * *****/
    utils.isPrice = function(val){
        var pattern = /^(?:\d+|\d+\.\d{0,})$/;
        return pattern.test(val);
    };

    /******
     * 输入是否为邮箱
     * @params val 为输入
     * @return bool
     * ******/
    utils.isEmail = function(val){
        var pattern = /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+((\.[a-zA-Z0-9_-]{2,3}){1,2})$/;
        return pattern.test(val);
    };

    /*******
     *中文，数字，字母，下划线验证
     * @params str 待验证字符串
     * @return bool
     * *******/
    utils.validInput= function(str){
        var pattern = /^[\w\u4e00-\u9fa5]+$/gi;
        return pattern.test(str);
    };

    /****
     * 只能输入中文，数字，字母,一个中文算2个字符
     * @that 需要验证的输入框dom
     * @num 限制字符的个数
     * @return bool
     * ***/
    utils.LengthLimit = function(that,num){
        var value = $(that).val();
        if(value){
            var pattern = /^[a-zA-z0-9\u4e00-\u9fa5]{1,}$/g;
            if(!value.match(pattern)){
                alert('只能输入数字字母汉字');
                $(that).val('');
                return false;
            }
            var _length = 0;
            var zh_pattern = /[\u4e00-\u9fa5]{1,}/g;
            var result = value.match(zh_pattern);
            if(result){
                var len = result.length;
                for(var i = 0; i < len; i++){
                    _length += 2*(result[i].length);
                }
            }
            var ch_pattern = /[a-zA-Z0-9]{1,}/g;
            var ch_result = value.match(ch_pattern);
            if(ch_result){
                var ch_len = ch_result.length;
                for(var m = 0; m< ch_len ; m++){
                    _length += ch_result[m].length;
                }
            }
            if(_length > 2*num){
                alert('最多只能输入'+num+'个汉字');
                $(that).val('');
                return false;
            }
        }
    };

    /******
     * 过来boom头，如果返回的字符里面有boom头，可过滤掉
     * @params str 需要过滤的字符串
     * @return str 过滤后的字符串
     * ********/
    utils.clearBoom = function(str){
        if(str != null && str.length > 1 && str.charAt(0).charCodeAt() == 65279){
            return str.substring(1);
        }else{
            return str;
        }
    };

    /*******
     * 过滤js
     * @oarams str 需要过滤的字符串
     * @return str 过滤后的字符串
     * ************/
    utils.filterScript = function(str){
        var pattern = /<script.*?>.*?<\/script>/ig;
        return str.replace(pattern, '');
    };

    /******
     * 判断是否为数组
     * @params 待验证对象
     * @return bool
     * ********/
    utils.isArray = function(obj){
        return Object.prototype.toString.call(obj) === '[object Array]';
    };

    /*******
     * 过滤空格字符两边的空格
     * @params str 待过滤的字符串
     * @return str 过滤后的字符串
     * ******/
    utils.trim = function(str) {
        return str.replace(/(^\s+)|(\s+$)/g, "");
    };

    /****
     * 过来字符串左边的空格
     * @params str 待过滤的字符串
     * @return str 过滤后的字符串
     * *****/
    utils.ltrim = function(str){
        return str.replace(/(^\s+)/g, "");
    };

    /******
     * 过滤字符串右边的空格
     * @params str 待过滤的字符串
     * @return str 过滤后的字符串
     * ******/
    utils.rtrim = function(str){
        return str.replace(/(\s+$)/g, "");
    };

    /********
     * 过滤所有空格
     * @params str 待过滤字符串
     * @return 过滤后的字符串
     * *********/
    utils.trimAllSpaces = function(str){
        return str.replace(/\s+/g,'');
    };

    /*****
     * 过滤字符串后面的指定字符
     *@params str 待过滤的字符串
     * @return str 过滤后的字符串
     * *****/
    utils.trimLast = function(str, chr) {
        if (!str || str.length == 0) return '';
        if (str.substr(str.length - chr.length) == chr) {
            return str.substr(0, str.length - chr.length);
        }
        return str;
    };

    /******
     * 加入收藏
     * 兼容ie内核，例如ie,360
     * @oarans sTitle 收藏标题
     * @params sURL 收藏链接
     * ********/
    utils.Bookmarks = function(sTitle,sURL){
        try
        {
            window.external.addFavorite(sURL, sTitle);
        }
        catch (e)
        {
            try
            {
                window.sidebar.addPanel(sTitle, sURL, "");
            }
            catch (e)
            {
                alert("加入收藏失败，请使用Ctrl+D进行添加");
            }
        }
    };

    /***
     * 设置为主页
     * 兼容ie内核，例如ie,360
     * @params obj 指定this即可.
     * @params vrl 设置为主页的url
     * ****/
    utils.setHomePage = function(obj,vrl){
        try{
            obj.style.behavior='url(#default#homepage)';obj.setHomePage(vrl);
        }
        catch(e){
            if(window.netscape) {
                try {
                    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
                }
                catch (e) {
                    alert("此操作被浏览器拒绝！请手动添加~");
                }
                var prefs = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefBranch);
                prefs.setCharPref('browser.startup.homepage',vrl);
            }else{
                alert("您的浏览器不支持，请按照下面步骤操作：1.打开浏览器设置。2.点击设置网页。3.输入："+vrl+"点击确定。");
            }
        }
    };

    /*********
     * 克隆一个对象
     * @params myObj 待克隆对象
     * @return obj 克隆后的对象
     * ***********/
    utils.clone = function(myObj){
        if(typeof(myObj) != 'object') return myObj;
        if(myObj == null) return myObj;

        var myNewObj = new Object();

        for(var i in myObj)
            myNewObj[i] = clone(myObj[i]);

        return myNewObj;
    };

    /******
     * 十六进制颜色值转化为rgb对应的值
     * @params str 十六进制颜色值
     * @return str rgb颜色值
     * ******/
    utils.colorRgb = function(str){
        var reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
        var sColor = str.toLowerCase();
        if(sColor && reg.test(sColor)){
            if(sColor.length === 4){
                var sColorNew = "#";
                for(var i=1; i<4; i+=1){
                    sColorNew += sColor.slice(i,i+1).concat(sColor.slice(i,i+1));
                }
                sColor = sColorNew;
            }
            //处理六位的颜色值
            var sColorChange = [];
            for(var i=1; i<7; i+=2){
                sColorChange.push(parseInt("0x"+sColor.slice(i,i+2)));
            }
            return "rgb(" + sColorChange.join(",") + ")";
        }else{
            return sColor;
        }
    };

    /******
     * rgb颜色值转换为十六进制颜色值
     * @params rgb rgb颜色值
     * @return 十六进制颜色值
     * *********/
    utils.rgb2hex = function(rgb) {
        rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        function hex(x) {
            return ("0" + parseInt(x).toString(16)).slice(-2);
        }
        return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
    };

    /**
     * 无冲突方法
     * **/
    utils.noConflict = function(){
        root.utils = previousUtils;
    }
}.call(this));