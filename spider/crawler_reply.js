// init begin
var $g = {};
$g.fs = require('fs');
$g.childProcess = require('child_process');
$g.system = require('system');
$g.utils = require('utils');
$g.common = require('./common.js').create($g);
$g.pwd = $g.fs.workingDirectory;
$g.sep = $g.fs.separator;
$g.inDebug = true;
$g.taskPath = $g.pwd;
$g.frameOffset = false;
$g.results = [];
var scriptJsonFile = false;
var curTime = new Date();
var start_time = curTime.getTime();
var timeout = 10 * 60 * 1000;
var total_page = 3;
var useReplyUrl = false;

// parse args
$g.$nothrow(function() {
    $g.common.arg.getArg(function(name, value) {
        if (name == "--json") {
            scriptJsonFile = value;
        } else if (name == "--timeout") {
            timeout = parseInt(value);
        } else if (name == "--pages") {
            total_page = parseInt(value);
        } else if (name == "--reply-url") {
            useReplyUrl = true;
        }
    });
});

// browser settings
var casperSettings = {
    pageSettings: {
        userAgent: "Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/534.34 (KHTML, like Gecko) Chrome/33.0.1750.117 Safari/534.34",
        "loadImages":false,
        "loadPlugins":false
    },
    viewportSize: {
        width: 1366,
        height: 768
    },
    timeout: timeout
};

// path related
if (scriptJsonFile && $g.isWin) {
    scriptJsonFile = scriptJsonFile.replaceAll('/', '\\');
}
if (scriptJsonFile && $g.path.isAbsolute(scriptJsonFile)) {
    $g.taskPath = $g.path.parent(scriptJsonFile);
}
$g.getPath = function(filename) {
    return $g.taskPath + $g.sep + filename;
}

// task logger
var log = new $g.common.log($g.taskPath);
$g.log = log;
$g.echoLog = function(msg) {
    $g.log.append($g.acts.current.name, msg);
}

// casper creator and task loader
var casper = null;
var taskConfig = null;

function createCasper() {
    var ret;
    taskConfig = $g.$json(scriptJsonFile);
    ret = taskConfig !== false;
    if (ret) {
        if (taskConfig.loadImages === true) {
            casperSettings.pageSettings.loadImages = true;
        }
    }
    casper = require('casper').create(casperSettings);
    return ret;
}
var tmp = createCasper();
$g.casper = casper;

$g.setRetryTimeout = function(interval)
{
    casper.options.retryTimeout = interval;
}
$g.restoreRetryTimeout = function()
{
    $g.setRetryTimeout(500); // 0.5 seconds
}
$g.setRetryTimeout(500); // 0.5 seconds
// get the tick count when wait for something according to retryTimeout
$g.$ticks = function(second) {
    return Math.floor(second * 1000.0 / casper.options.retryTimeout);
}
$g.wait = function(interval, params) {
    casper.waitFor(function() {
        if (params) {
            $g.acts.update(params);
        }
        return false;
    }, $g.noop, $g.noop, interval);
}

// debug helper
$g.debug = function(msg) {
    if (!$g.inDebug) {
        return;
    }
    if ($g.utils.isString(msg)) {
        casper.echo(msg);
    } else {
        $g.utils.dump(msg);
    }
}
$g.getChecker = function(name) {
    if (taskConfig.checkers) {
        return taskConfig.checkers[name];
    }
    return false;
}
$g.saveHtml = function() {
    $g.fs.write($g.getPath("content.htm"), casper.getHTML());
}
$g.randomPos = function() {
    var x = casper.options.viewportSize.width;
    var y = casper.options.viewportSize.height;
}
$g.adjustOffset = function(rc) {
    rc.left += $g.frameOffset.left;
    rc.top += $g.frameOffset.top;
}
$g.fail = function() {
    $g.$nothrow(function() {
        $g.capture("failed");
    });
}
$g.captureLastStep = function() {
    $g.capture("last_step");
    $g.saveHtml();
}
$g.capture = function(filename, selector) {
    var filePath = $g.getPath(filename) + ".jpg";
    if (selector) {
        if ($g.frameOffset !== false) {
            var rc = casper.getElementBounds(selector);
            $g.adjustOffset(rc);
            casper.capture(filePath, rc);
        } else {
            casper.captureSelector(filePath, selector);
        }
    } else {
        casper.capture(filePath);
    }
}
$g.debugCapture = function(filename, selector) {
    if (!$g.inDebug) {
        return;
    }
    var filePath = $g.getPath(filename);
    if (selector) {
        if ($g.frameOffset !== false) {
            var rc = casper.getElementBounds(selector);
            $g.adjustOffset(rc);
            casper.capture(filePath, rc);
        } else {
            casper.captureSelector(filePath, selector);
        }
    } else {
        casper.capture(filePath);
    }
}
function saveResults() {
    if ($g.results && $g.results.length > 0) {
        $g.fs.write($g.getPath("targets.txt"),
            JSON.stringify($g.results));
    }
    if ($g.replies && $g.replies.data.length > 0) {
        $g.fs.write($g.getPath("replies.txt"),
            JSON.stringify($g.replies));
    }
}
function saveCk() {
    $g.fs.$cp($g.getPath("ock"), $g.getPath("nock"));
}
function onSuccess() {
    saveCk();
    $g.captureLastStep();
    if ($g.replies && $g.replies.data.length > 0) {
        $g.debug("replies:" + $g.replies.data.length);
    }
    phantom.exit(1);
    casper.exit();
}
// event handlings
function onErr(msg, trace) {
    $g.fail();
    var msgStack = [];
    var hdr = "Failed message:" + msg;
    $g.$nothrow(function(){
        hdr += ". Current url: " + casper.getCurrentUrl();
    });
    msgStack.push(hdr);
    if (trace && trace.length) {
        msgStack.push('TRACE:');
        trace.forEach(function(t) {
            msgStack.push(' -> ' + (t.file || t.sourceURL) + ': ' + t.line + (t.function ? ' (in function ' + t.function + ')' : ''));
        });
    }
    msgStack = msgStack.join('\n');
    $g.log.append($g.acts.current.name, msgStack);
    $g.debug(msgStack);
    phantom.exit(1);
}
casper.on("error", onErr);
casper.on("timeout", function(){
    onErr("Timeout");
});
casper.on("exit", function() {
    saveResults();
    //$g.saveHtml();
    curTime = new Date();
    curTime = curTime.getTime();
    $g.debug("-------------> Total time: " + (curTime - start_time) + " ms.");
    $g.log.finish(0);
});
/*casper.on('remote.message', function(msg) {
 casper.echo(msg);
 });*/
// execution helper functions
$g.noop = function() {};
// action helper functions
$g.acts = {};
$g.variables = {};
$g.results = [];
$g.forms = false;
$g.showStepTime = function()
{
    if ($g.acts.current.step >= 1)
    {
        curTime = new Date();
        curTime = curTime.getTime();
        var msg = "-------------> Running time: " + (curTime - $g.acts.current.time) + " ms.";
        $g.debug(msg);
        $g.log.append($g.acts.current.name, msg);
    }
};
$g.acts.random = function() {
    var b = $g.math.randomBetween(20, 50);
    for (var i = 1; i <= 5; ++i) {
        casper.mouse.move(i * b, b + (i * 2));
        casper.scrollTo(0, i * b);
    }
};
$g.acts.clickOne = function(aSelector, index) {
    if (!index) index = 0;
    casper.evaluate(function(aSelector, index) {
        var nodes = document.querySelectorAll(aSelector);
        nodes[index].focus();
        nodes[index].click();
    }, aSelector, index);
};
function exitScript(err) {
    if (err) {
        $g.debug(err);
        $g.log.append($g.acts.current.name ? $g.acts.current.name : "unknown", err);
        throw "Failed to execute script.";
    }
    casper.exit();
}
function getEleData(ele, selector) {
    var data = '';
    if (selector.from) {
        if (selector.from == 'tag') {
            data = ele.tag;
            var tgi = data.indexOf('>');
            if (tgi != -1) data = data.substring(tgi + 1);
            tgi = data.lastIndexOf('<');
            if (tgi != -1) data = data.substr(0, tgi);
            data = data.trim();
            //$g.debug(data);
        } else {
            data = ele.attributes[selector.from];
        }
    } else {
	if(selector.tag == "html"){
            data = ele.html.trim();
        }else{
            data = ele.text.trim();
        }
    }
    return data;
}
function fetchContent(selector, parent, last) {
    var sel;
    var data = '';
    var useParent = true;
    var useFrame = false;
    if (!$g.utils.isString(selector)) {
        sel = selector.selector;
        if (selector.notUseParent) useParent = false;
        if (selector.toFrame) {
            useFrame = true;
            toFrame(selector.toFrame);
        }
    } else {
        sel = selector;
    }
    if (useParent) sel = parent + sel;
    if (casper.exists(sel)) {
        //$g.debug(sel);
        var ele = casper.getElementsInfo(sel);
        if ($g.utils.isString(selector)) {
            if (useFrame) {
                casper.page.switchToParentFrame();
            }
            return ele[0].text.trim();
        } else if (selector.child) {
            var idx = selector.index ? selector.index : 0;
            data = casper.evaluate(function(sel, child, idx) {
                var n = document.querySelectorAll(sel);
                return n[idx].childNodes[child].innerText;
            }, sel, selector.child, idx);
            if (useFrame) {
                casper.page.switchToParentFrame();
            }
            return data;
        }
        if (selector.index) {
            if (selector.index == "all") {
                data = "";
                var trims = $g.$ARR(selector.trim);
                for (var i = 0; i < ele.length; ++i) {
                    var d = ele[i].text;
                    for (var j = 0; j < trims.length; ++j) {
                        d = $g.$trim(d, trims[j]);
                    }
                    data += d + "<br>";
                }
                if (useFrame) {
                    casper.page.switchToParentFrame();
                }
                return data;
            } else if ($g.utils.isArray(selector.index)) {
                data = "";
                for (var i = 0; i < selector.index.length; ++i) {
                    data += getEleData(ele[selector.index[i]], selector) + (selector.sep ? selector.sep : '');
                }
                ele = null;
            } else {
                ele = ele[selector.index];
            }
        } else {
            ele = ele[0];
        }
        //$g.debug(selector);
        if (ele) {
            data = getEleData(ele, selector);
        }
    } else if (!last) {
        data = null;
    }
    if (data && selector.trim) {
        var trims = $g.$ARR(selector.trim);
        for (var i = 0; i < trims.length; ++i) {
            data = $g.$trim(data, trims[i]);
        }
    }
    if (useFrame) {
        casper.page.switchToParentFrame();
    }
    return data;
}
function removeEmptyString(arr) {
    var d = [];
    for (var i = 0; i < arr.length; ++i) {
        var t = arr[i].trim();
        if (t.length > 0) d.push(t);
    }
    return d;
}
function checkDateTimeString(v, today) {
    if (!v || !$g.utils.isString(v) || v.length === 0) return v;
    v = v.trim();
    var pos = v.indexOf(':');
    if (pos == -1 && v.indexOf('-') == -1 && v.indexOf('/') == -1) return v;
    var newV = removeEmptyString(v.split(' '));
    if (newV.length == 1 && pos != -1) {
        // for date sample: 20:08
        return today.getFullYear() + '/' + today.getMonth() + '/' + today.getDay() + ' ' + v + ':00';
    }
    if (newV.length <= 2) return v;
    if (newV.length == 3) {
        if (newV[1].indexOf(':') != -1 || newV[2].indexOf(':') != -1) {
            return newV[0] + ' ' + newV[1] + ':' + newV[2];
        }
    }
    else if(/\w+/.test(v)){
        var date =  new Date(v);
        var time_str = date.getTime().toString();
        return time_str.substr(0, 10);
    }
    return v;
}
function checkCHPMDate(v) {
    return v.indexOf('凌晨') != -1 ||
    v.indexOf('早晨') != -1 ||
    v.indexOf('上午') != -1 ||
    v.indexOf('中午') != -1 ||
    v.indexOf('下午') != -1 ||
    v.indexOf('傍晚') != -1 ||
    v.indexOf('晚上') != -1;
}
var g_months = {
    'JAN':0,
    'FEB':1,
    'MAR':2,
    'APR':3,
    'MAY':4,
    'JUN':5,
    'JUL':6,
    'AUG':7,
    'SEP':8,
    'OCT':9,
    'NOV':10,
    'DEC':11
};
function processEnTime(v, today) {
    if(v.endsWith('hr') || v.endsWith('hrs')){
        var kk = v.split(" ");
        v = parseInt(kk[0]);
        v = v + " hours ago";
    }
    if (v.endsWith('ago')) {
        v = v.split(' ');
        if(v[0] =='an') v[0] = 1;
        var delta = parseInt(v[0]);
        if (v[1] == 'minutes' || v[1] == 'minute') {
            today.setMinutes(today.getMinutes() - delta);
        } else if (v[1] == 'hours' || v[1] == 'hour') {
            today.setHours(today.getHours() - delta);
        } else if (v[1] == 'days' || v[1] == 'day') {
            today.setDate(today.getDate() - delta);
        } else if (v[1] == 'seconds' || v[1] == 'second') {
            today.setSeconds(today.getSeconds() - delta);
        } else if (v[1] == 'months' || v[1] == 'month'){
            today.setMonth(today.getMonth()-delta);
        }
        return parseInt(today.getTime() / 1000).toString();
    } else if (v == 'just now') {
        return parseInt(today.getTime() / 1000).toString();
    } else if (v == 'Yesterday') {
        today.setDate(today.getDate() - 1);
        return parseInt(today.getTime() / 1000).toString();
    }
    v = v.toUpperCase();
    if (!v.endsWith('PM') && !v.endsWith('AM')) return false;
    var tag = ' AT ', base = 0;
    if (v.endsWith('PM')) base = 12;
    var pos = v.indexOf(tag);
    if (pos == -1) {
        return false;
    }
    var date = v.substring(0, pos);
    if (date.length == 0) return false;
    var hours = v.substring(pos + tag.length);
    hours = hours.substring(0, hours.length - 2);
    hours = hours.trim();
    if (hours.length == 0) return false;
    hours = hours.split(':');
    date = date.replaceAll(',', '');
    date = date.split(' ');
    if (date.length != 3) return false;
    today.setFullYear(date[2]);
    today.setMonth(g_months[date[0]]);
    today.setDate(parseInt(date[1]));
    today.setHours(base + parseInt(hours[0]));
    today.setMinutes(parseInt(hours[1]));
    today.setSeconds(0);
    today.setMilliseconds(0);
    return parseInt(today.getTime() / 1000).toString();
}
function formatDateTime(sec, v) {
    if (v && !$g.utils.isString(v)) return v.toString();
    v = v || "";
    if (v.length == 0) return v;
    v = v.trim();
    var today = new Date();
    var tv = processEnTime(v, today);
    if (tv !== false) {
        return tv;
    }
    var s = v;
    var ma_month = ['Jan','Februari','Mac','April','Mei','Jun','Julai','Ogos','September','Oktober','November','Disember'];
    var m_month = s.trim().split(" ");
    var m_month_digit = $g.inArray(ma_month,m_month[1]);
    if(m_month_digit !==-1){
        var m_month_digit = m_month_digit + 1;
        return m_month[2] + "-" + m_month_digit + "-" + m_month[0] + " " + m_month[3] + ":00";
    }
    if (v == "昨天") {
        today.setDate(today.getDate() - 1);
        today.setHours(0);
        today.setMinutes(0);
        today.setSeconds(0);
        today.setMilliseconds(0);
        v = parseInt(today.getTime() / 1000).toString();
    } else if (v == "前天") {
        today.setDate(today.getDate() - 2);
        today.setHours(0);
        today.setMinutes(0);
        today.setSeconds(0);
        today.setMilliseconds(0);
        v = parseInt(today.getTime() / 1000).toString();
    } else if (v.endsWith("天前")) {
        var re = /(\d+)/g, d=1;
        if (re.test(v)) {
            d = parseInt(RegExp.$1);
        }
        today.setDate(today.getDate() - d);
        today.setHours(0);
        today.setMinutes(0);
        today.setSeconds(0);
        today.setMilliseconds(0);
        v = parseInt(today.getTime() / 1000).toString();
    } else if (v.startsWith('刚刚')) {
        v = sec;
    } else if (v.startsWith('今天')) {
        var pos = v.indexOf(' ');
        if (pos != -1) {
            var nd = v.substr(pos + 1);
            nd = nd.split(':');
            var h = parseInt(nd[0]);
            var m = parseInt(nd[1]);
            today.setHours(h);
            today.setMinutes(m);
            today.setSeconds(0);
            today.setMilliseconds(0);
            v = parseInt(today.getTime() / 1000).toString();
        } else {
            v = sec;
        }
    }  else if (v.startsWith('昨天')) {
        var pos = v.indexOf(' ');
        if (pos != -1) {
            var nd = v.substr(pos + 1);
            nd = nd.split(':');
            var h = parseInt(nd[0]);
            var m = parseInt(nd[1]);
            today.setDate(today.getDate() - 1);
            today.setHours(h);
            today.setMinutes(m);
            today.setSeconds(0);
            today.setMilliseconds(0);
            v = parseInt(today.getTime() / 1000).toString();
        } else {
            v = sec;
        }
    }else if(v.startsWith("January") ||v.startsWith("February") || v.startsWith("March") ||v.startsWith("April") || v.startsWith("May") || v.startsWith("June") || v.startsWith("July") || v.startsWith("August") || v.startsWith("September") || v.startsWith("October") || v.startsWith("November") || v.startsWith("December")){
        var v = Date(v);
        var kk = v.split(" ");
        return kk[3]+"-"+(g_months[kk[1].toUpperCase()]+1)+"-"+kk[2]+" "+kk[4];
    }else if(v.endsWith('下午') || v.endsWith('中午') || v.endsWith('上午') || v.endsWith('晚上') || v.endsWith('凌晨') || v.endsWith('早上') || v.endsWith('pm') || v.endsWith('am')){
        var kk = v.split(" ");
        if(kk.length!==0 && kk[1]=='at'){
            var chs = kk[0];
            var bz = chs.split('/');
            if(v.endsWith('pm') || v.endsWith('am')){
                bz[1] = g_months[bz[1].toUpperCase()]+1;
            }else{
                bz[1] = bz[1].substr(0,bz[1].length-1);
            }
            if(v.endsWith('晚上') ||v.endsWith('下午') || v.endsWith('pm')){
                var dd = kk[2].substr(0,kk[2].length-2);
                var ds = dd.split(":");
                ds[0] = parseInt(ds[0]) + 12;
                if(ds[0] > 23) ds[0] = "00";
                ds = ds[0]+":"+ds[1]+":"+ds[2];
            }else{
                ds = kk[2].substr(0,kk[2].length-2);
            }
            var tm = bz[2] + "-" +bz[1]+"-"+bz[0]+" "+ds;
            return tm;
        }
    }else if(v.endsWith('分')){
        var kk = v.split(" ");
        var tt = kk[1].substr(0,2);
        var nd = [];
        var re = /(\d+)/g;
        nd = v.match(re);
        if(tt =='晚上' || tt =='下午'){
            nd[3]= parseInt(nd[3])+12;
            if(nd[3]>23) nd[3] = "00";
        }
        return nd[0]+"-"+nd[1]+"-"+nd[2]+" "+nd[3]+":"+nd[4]+":"+"00";
    } else if (checkCHPMDate(v)) {
        var base = 0;
        if ( v.indexOf('下午') != -1 ||
            v.indexOf('傍晚') != -1 ||
            v.indexOf('晚上') != -1) {
            base = 12;
        }
        v = v.replace('#', ':');
        if (v.startsWith('今日')) {
            var nv = v.split(' ');
            nv = nv[1].trim();
            var nd = [];
            var re = /(\d+):(\d+)/g;
            if (re.test(nv)) {
                nd[0] = RegExp.$1;
                nd[1] = RegExp.$2;
            } else {
                nd = [0, 0];
            }
            var h = base + parseInt(nd[0]);
            var m = parseInt(nd[1]);
            today.setDate(today.getDate());
            today.setHours(h);
            today.setMinutes(m);
            today.setSeconds(0);
            today.setMilliseconds(0);
            v = parseInt(today.getTime() / 1000).toString();
        } else {
            var nv = v.split(' ');
            var nd = [];
            var re = /(\d+):(\d+)/g;
            if (re.test(nv[1].trim())) {
                nd[0] = RegExp.$1;
                nd[1] = RegExp.$2;
            } else {
                nd = [0, 0];
            }
            var h = base + parseInt(nd[0]);
            var m = parseInt(nd[1]);
            v = nv[0].replace('年', '-');
            v = v.replace('月', '-');
            v = v.replace('日', '');
            v += ' '+h+':'+m+':00';
        }
    } else {
        var pos = v.indexOf('分钟前');
        if (pos != -1) {
            var nd = v.substr(0, pos).trim();
            var m = parseInt(nd);
            today.setMinutes(today.getMinutes() - m);
            today.setSeconds(0);
            today.setMilliseconds(0);
            v = parseInt(today.getTime() / 1000).toString();
        } else {
            pos = v.indexOf('秒前');
            if (pos != -1) {
                var nd = v.substr(0, pos).trim();
                var m = parseInt(nd);
                today.setSeconds(today.getSeconds() - m);
                today.setMilliseconds(0);
                v = parseInt(today.getTime() / 1000).toString();
            } else {
                pos = v.indexOf('小时前');
                if (pos != -1) {
                    var nd = v.substr(0, pos).trim();
                    var m = parseInt(nd);
                    today.setHours(today.getHours() - nd);
                    today.setMilliseconds(0);
                    v = parseInt(today.getTime() / 1000).toString();
                } else {
                    var arr = v.split(' ');
                    if (arr[0].indexOf('月') != -1) {
                        if (arr[0].indexOf('年') == -1) {
                            v = today.getFullYear() + '-' + v;
                        }
                    } else {
                        arr = arr[0].split('-');
                        if (arr.length == 2) v = today.getFullYear() + '-' + v;
                    }
                    v = v.replace('年', '-');
                    v = v.replace('月', '-');
                    v = v.replace('日', '');
                    v = v.replace('#', ':');
                }
            }
        }
    }
    return checkDateTimeString(v, today);
}
function formatUrl(url, u, preU) {
    if (url.startsWith('/')) {
        return $g.trimLast(preU + url, '/');
    }
    var t = url.substr(0, 4).toLowerCase();
    if (t != 'http') {
        if (!url.startsWith('/')) {
            url = u + '/' + url;
        } else {
            url = u + url;
        }
    }
    return $g.trimLast(url, '/');
}
function formatDigit(v) {
    if (!v || v.length == 0) return '0';
    if (!$g.utils.isString(v)) return v;
    v = v.replaceAll(',', '');
    var pos = v.indexOf('千万');
    if (pos !== -1) {
        if (pos > 0) {
            v = v.substr(0, pos).trim();
            if (v.length > 0) {
                return (parseInt(v) * 1000 * 10000).toString();
            }
        }
        return '0';
    }
    pos = v.indexOf('百万');
    if (pos !== -1) {
        if (pos > 0) {
            v = v.substr(0, pos).trim();
            if (v.length > 0) {
                return (parseInt(v) * 100 * 10000).toString();
            }
        }
        return '0';
    }
    pos = v.indexOf('万');
    if (pos !== -1) {
        if (pos > 0) {
            v = v.substr(0, pos).trim();
            if (v.length > 0) {
                return (parseInt(v) * 10000).toString();
            }
        }
        return '0';
    }
    pos = v.indexOf('千');
    if (pos !== -1) {
        if (pos > 0) {
            v = v.substr(0, pos).trim();
            if (v.length > 0) {
                return (parseInt(v) * 1000).toString();
            }
        }
        return '0';
    }
    if (v.endsWith('K')) {
        return (parseInt(parseFloat(v) * 1000 * 1000)).toString();
    }
    if (v.endsWith('M')) {
        return (parseInt(parseFloat(v) * 1000 * 1000)).toString();
    }
    v = $g.$trim(v, "digit");
    return v;
}
function fetchData(modal, parent, iid) {
    var target = {};
    var d = new Date();
    var sec = parseInt(d.getTime() / 1000);
    var u = casper.getCurrentUrl();
    var pos = u.lastIndexOf('/');
    u = u.substr(0, pos);
    var preU = u;
    pos = u.indexOf('://');
    if (pos != -1) {
        pos = u.indexOf('/', pos + 3);
        if (pos != -1) preU = u.substr(0, pos);
    }
    parent = parent || "";
    if (!$g.isEmpty(parent)) {
        parent += ' ';
    }
    for (var p in modal) {
        var sel = modal[p], v;
        if (sel == "curUrl") {
            v = casper.getCurrentUrl();
        } else if ($g.utils.isObject(sel) && sel.image) {
            v = '';
            var imgs = $g.$ARR(sel.selector);
            for (var imgi = 0; imgi < imgs.length; ++imgi) {
                var aImg = parent + imgs[imgi];
                if (casper.exists(aImg)) {
                    v = iid;
                    if (sel.suffix) v += '_'+sel.suffix;
                    $g.capture(v, aImg);
                    $g.capture(v, aImg);
                    v += ".jpg";
                    break;
                }
            }
        } else if ($g.utils.isArray(sel)) {
            var cnt = sel.length - 1;
            for (var i = 0; i <= cnt; ++i) {
                v = fetchContent(sel[i], parent, i == cnt);
                if (v && v.length > 0) {
                    break;
                }
            }
        } else {
            v = fetchContent(sel, parent, true);
        }
        if (p == 'post_time') {
            //$g.debug("post_time:"+v);
            if (!v || v.length === 0) {
                v = parseInt(d.getTime() / 1000).toString();
            } else {
                v = formatDateTime(sec, v);
            }
        } else if (p.indexOf('url') != -1) {
            //$g.debug("url:"+v);
            v = formatUrl(v, u, preU);
        } else if (p.endsWith('_count')) {
            v = formatDigit(v);
        }
        target[p] = v;
    }
    return target;
}
var replyUrl = "", pages = 1, ticks = 0, total_reply = 9999999;
function saveTarget(target) {
    var data = {pid:taskConfig.base.pid, siteid:taskConfig.base.site_id, target: target};
    if (useReplyUrl) {
        data.reply_url = taskConfig.base.reply_url;
        replyUrl = target.reply_url || taskConfig.base.reply_url;
        if ($g.isEmpty(taskConfig.base.reply_url)) {
            taskConfig.base.reply_url = replyUrl;
        }
    }
    if (taskConfig.base.rel_tb) data.rel_tb = taskConfig.base.rel_tb;
    $g.fs.write($g.getPath("target.txt"), JSON.stringify(data));
    if (target.post_count) {
        total_reply = parseInt(target.post_count) + 20;
    }
}
function fetchTarget() {
    if (!taskConfig.target) return;
    saveTarget(fetchData(taskConfig.target, false, taskConfig.base.pid));
}
$g.replies = {base:{}, data:[]};
var reply_tag = {};
$g.extend($g.replies.base, taskConfig.base);
delete $g.replies.base.pid;
var myiidIdx = 1, currentItem = 0;
function fetchReply(parent, block, reply) {
    if (!casper.exists(parent)) {
        $g.debug(parent + " not exist");
        return false;
    }
    if (taskConfig.handle_iid) {
        myiidIdx = casper.evaluate(function(p, search, nx, child, noUniqueTag, myiidIdx){
            var nodes = document.querySelectorAll(p);
            var iids={};
            for (var i = 0; i < nodes.length; ++i) {
                var n = nodes[i];
                var html = n.outerHTML;
                if (child) {
                    var find = false;
                    for (var j = 0; j < n.childNodes.length; ++j) {
                        var cn = n.childNodes[j];
                        var attr = '';
                        if (child.from == "class") {
                            attr = cn.className;
                        } else if (child.from == 'tagName') {
                            attr = cn.nodeName.toLowerCase();
                        } else {
                            attr = cn.getAttribute(child.from);
                        }
                        //console.log("nodes attr:"+child.from+" val:"+attr);
                        if (attr && attr.indexOf(child.expected) != -1) {
                            find = true;
                            html = cn.outerHTML;
                            //console.log(html);
                            break;
                        }
                    }
                    if (!find) continue;
                }
                //console.log("search: "+search);
                if(noUniqueTag){
                    var iid = "item_"+myiidIdx;
                    if (!iids[iid]) {
                        iids[iid] = true;
                        ++myiidIdx;
                        n.setAttribute('myiid', iid);
                    }
                }else{
                    for (var j = 0; j < search.length; ++j) {
                        var s = search[j];
                        //console.log("search: " + s);
                        var slen = s.length;
                        var pos = html.indexOf(s);
                        if (pos != -1) {
                            //console.log("find pos");
                            html = html.substr(pos + slen);
                            var pos2 = html.indexOf(nx);
                            if (pos2 != -1) {
                                //console.log("find pos2");
                                var iid = html.substr(0, pos2);
                                //console.log("find iid"+iid+", len:"+pos2);
                                if (!iids[iid]) {
                                    iids[iid] = true;
                                    n.setAttribute('myiid', iid);
                                }
                                break;
                            }
                        }
                    }
                }
            }
            return myiidIdx;
        }, parent, $g.$ARR(taskConfig.handle_iid.search),
        taskConfig.handle_iid.next ? taskConfig.handle_iid.next : '"',
        taskConfig.handle_iid.child, taskConfig.handle_iid.noUniqueTag, myiidIdx);
    }
    var eles = casper.getElementsInfo(parent);
    //$g.debug("elements count:"+eles.length);
    for (var i = currentItem; i < eles.length; ++i) {
        if(taskConfig.clickLoad){
            currentItem++;
        }
        var guid = eles[i].attributes[taskConfig.iid.from];
        if (reply_tag[guid]) {
            continue;
        }
        var attr = taskConfig.iid.from;
        if(taskConfig.iid.trim){
            var trims = $g.$ARR(taskConfig.iid.trim);
            for (var j = 0; j < trims.length; ++j) {
                guid = $g.$trim(guid, trims[j]);
            }
        }
        reply_tag[guid] = true;
        var p = parent + '[' + attr + "='" + guid + "']";
        if (!casper.exists(p)){
            continue;
        }
        var data = fetchData(reply, p, guid);
        data.iid = guid;
        data.guid = guid;
        data.block = block;
        if (data.user_name && data.user_name.length > 0 && data.content && data.content.length > 0) {
            if (data.content.startsWith(data.user_name)) {
                data.content = data.content.substring(data.user_name.length);
                data.content = data.content.trim();
            }
        }
        $g.replies.data.push(data);
    }
    return true;
}
var replyPagerId = 1;
function checkReplyPager(reply_pager) {
    replyPagerId = casper.evaluate(function(p, idx){
        var nodes = document.querySelectorAll(p);
        for (var i = 0; i < nodes.length; ++i) {
            var n = nodes[i];
            if (!n.getAttribute('_ppiid_')) {
                n.setAttribute('_ppiid_', idx.toString());
                ++idx;
            }
        }
        return idx;
    }, reply_pager, replyPagerId);
    $g.debug("total reply pagers:"+(replyPagerId - 1));
    for (var i = 1; i < replyPagerId; ++i) {
        var s = reply_pager + "[_ppiid_='" + i.toString() + "']";
        if (casper.visible(s)) {
            $g.debug("click replyPagerId selector:"+s);
            casper.click(s);
            return true;
        }
    }
    return false;
}
function checkReplyPagers() {
    if (!taskConfig.reply_pager) return false;
    var rps = $g.$ARR(taskConfig.reply_pager);
    for (var i = 0; i < rps.length; ++i) {
        checkReplyPager(rps[i]);
    }
}
function backFrame(aFrame) {
    if (aFrame !== false) {
        casper.page.switchToParentFrame();
    }
}
function fetchReplies(aFrame) {
    if (aFrame !== false) {
        toFrame(aFrame);
    }
    if (taskConfig.emptyReply) {
        if (casper.exists(taskConfig.emptyReply) && casper.visible(taskConfig.emptyReply)) {
            backFrame(aFrame);
            return true;
        }
    }
    if (ticks > 0) {
        --ticks;
        if (taskConfig.curPage && casper.exists(taskConfig.curPage)) {
            var pg = casper.fetchText(taskConfig.curPage).trim();
            pg = $g.$trim(pg, "digit");
            if (pg == pages.toString()) {
                ticks = 0;
            }
        }
        if (ticks > 0) {
            backFrame(aFrame);
            return false;
        }
    }
    $g.debug("in page: " + pages);
    ++pages;
    if (checkReplyPagers()) {
        ticks = $g.$ticks(4);
        backFrame(aFrame);
        return false;
    }
    ticks = $g.$ticks(12);
    var ret = false;
    for (var p in taskConfig.blocks) {
        var items = [];
        if (typeof(taskConfig.blocks[p]) == "string") {
            items.push(taskConfig.blocks[p]);
        } else {
            items = taskConfig.blocks[p];
        }
        for (var i = 0; i < items.length; ++i) {
            var parent = items[i];
            if (taskConfig.blockParent) {
                var pIndex = taskConfig.blockParent[p];
                //$g.debug(pItem);
                casper.evaluate(function(s, i){
                    var ns = document.querySelectorAll(s);
                    if (i < ns.length) {
                        ns[i].setAttribute('mybpiid', i.toString());
                    }
                }, taskConfig.blockParent.selector, pIndex);
                parent = taskConfig.blockParent.selector + "[mybpiid='"+(pIndex.toString())+"'] " + parent;
            }
            ret |= fetchReply(parent, p, taskConfig.reply);
        }
    }
    if (pages > total_page || $g.replies.length >= total_reply || !casper.visible(taskConfig.pager) ) {
        backFrame(aFrame);
        return true;
    }
    if (!ret) {
        backFrame(aFrame);
        return true;
    }
    ret = false;
    $g.acts.random();
    if (taskConfig.pager) {
        var pagers = $g.$ARR(taskConfig.pager), found = false;
        for (var i = 0; i < pagers.length; ++i) {
            if (pagers[i] == "scroll") {
                casper.scrollToBottom();
                found = true;
                break;
            } else {
                var pager = pagers[i];
                if (typeof(pager) != "string") {
                    pager = pager.selector;
                }
                pager = pager.replaceAll('@', pages);
                $g.debug("pager:"+pager);
                if (casper.exists(pager)) {
                    found = true;
                    var ei = casper.getElementInfo(pager);
                    casper.scrollTo(ei.x, ei.y);
                    casper.click(pager);
                    break;
                }
            }
        }
        if (!found) {
            $g.debug("pager not exist");
            ret = true;
        }
    } else {
        ret = true;
    }
    backFrame(aFrame);
    return ret;
}
function fetchTargets() {
    if (!taskConfig.targets) return;
    var base = {};
    $g.extend(base, taskConfig.base);
    base.tb = 'tb_news_target';
    if (base.reply_url) {
        delete base.reply_url;
    }
    delete base.pid;
    delete base.url;
    for (var i = 0; i < taskConfig.targets.selector.length; ++i) {
        if (!casper.exists(taskConfig.targets.selector[i])) {
            $g.debug(taskConfig.targets.selector[i] + " not exist");
            continue;
        }
        var eles = casper.getElementsInfo(taskConfig.targets.selector[i]);
        for (var j = 0; j < eles.length; ++j) {
            var title = eles[j].text;
            if (taskConfig.targets.title_min_length >= title.length) {
                continue;
            }
            var url = eles[j].attributes['href'];
            if (taskConfig.suffix && !url.endsWith(taskConfig.suffix)) {
                continue;
            }
            var aEle = {};
            $g.extend(aEle, taskConfig.targets);
            $g.extend(aEle, base);
            if (aEle.suffix) {
                delete aEle.suffix;
            }
            delete aEle.selector;
            delete aEle.selector;
            delete aEle.title_min_length;
            aEle.url = url;
            aEle.title = title;
            $g.results.push(aEle);
        }
    }
}
function findFrame(frameHtml) {
    var cnt = casper.page.childFramesCount();
    for (var i = 0; i < cnt; ++i) {
        casper.page.switchToChildFrame(i);
        var h = casper.getHTML();
        if (h.indexOf(frameHtml) != -1) {
            casper.page.switchToParentFrame();
            return i;
        }
        casper.page.switchToParentFrame();
    }
    return -1;
}
function toFrame(idt) {
    if (idt.html) {
        var i = findFrame(idt.html);
        if (i != -1) {
//            $g.debug("switch to frame: " + i);
            if (idt.selector) {
                casper.scrollTo(0, 0);
                var rc = casper.getElementBounds(idt.selector);
                $g.frameOffset = {top:rc.top, left:rc.left};
//                $g.debug($g.frameOffset);
            }
            casper.page.switchToChildFrame(i);
        }
    } else if (idt.selector) {
        if (casper.exists(idt.selector)) {
            var e = casper.getElementInfo(idt.selector);
            var rc = casper.getElementBounds(idt.selector);
            $g.frameOffset = {top:rc.top, left:rc.left};
            casper.page.switchToChildFrame(e.attributes.name);
        }
    } else {
        var rc = casper.getElementBounds("iframe[name='"+idt.name+"']");
        $g.frameOffset = {top:rc.top, left:rc.left};
        casper.page.switchToChildFrame(idt.name);
    }
}
function getJsonData(data, isHot) {
    var aReply = {};
    for(var p in taskConfig.data) {
        var dstP = taskConfig.data[p];
        if ($g.utils.isString(dstP)) {
            aReply[p] = data[dstP];
        } else {
            aReply[p] = '';
            for (var i = 0; i < dstP.length; ++i) {
                aReply[p] += ' ' + data[dstP[i]];
            }
        }
        if ($g.utils.isString(aReply[p])) aReply[p] = aReply[p].trim();
    }
    if (reply_tag[aReply.guid]) return;
    aReply.block = isHot ? 'hot' : 'latest';
    $g.replies.data.push(aReply);
}
function fetchJson(obj) {
    var block=obj.block, url=obj.url.replaceAll('{{newsId}}', obj.newsId);
    casper.thenOpen(url, function() {
        var h = casper.getHTML();
        $g.debug(block);
        //$g.fs.write('/apps/app.js', h);
        if (taskConfig.trim) {
            var dTrims = $g.$ARR(taskConfig.trim);
            for (var i = 0; i < dTrims.length; ++i) {
                h = $g.$trim(h, dTrims[i]);
            }
        }
        h = h.trim();
        h = h.replace(/([\d|\w])"([\d|\w])/g, '$1\\"$2');
        h = h.replace(/([\d|\w])"\\/g, '$1\\"'+"\\");
        //$g.fs.write('/apps/app.json', h);
        var data = JSON.parse(h);
        //$g.debug(data);
        if (taskConfig.subField) {
            data = data[taskConfig.subField];
        }
        for (var i = 0; i < data.length; ++i) {
            var isHot = block == 'hot';
            if (taskConfig.hotUsePre && i >= 30) {
                isHot = false;
            }
            getJsonData(data[i], isHot);
        }
    });
}
function fetchBlockData(obj) {
    casper.then(function() {
        fetchJson(obj);
    });
}
function fetchDataByJson() {
    var newsId = false;
    if ($g.utils.isString(taskConfig.newsId)) {
        $g.$trim(casper.getCurrentUrl(), taskConfig.newsId);
    } else {
        if (taskConfig.newsId.fromCode) {
            var tmp = casper.evaluate(function(n){
                return window[n] ? window[n] : false;
            }, taskConfig.newsId.fromCode);
            if (tmp) {
                newsId = tmp;
            }
        }
    }
    if (!newsId || newsId.length == 0) {
        $g.debug("no newid");
        return;
    }
    $g.debug("newid:" + newsId);
    for(var p in taskConfig.requestUrlTemplate) {
        fetchBlockData({block:p, url:taskConfig.requestUrlTemplate[p], newsId:newsId});
    }
}
function checkOneElementExist(eles) {
    for (var i = 0; i < eles.length; ++i) {
        if (casper.exists(eles[i])) {
            return eles[i];
        }
    }
    return false;
}
function createActions() {
    $g.debug(taskConfig.base.url);
    casper.start(taskConfig.base.url);
    if (taskConfig.waitFor) {
        var waitFor = $g.$ARR(taskConfig.waitFor);
        $g.debug("wait for:"+waitFor[0]);
        casper.waitFor(function() {
            var wf = checkOneElementExist(waitFor);
            if (wf !== false) {
                $g.debug("wait for is:"+wf);
                waitFor = wf;
                return true;
            }
            return false;
        }, $g.noop, function() {
            $g.debug("failed to wait for");
            casper.exit();
        }, 10*1000);
        casper.then(function(){
            var ei = casper.getElementInfo(waitFor);
            casper.scrollTo(ei.x, ei.y);
        });
        casper.wait(15000);
        if (taskConfig.scrollToReply) {
            casper.then(function(){
                var ei = casper.getElementInfo(taskConfig.scrollToReply);
                casper.scrollTo(ei.x, ei.y);
            });
            casper.wait(15000);
        }
    }
    casper.then(function(){
        casper.evaluate(function() {
            var style = document.createElement('style'),
                text = document.createTextNode('body { background: #fff }');
            style.setAttribute('type', 'text/css');
            style.appendChild(text);
            document.head.insertBefore(style, document.head.firstChild);
        });
        if (taskConfig.hideElements) {
            var toHides = $g.$ARR(taskConfig.hideElements);
            for (var i = 0; i < toHides.length; ++i) {
                casper.evaluate(function(s) {
                    var ns = document.querySelectorAll(s);
                    for (var i = 0; i < ns.length; ++i) {
                        ns[i].style.display = 'none';
                    }
                }, toHides[i]);
            }
        }
    });
    if(taskConfig.requireElements){
        casper.waitFor(function() {
            var requireEle = $g.$ARR(taskConfig.requireElements);
            var rewf = checkOneElementExist(requireEle);
            if (rewf !== false) {
                return true;
            }
            return false;
        }, $g.noop, function() {
            $g.debug("check require elements failure");
            casper.exit();
        }, 10*1000);
    }
    casper.then(function() {
        if (taskConfig.clickToReply) {
            if (taskConfig.target) {
                var news_target  = fetchData(taskConfig.target);
                casper.click(taskConfig.clickToReply);
                casper.wait(5000);
                casper.then(function(){
                    news_target.reply_url = casper.getCurrentUrl();
                    saveTarget(news_target);
                });
            }
        } else {
            $g.capture("target");
            fetchTarget();
        }
    });
    if (useReplyUrl && taskConfig.reply) {
        casper.then(function(){
            if ($g.isEmpty(replyUrl)) {
                return;
            }
            casper.then(function(){
                $g.replies.base.reply_url = replyUrl;
                if(taskConfig.resetToShowReply){
                    if(casper.exists(taskConfig.resetToShowReply) && casper.visible(taskConfig.resetToShowReply)){
                        casper.click(taskConfig.resetToShowReply);
                        casper.wait(15000);
                    }
                }
                if (taskConfig.clickToShowReply) {
                    var ctsr = $g.$ARR(taskConfig.clickToShowReply);
                    var wf = checkOneElementExist(ctsr);
                    if (wf !== false) {
                        $g.debug("click is:"+wf);
                        casper.click(wf);
                    } else {
                        $g.debug("failed to wait for click");
                        casper.exit();
                    }
                } else if (taskConfig.noOpenReplyUrl !== true) {
                    $g.debug(replyUrl);
                    casper.open(replyUrl);
                }
                casper.wait(15000);
                if (taskConfig.replyWaitFor) {
                    casper.waitFor(function() {
                        var rwf = $g.$ARR(taskConfig.replyWaitFor);
                        var wf = checkOneElementExist(rwf);
                        if (wf !== false) {
                            var ei = casper.getElementInfo(wf);
                            casper.scrollTo(ei.x, ei.y);
                            $g.debug("wait for reply is:"+wf);
                            casper.scrollToBottom();
                            return true;
                        }
                        return false;
                    }, $g.noop, function() {
                        $g.debug("failed to wait for reply wait");
                        casper.exit();
                    }, 15*1000);
                    casper.then(function() {
                        casper.scrollToBottom();
                        casper.wait(5 * 1000);
                    });
                } else {
                    casper.wait(5 * 1000);
                }
            });
            casper.then(function(){
                fetchTargets();
            });
            casper.then(function(){
                var aFrame = false;
                if (taskConfig.toFrame) {
                    aFrame = {};
                    $g.extend(aFrame, taskConfig.toFrame);
                    delete taskConfig.toFrame;
                }
                if (taskConfig.useJson) {
                    casper.then(fetchDataByJson);
                } else {
                    casper.waitFor(function() {
                        return fetchReplies(aFrame);
                    }, $g.noop, $g.noop, timeout);
                }
            });
        });
    }
    casper.then(function(){
        onSuccess();
    });
}
// run actions
if (tmp) {
    $g.$nothrow(function() {
        createActions();
        casper.run();
    }, exitScript);
} else {
    exitScript();
}
