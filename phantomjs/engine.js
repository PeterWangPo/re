// init begin
var $g = {};
$g.fs = require('fs');
$g.md5 = require('./md5').md5;
$g.childProcess = require('child_process');
$g.system = require('system');
$g.utils = require('utils');
$g.common = require('./common.js').create($g);
$g.pwd = $g.fs.workingDirectory;
$g.sep = $g.fs.separator;
$g.taskPath = $g.pwd;
$g.vcodeImagePath = $g.pwd;
$g.vcodeTextPath = $g.pwd;
$g.lockFilePath = false;
$g.unLockFilePath = false;
$g.scriptPath = $g.pwd + $g.sep + "config.js";
$g.inDebug = true;
var path_trans = false;
var imgSuffix = ".jpg";
var curTime = new Date();
var start_time = curTime.getTime();
// for logs
var TASK_SUCCESS = 0,
    TASK_FAILED = 1,
    TASK_NOT_RUN = 2,
    TASK_CODE_ERROR = 3;
var result = TASK_NOT_RUN;
var run_timeout = 10 * 60 * 1000;
var default_step_timeout = 90 * 1000;
// args
var scriptJsonFile = false;
var taskId = false;
var isSetBType = false;
var pcode_prefix = "";
var enableStepCapture = false;
var isSpecialSite = false;
var tc_ip = '';
var post_file_path = $g.pwd;
var post_ret_file_path = $g.pwd;
var systemUserAgent = "Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/534.34 (KHTML, like Gecko) Chrome/33.0.1750.117 Safari/534.34";
var defaultUserAgent = systemUserAgent;
var useSystemUserAgent = false;
var useEnglish = false;

$g.frameOffset = false;
// parse args
$g.$nothrow(function() {
    $g.common.arg.getArg(function(name, value) {
        if (name == "--script") {
            scriptJsonFile = value || false;
        } else if (name == "--task") {
            taskId = value;
        } else if (name == '--tc_ip') {
            tc_ip = value;
        } else if (name == "--pcode") {
            pcode_prefix = value;
        } else if (name == "--vcode") {
            $g.inDebug = false;
            path_trans = true;
            $g.vcodeImagePath = value + $g.sep + "image";
            $g.vcodeTextPath = value + $g.sep + "text";
            post_file_path = value + $g.sep + "post_files";
            post_ret_file_path = value + $g.sep + "post_files_ret";
        } else if (name == '--use_sys_brw') {
            useSystemUserAgent = true;
        } else if (name == '--use_en_lang') {
            useEnglish = true;
        } else if (name == '--bua') {
            if (value.startsWith('"')) value = value.substr(1, value.length - 2);
            console.log('set user agent to: ' + value);
            defaultUserAgent = value;
        } else if (name == "--btc" || name == '--cbrw') {
            isSetBType = true;
        } else if (name == '--dbg') {
            $g.inDebug = true;
        } else if (name == '--cap') {
            enableStepCapture = true;
        } else if (name == '--rtimeout') {
            run_timeout = parseInt(value);
        } else if (name && (name.endsWith("browser_engine\\engine.js") || name.endsWith("browser_engine/engine.js"))) {
            if ($g.path.isAbsolute(name)) {
                $g.scriptPath = $g.path.parent(name) + $g.sep + "config.js";
            }
        }
    });
});

if (useSystemUserAgent) defaultUserAgent = systemUserAgent;

// browser settings
var viewPortSizes = [
    {
        width: 1366,
        height: 768
    },{
        width: 1280,
        height: 800
    }
];
var casperSettings = {
    timeout: run_timeout,
    stepTimeout: default_step_timeout,
    onStepTimeout:actionStepTimeout
};
casperSettings.pageSettings = {
    resourceTimeout : 120 * 1000
};
casperSettings.pageSettings.userAgent = defaultUserAgent;

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
$g.logEleNotExist = function(selector) {
    $g.debug($g.acts.current.name + ": Element not exist. " + selector);
    $g.log.append($g.acts.current.name, ": Element not exist. " + selector);
}

// casper creator and task loader
var casper = null;
var taskConfig = null;
var totalSize = 0;
var isOckSaved = false;

function loadSettings() {
    $g.$nothrow(function() {
        if ($g.fs.exists($g.scriptPath)) {
            var json = $g.fs.read($g.scriptPath);
            json = JSON.parse(json);
            if (json.userAgent) {
                casperSettings.pageSettings.userAgent = json.userAgent;
            }
            if (json.viewportSize) {
                casperSettings.viewportSize = json.viewportSize;
            }
            if (json.debug) {
                $g.inDebug = true;
            }
        }
    });
}
$g.getResponseData = function() {
    return taskConfig.responseData;
};
$g.setLoadImages = function(l) {
    taskConfig.loadImages = l;
}
function fetchResponse(url) {
    if (taskConfig.response && taskConfig.responseData) return;
    if ($g.utils.isString(taskConfig.response.url)) {
        if (taskConfig.response.url != url) return;
    } else {
        var found = false;
        for (var i = 0; i < taskConfig.response.url.length; ++i) {
            if (taskConfig.response.url[i] == url) {
                found = true;
                break;
            }
        }
        if (!found) {
            return;
        }
    }
    if (taskConfig.response.hiddenForm) {
        var selector = taskConfig.response.hiddenForm + " input[type='hidden']";
        if (!casper.exists(selector)) return;
        var eles = casper.getElementsInfo(selector);
        if (eles.length == 0) return;
        taskConfig.responseData = {form:[]};
        if (taskConfig.response.getAction) {
            var ele = casper.getElementInfo(taskConfig.response.hiddenForm);
            taskConfig.responseData.action = ele.attributes['action'];
        }
        for (var i = 0; i < eles.length; ++i) {
            taskConfig.responseData.form.push({name:eles[i].attributes['name'], value:eles[i].attributes['value']});
        }
        taskConfig.responseData.url = url;
        //$g.debug(taskConfig.responseData);
        return;
    }
}
var debugRequest = true, requests = [], reqHeaders = [], responses = [], calcNetworkSize = false;
function abortRequest(requestData, networkRequest) {
    if (taskConfig.ignoreUrls) {
        var ignoreUrls = $g.$ARR(taskConfig.ignoreUrls);
        for (var i = 0; i < ignoreUrls.length; ++i) {
            if (requestData.url.indexOf(ignoreUrls[i]) != -1) {
                networkRequest.abort();
                return true;
            }
        }
    }
    if (requestData.url.startsWith('data:')) {
        networkRequest.abort();
        return true;
    }
    if (taskConfig.ignoreGoogle && (requestData.url.startsWith('http://googleads.g.doubleclick.net/pagead/ads?') ||
        requestData.url.startsWith('http://googleads.g.doubleclick.net/pagead/') ||
        requestData.url.indexOf('www.google.com/') != -1)) {
        networkRequest.abort();
        return true;
    }
    if (taskConfig.ignoreFB && requestData.url.indexOf('.facebook.com/') != -1) {
        networkRequest.abort();
        return true;
    }
    return false;
}
function abortImageRequest(requestData, networkRequest) {
    var imgPattern1 = new RegExp(".+/.+(\.jpg|\.gif|\.png)$", "i");
    if (imgPattern1.test(requestData.url)) {
        //$g.debug(requestData.url);
        networkRequest.abort();
        return true;
    }
    return false;
}
function createCasper() {
    loadSettings();
    var ret = false;
    if (taskId) {
        taskConfig = $g.$json(scriptJsonFile);
        ret = taskConfig !== false;
    }
    casperSettings.viewportSize = viewPortSizes[$g.math.randomBetween(0, viewPortSizes.length - 1)];
    if (ret) {
        if (taskConfig.homeUrl.indexOf('m.39.net/zpb') != -1) {
            isSpecialSite = true;
            casperSettings.viewportSize = viewPortSizes[0];
        }
        if (taskConfig.timeout) {
            casperSettings.timeout = taskConfig.timeout;
        }
        if (debugRequest) {
            casperSettings.onResourceRequested = function(casper, requestData, networkRequest) {
                if (abortRequest(requestData, networkRequest)) return;
                if (taskConfig.loadImages !== true){
                    if (abortImageRequest(requestData, networkRequest)) return;
                    requests.push(requestData.url);
                } else {
                    requests.push(requestData.url);
                }
                reqHeaders.push(requestData.headers);
            }
        } else {
            casperSettings.onResourceRequested = function(casper, requestData, networkRequest) {
                if (abortRequest(requestData, networkRequest)) return;
                if (taskConfig.loadImages !== true) {
                    if (abortImageRequest(requestData, networkRequest)) return;
                }
                reqHeaders.push(requestData.headers);
            }
        }
        if (taskConfig.loadPlugins === true) {
            casperSettings.pageSettings.loadPlugins = true;
        } else {
            casperSettings.pageSettings.loadPlugins = false;
        }
        casperSettings.onResourceReceived = function(casper, response) {
            if (calcNetworkSize) {
                for (var i = 0; i < response.headers.length; ++i) {
                    var hdr = response.headers[i];
                    if (hdr.name == "Content-Length") {
                        totalSize += parseInt(hdr.value);
                        break;
                    }
                }
            }
            if (debugRequest) {
                responses.push({status:response.status, url: response.url});
            }
        }
    }
    casper = require('casper').create(casperSettings);
    casper.on('page.initialized', function (page) {
        page.evaluate(function () {
            (function() {
                var fnavigator = {};
                for (var i in navigator) {
                    fnavigator[i] =  navigator[i];
                }
                if (useEnglish) {
                    fnavigator.language = 'en-US';
                    fnavigator.languages = 'en-US,en';
                } else {
                    fnavigator.language = 'zh-CN';
                    fnavigator.languages = 'zh-CN,zh';
                }
                fnavigator.onLine = true;
                fnavigator.appCodeName = 'Mozilla';
                fnavigator.product = 'Gecko';
                fnavigator.vendor = 'Google Inc.';
                fnavigator.appName = 'Netscape';
                fnavigator.platform = "Win32";
                window.navigator = fnavigator;
            })();
        });
    });
    casper.on('load.finished', function() {
        fetchResponse(casper.getCurrentUrl());
    });
    return ret;
}
var tmp = createCasper();
$g.casper = casper;

$g.setRetryTimeout = function(interval) {
    casper.options.retryTimeout = interval;
}
$g.restoreRetryTimeout = function() {
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
$g.saveHtml = function(fileName) {
    fileName = fileName || 'content.htm';
    $g.fs.write($g.getPath(fileName), casper.getHTML());
}
$g.randomPos = function() {
    var x = casper.options.viewportSize.width;
    var y = casper.options.viewportSize.height;
}
$g.adjustOffset = function(rc) {
    rc.left += $g.frameOffset.left;
    rc.top += $g.frameOffset.top;
    rc.width += 4;
    rc.height += 4;
}
$g.adjustOffsetByFrame = function(rc) {
    if ($g.frameOffset === false) return;
    rc.left += $g.frameOffset.left;
    rc.top += $g.frameOffset.top;
    rc.width += 4;
    rc.height += 4;
}
$g.getVCodeFilePath = function(filename, suffix) {
    var filePath;
    if (path_trans) {
        filePath = $g.vcodeImagePath + $g.sep + taskId + "_";
    } else {
        filePath = $g.vcodeImagePath + $g.sep;
    }
    filePath += filename + imgSuffix;
    if (suffix) filePath += suffix;
    $g.debug(filePath);
    return filePath;
}
$g.scrollToTop = function() {
    casper.scrollTo(0, 0);
}
$g.scrollToBottom = function() {
    casper.scrollToBottom();
}
$g.dumpElementPos = function(selector) {
    var rc = casper.getElementBounds(selector);
    $g.echoLog('selector: ' + selector + '. pos: ' + JSON.stringify(rc));
}
$g.captureVCode = function(filename, selector) {
    $g.scrollToTop();
    var tmpPath = $g.getPath("tmp_" + taskId + imgSuffix);
    $g.fs.$remove(tmpPath);
    //$g.debug($g.frameOffset);
    if ($g.utils.isString(selector) && selector.length > 0) {
        if ($g.frameOffset !== false) {
            var rc = casper.getElementBounds(selector);
            $g.adjustOffset(rc);
            casper.capture(tmpPath, rc);
        } else if (isSpecialSite) {
            var rc = casper.getElementBounds(selector);
            rc.top += 669;
            casper.capture(tmpPath, rc);
        } else {
            casper.captureSelector(tmpPath, selector);
        }
    } else {
        casper.capture(tmpPath);
    }
    if ($g.inDebug) {
        var copyOfVcode = $g.getPath("vcode_copy.jpg");
        $g.fs.$cp(tmpPath, copyOfVcode);
    }
    return tmpPath;
}
function removeLockFile() {
    if ($g.lockFilePath) $g.fs.$remove($g.lockFilePath);
    if ($g.unLockFilePath) $g.fs.$remove($g.unLockFilePath);
}
$g.fail = function() {
    $g.$nothrow(function() {
        $g.capture("failed");
    });
}
$g.captureLastStep = function() {
    $g.capture("last_step");
}
$g.addStyle = function(style) {
    var h = casper.getHTML();
    if (h.indexOf(style) != -1) return;
    casper.evaluate(function(aStyle) {
        var style = document.createElement('style'),
            text = document.createTextNode(aStyle);
        style.setAttribute('type', 'text/css');
        style.appendChild(text);
        document.head.insertBefore(style, document.head.firstChild);
    }, style);
}
$g.correctBackgroundColor = function() {
    $g.addStyle('body { background-color: white }');
}
$g.capture = function(filename, selector, pos, notAdjust) {
    $g.scrollToTop();
    $g.correctBackgroundColor();
    var filePath = $g.getPath(filename) + imgSuffix;
    //$g.debug(filePath);
    //$g.debug($g.frameOffset);
    if (selector) {
        if (casper.exists(selector)) {
            if ($g.frameOffset !== false) {
                var rc = casper.getElementBounds(selector);
                $g.adjustOffset(rc);
                casper.capture(filePath, rc);
            } else {
                casper.captureSelector(filePath, selector);
            }
        }
    } else if (pos) {
        if ($g.frameOffset !== false && !notAdjust) {
            $g.adjustOffset(pos);
        }
        casper.capture(filePath, pos);
    } else {
        casper.capture(filePath);
    }
}
$g.debugCapture = function(filename, selector) {
    if (!$g.inDebug) {
        return;
    }
    $g.scrollToTop();
    $g.correctBackgroundColor();
    var filePath = $g.getPath(filename);
    //$g.debug($g.frameOffset);
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
$g.getLockFilePath = function(filename) {
    if (path_trans) {
        return $g.lockFilePath + $g.sep + taskId + "_" + filename;
    } else {
        return $g.lockFilePath + $g.sep + filename;
    }
}
$g.getVCodeTextPath = function(filename) {
    if (path_trans) {
        return $g.vcodeTextPath + $g.sep + taskId + "_" + filename;
    } else {
        return $g.vcodeTextPath + $g.sep + filename;
    }
}
$g.getPCodeTextPath = function(filename) {
    if (path_trans) {
        if (pcode_prefix.length > 0) {
            return $g.vcodeTextPath + $g.sep + pcode_prefix + "_" + filename;
        }
        return $g.vcodeTextPath + $g.sep + taskId + "_" + filename
    } else {
        return $g.vcodeTextPath + $g.sep + filename;
    }
}
$g.getPostFilePath = function() {
    if (path_trans) {
        return post_file_path + $g.sep + taskId + "_post";
    } else {
        return post_file_path + $g.sep + "_post";
    }
}
$g.getPostRetFilePath = function() {
    if (path_trans) {
        return post_ret_file_path + $g.sep + taskId + "_post_ret";
    } else {
        return post_ret_file_path + $g.sep + "_post_ret";
    }
}
function cookieToString(){
    var ck = '', sep = '';
    for (var i = 0; i < phantom.cookies.length; ++i) {
        ck += sep + phantom.cookies[i].name + '=' + phantom.cookies[i].value;
        sep = '; ';
    }
    return ck;
}
$g.savePostFile = function(params) {
    var data = {};
    if (params.data) $g.extend(data, params.data);
    if (tc_ip.length > 0) data.ip = tc_ip;
    data.headers['User-Agent'] = casperSettings.pageSettings.userAgent;
    data.headers['Cookie'] = cookieToString();
    var tmpPath = $g.getPath("tmp_post");
    $g.fs.write(tmpPath, JSON.stringify(data));
    $g.fs.$rename(tmpPath, $g.getPostFilePath());
}
function saveCk() {
    if (isOckSaved) return;
    isOckSaved = true;
    $g.fs.$cp($g.getPath("ock"), $g.getPath("nock"));
    $g.fs.write($g.getPath("oock"), JSON.stringify(phantom.cookies));
}
function saveLastLoopIndex(params) {
    if (!$g.acts.current.params || !$g.acts.current.params._isInLoop) return;
    var curParams = params || {};
    if (!curParams._isInLoop || curParams._loopIndex != $g.acts.current.params._loopIndex) {
        loopResult[$g.acts.current.params._loopTag] = $g.acts.current.params._loopRealIndex;
        hasLoop = true;
    }
}
function saveResults() {
    //$g.debug("save result");
    if (hasLoop) {
        $g.fs.write($g.getPath("loop.txt"),
            JSON.stringify(loopResult));
    }
    if ($g.results) {
        $g.fs.write($g.getPath("result.txt"),
            JSON.stringify($g.results));
    }
    var hasEx = false;
    for (var p in $g.resultsEx) {
        hasEx = true;
        break;
    }
    if (hasEx) {
        $g.fs.write($g.getPath("result_ex.txt"),
            JSON.stringify($g.resultsEx));
    }
    if ($g.forms !== false) {
        $g.fs.write($g.getPath("form.txt"),
            JSON.stringify($g.forms));
    }
}
function onSuccess() {
    $g.captureLastStep();
    $g.showStepTime();
    onFinish(true);
}
// event handlings
function onErr(msg, trace) {
    $g.fail();
    $g.showStepTime();
    if (result == TASK_NOT_RUN) {
        result = TASK_CODE_ERROR;
    }
    var msgStack = [];
    var hdr = "Step: " + $g.acts.current.step + " failed. Message:" + msg;
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
    onFinish();
    casper.exit();
}
casper.on("error", onErr);
casper.on("timeout", function(){
    onErr("Timeout");
});
casper.on('remote.message', function(msg) {
    //casper.echo(msg);
});
function saveTargets() {
    casper.saveTargets(taskConfig.targets || false, $g.getPath("targets"));
}
function saveRequest() {
    if (requests.length > 0) {
        $g.fs.write($g.getPath("requests.txt"),
            JSON.stringify(requests));
    }
    if (responses.length > 0) {
        $g.fs.write($g.getPath("responses.txt"),
            JSON.stringify(responses));
    }
    if (reqHeaders.length > 0) {
        $g.fs.write($g.getPath("headers.txt"),
            JSON.stringify(reqHeaders));
    }
}
function onFinish(bSuc) {
    try {
        $g.log.append("exit", "Current url: " + casper.getCurrentUrl());
    } catch(e) {
        $g.log.append('exit exception', e.stack);
    }
    try {
        saveLastLoopIndex();
        saveResults();
        if (bSuc || (taskConfig.loginSteps && $g.acts.current.step > taskConfig.loginSteps)) {
            saveCk();
        }
        saveRequest();
        removeLockFile();
        saveTargets();
        $g.saveHtml();
    } catch(e) {
        $g.log.append('exit exception', e.stack);
    }
}
casper.on("exit", function() {
    if (calcNetworkSize) $g.debug("Success! Network data size: " + totalSize);
    curTime = new Date();
    curTime = curTime.getTime();
    $g.debug("-------------> Total time: " + (curTime - start_time) + " ms.");
    $g.log.finish(result);
});

// execution helper functions
$g.noop = function() {};
// action helper functions
$g.acts = {};
$g.variables = {};
$g.results = [];
$g.resultsEx = {};
$g.targets = [];
$g.forms = false;
var actionDelta = 2, hasLoop = false, loopResult = {}, allLoopVariables = {};
function _finalizeString(variables, str, prefix) {
    for (var name in variables) {
        var v = variables[name];
        if ($g.utils.isString(v) || $g.utils.isNumber(v)) {
            str = $g.replaceAll(str, "@@" + prefix + name + "@@", v);
        } else if ($g.utils.isObject(v)) {
            str = _finalizeString(v, str, prefix + name + '.');
        }
    }
    return str;
}
$g.finalizeString = function(str, ignoreLoopVariables) {
    if (str === true || str === false) return str;
    if ($g.utils.isNull(str)) return "";
    //$g.debug("Before Finalize: " + str);
    //$g.debug($g.variables);
    if (!ignoreLoopVariables && $g.loopVariables) str = _finalizeString($g.loopVariables, str, "");
    str = _finalizeString($g.tmpVariables,
        _finalizeString($g.variables, str, ""), "");
    //$g.debug("After Finalize: " + str);
    return str;
}
$g.finalizeObject = function(obj, ignoreLoopVariables) {
    for (var name in obj) {
        if ($g.utils.isString(obj[name])) {
            obj[name] = $g.finalizeString(obj[name], ignoreLoopVariables);
        } else if ($g.utils.isObject(obj[name])) {
            $g.finalizeObject(obj[name], ignoreLoopVariables);
        }
    }
}
$g.showStepTime = function() {
    if (!$g.acts.current.time) return;
    curTime = new Date();
    curTime = curTime.getTime();
    var msg = "-------------> Running time: " + (curTime - $g.acts.current.time) + " ms.";
    $g.debug(msg);
    $g.log.append($g.acts.current.name, msg);
}
$g.acts.random = function(params) {
    var b = $g.math.randomBetween(10, 40);
    var base = $g.math.randomBetween(800, 900);
    for (var i = 1; i <= 5; ++i) {
        casper.scrollTo(base + i * b, i * b + 10);
        casper.mouse.move(base + i * b, i * b + 10);
    }
};
$g.acts.move = function(ele) {
    casper.mouse.move(ele.x + 4, ele.y + 4);
}
$g.acts.scrollTo = function(sel) {
    if (typeof(sel) == "string") {
        sel = casper.getElementInfo(sel);
    }
    casper.scrollTo(sel.x, sel.y);
}
var addedActions = false;
$g.acts.ignoreAll = function(errText) {
    var params = $g.acts.current.params || false;
    $g.showStepTime();
    if (params && params.toTarget) {
        $g.targets.push({name:params.toTarget.name,data:params.toTarget.data || ''});
    }
    if (params && params.ignore) return;
    result = TASK_FAILED;
    var msg = "Operation failed and all left actions are ignored after step: " + $g.acts.current.step + ". Remain step count is: " + $g.acts.current.left + ".";
    if (errText) {
        msg += " Failed reason: " + errText;
    }
    msg += ". Current url: " + casper.getCurrentUrl();
    $g.debug(msg);
    $g.log.append($g.acts.current.name, msg);
    $g.fail();
    if (addedActions) casper.bypass($g.acts.current.left + actionDelta);
    onFinish();
    casper.exit();
};
// parse task config to steps and execute them
$g.getDelta = function(params) {
    return params.to - params._step;
}
$g.acts.to = function(params) {
    if (params.to == "end") {
        $g.acts.success();
        return;
    } else if (params.to == "last") {
        $g.acts.toEnd();
        return;
    }
    var delta = $g.getDelta(params);
    if (delta > 0) {
        $g.acts.ignore(delta - 1);
    } else if (delta < 0) {
        $g.acts.ignoreAll("Jump failed with wrong step.");
    }
}
$g.acts.success = function() {
    casper.bypass($g.acts.current.left);
};
$g.acts.toEnd = function() {
    casper.bypass($g.acts.current.left - 1);
};
$g.acts.continue_loop = function(params) {
    if (params._isInLoop) casper.bypass(params._continueLoop);
};
$g.acts.exit_loop = function(params) {
    if (params._isInLoop) casper.bypass(params._exitLoop);
};
$g.acts.toLabel = function(label, params) {
    if (label == '@@jump_label@@') label = $g.jump_label;
    if ($g.labels[label]) {
        $g.debug("Jump to label: "+label);
        $g.acts.ignore($g.labels[label] - params._step - 1);
    } else if (params._isInLoop && $g.loopLabels[params._loopTag][params._loopIndex][label]) {
        $g.debug("Jump to loop label: "+label);
        $g.acts.ignore($g.loopLabels[params._loopTag][params._loopIndex][label] - params._step - 1);
    } else {
        $g.acts.ignoreAll("Jump failed with wrong step tag: "+label);
    }
};
$g.acts.ignore = function(step) {
    casper.bypass(step);
};
$g.acts.update = function(params) {
    if (params._show_step) {
        return;
    }
    saveLastLoopIndex(params);
    $g.loopVariables = false;
    if (params._isInLoop && allLoopVariables[params._loopTag]) {
        if (params._loopRealIndex < allLoopVariables[params._loopTag].length) {
            $g.loopVariables = $g.clone(allLoopVariables[params._loopTag][params._loopRealIndex]);
            $g.finalizeObject($g.loopVariables, true);
        }
    }
    casper.options.stepTimeout = default_step_timeout;
    if (params.timeout) casper.options.stepTimeout = params.timeout + 2000;
    else if (params.stepTimeout) casper.options.stepTimeout = params.stepTimeout + 2000;
    else if (params._actionName == 'wait' && params.interval) {
        if ($g.utils.isNumber(params.interval)) casper.options.stepTimeout = params.interval + 2000;
        else casper.options.stepTimeout = 8000;
    }
    $g.showStepTime();
    curTime = new Date();
    $g.acts.current.time = curTime.getTime();
    $g.variables._current_url_ = casper.getCurrentUrl();
    var urlPart = $g.variables._current_url_.split('/');
    if (urlPart.length >= 2) $g.variables._current_url_last_part_ = urlPart[urlPart.length - 2];
    $g.variables._current_32bit_time_ = parseInt($g.acts.current.time / 1000);
    $g.variables._current_64bit_time_ = $g.acts.current.time;
    urlPart = $g.variables._current_url_.lastIndexOf('/');
    $g.variables._current_url_parent_ = $g.variables._current_url_.substr(0, urlPart);
    urlPart = $g.variables._current_url_parent_.indexOf('://');
    urlPart += 3;
    urlPart = $g.variables._current_url_parent_.indexOf('/', urlPart);
    $g.variables._current_url_root_ = $g.variables._current_url_parent_.substr(0, urlPart);
    $g.variables._current_page_path_ = $g.variables._current_url_parent_.substring(urlPart + 1);
    //$g.utils.dump($g.variables);
    params._show_step = true;
    //$g.debugCapture(params._actionName+params._step+".jpg");
    $g.captureLastStep();
    $g.acts.current.name = params._actionName;
    $g.acts.current.step = params._step;
    if (enableStepCapture) {
        $g.capture('step_'+params._step);
    }
    $g.acts.current.found = false;
    $g.acts.current.left = params._left;
    $g.acts.current.params = params;
    var msg = ". Index: " + $g.acts.current.step + ". Left: " + params._left;
    if (params._isInLoop) {
        msg += ". Loop index: " + params._loopIndex.toString() + ". Loop action index: " + params._loopActionIndex;
    }
    $g.debug("Running: " + $g.acts.current.name + msg);
    $g.log.append($g.acts.current.name, msg);
}
$g.acts.curStep = function() {
    return $g.acts.current.step;
}
$g.acts.clickOne = function(aSelector, index) {
    if (!index) index = 0;
    casper.evaluate(function(aSelector, index) {
        var nodes = document.querySelectorAll(aSelector);
        nodes[index].focus();
        nodes[index].click();
    }, aSelector, index);
}
$g.acts.current = {
    name: "no_step",
    step: 0,
    snapIndex: 0,
    time: (new Date()).getTime(),
    params:false
};

function TimedOutError(msg) {
    "use strict";
    Error.call(this);
    this.message = msg;
    this.name = 'TimedOutErrorOnStep';
}
TimedOutError.prototype = new Error();
function actionStepTimeout() {
    if ($g.acts.current.params && $g.acts.current.params.ignorable) return;
    var msg = "Running action on step : " + $g.acts.current.name + ' -> timeout';
    $g.debug(msg);
    $g.echoLog(msg);
    $g.showStepTime();
    throw new TimedOutError(msg);
}
$g.findPage = 0;
require("./actions.js").create(casper, $g);

function exitScript(err) {
    if (err) {
        $g.debug(err);
        $g.log.append($g.acts.current.name ? $g.acts.current.name : "unknown", err);
        throw "Failed to execute script.";
    } else {
        if (taskId) {
            if (!scriptJsonFile || !$g.fs.exists(scriptJsonFile)) {
                throw "Can't find script file";
            } else {
                throw "Failed to parse script file";
            }
        } else {
            throw "Task id is not found"
        }
    }
    casper.exit();
}
$g.labels = {};
$g.loopLabels = {};
function isBlankContent() {
    var content = '';
    try {
        content = casper.getHTML();
    } catch (ex) {
        casper.echo("exception: " + ex.toString());
    }
    return content.length == 0 || content == '<html><head><style type="text/css">body { background: #fff }</style></head><body></body></html>' ||
        content == '<html><head></head><body></body></html>';
}
function checkOpened() {
    return;
    if (isBlankContent()) {
        $g.acts.ignoreAll('Open page failed');
    }
}
function analyzeLabel(actionInfo, loopTag, j, actionIndex, loopIndex, loopCount, isLoginStepString) {
    var aAction = casper._actions[actionInfo.name];
    if (!aAction || !$g.utils.isFunction(aAction)) {
        var msg = "action is invalid:"+JSON.stringify(actionInfo);
        $g.debug(msg);
        $g.log.append("analyzeLabel", msg);
        return j;
    }
    ++j;
    if (actionInfo.label) {
        if (loopCount > 1) {
            if (!$g.loopLabels[loopTag]) {
                $g.loopLabels[loopTag] = {};
            }
            if (!$g.loopLabels[loopTag][loopIndex]) {
                $g.loopLabels[loopTag][loopIndex] = {};
            }
            $g.loopLabels[loopTag][loopIndex][actionInfo.label] = j;
        } else {
            $g.labels[actionInfo.label] = j;
            if (isLoginStepString && taskConfig.loginSteps == actionInfo.label) {
                taskConfig.loginSteps = j;
                $g.debug("login steps is resolved to: "+j);
            }
        }
    }
    return j;
}
function calcLoopIndex(actionInfo) {
    var lp = 0;
    if (actionInfo.start_index) {
        if ($g.utils.isNumber(actionInfo.start_index)) {
            lp = actionInfo.start_index;
        } else if ($g.utils.isString(actionInfo.start_index)) {
            if (actionInfo.start_index == 'fromLoopTag') {
                if ($g.variables[actionInfo.loopTag]) {
                    if ($g.utils.isNumber($g.variables[actionInfo.loopTag])) {
                        lp = $g.variables[actionInfo.loopTag];
                    } else {
                        lp = parseInt($g.variables[actionInfo.loopTag]);
                    }
                }
                
            } else {
                lp = parseInt(actionInfo.start_index);
            }
            if (isNaN(lp)) {
                $g.debug("loop start index is invalid: " + actionInfo.start_index);
                lp = 0;
            }
        }
    }
    if (lp < 0) lp = 0;
    actionInfo.start_index = lp;
}
function analyzeLabels() {
    var isLoginStepString = taskConfig.loginSteps && $g.utils.isString(taskConfig.loginSteps);
    var loopIndex = 0;
    for (var i = 0, j = 0, cnt = taskConfig.actions.length; i < cnt; ++i) {
        var actionInfo = taskConfig.actions[i];
        if (actionInfo.name == 'loop') {
            ++loopIndex;
            var loopTag;
            if (actionInfo.loopTag) {
                loopTag = actionInfo.loopTag;
            } else {
                if (actionInfo.label) {
                $g.labels[actionInfo.label] = j + 1;
                    loopTag = actionInfo.label;
                } else {
                    loopTag = 'loop_tag_' + loopIndex;
                }
                actionInfo.loopTag = loopTag;
            }
            if (actionInfo.loop_count == 'variablesCount') {
                if (actionInfo.variables && actionInfo.variables.length) {
                    actionInfo.loop_count = actionInfo.variables.length;
                } else {
                    actionInfo.loop_count = 1;
                    $g.debug("no loop vairiables in loop: " + loopTag);
                }
            }
            if (actionInfo.variables) allLoopVariables[loopTag] = actionInfo.variables;
            calcLoopIndex(actionInfo);
            var msg = "Loop " + loopTag + " start_index is: " + actionInfo.start_index.toString() + ". Loop count: " + actionInfo.loop_count;
            $g.echoLog(msg);
            $g.debug(msg);
            var lpCnt = actionInfo.loop_count - actionInfo.start_index;
            for (var lp = 0; lp < lpCnt; ++lp) {
                for (var k = 0, cnt_k = actionInfo.actions.length; k < cnt_k; ++k) {
                    j = analyzeLabel(actionInfo.actions[k], loopTag, j, k, lp, lpCnt, isLoginStepString);
                }
            }
        } else {
            j = analyzeLabel(actionInfo, '', j, 0, 0, 0, isLoginStepString);
        }
    }
    return j;
}
function addAction(actionInfo, loopTag, j, actionIndex, loopIndex, loopCount, loopActionCount, loopRealIndex) {
    var aAction = casper._actions[actionInfo.name];
    if (!aAction || !$g.utils.isFunction(aAction)) {
        return j;
    }
    if (!actionInfo.params) actionInfo.params = {};
    ++j;
    // + actionDelta + (loopCount - loopIndex) * loopActionCount - actionIndex;
    actionInfo.params._left = _totalActions - j;
    actionInfo.params._step = j;
    actionInfo.params._isInLoop = loopCount > 1;
    if (actionInfo.params._isInLoop) {
        actionInfo.params._continueLoop = loopActionCount - actionIndex - 1;
        actionInfo.params._exitLoop = (loopCount - loopIndex) * loopActionCount - actionIndex - 1;
    }
    actionInfo.params._loopActionIndex = actionIndex;
    actionInfo.params._loopIndex = loopIndex;
    actionInfo.params._loopRealIndex = loopRealIndex;
    actionInfo.params._loopTag = loopTag;
    actionInfo.params._actionName = actionInfo.name;
    aAction(actionInfo.params, actionInfo.condition);
    //console.log(JSON.stringify(actionInfo));
    return j;
}
function addActions() {
    for (var i = 0, j = 0, cnt = taskConfig.actions.length; i < cnt; ++i) {
        var actionInfo = taskConfig.actions[i];
        if (actionInfo.name == 'loop') {
            var lpCnt = actionInfo.loop_count - actionInfo.start_index;
            for (var lp = 0; lp < lpCnt; ++lp) {
                for (var k = 0, cnt_k = actionInfo.actions.length; k < cnt_k; ++k) {
                    j = addAction($g.clone(actionInfo.actions[k]), actionInfo.loopTag, j, 
                        k, lp, lpCnt, cnt_k, actionInfo.start_index + lp);
                }
            }
        } else {
            j = addAction(actionInfo, '', j, 0, 0, 0, 0, 0);
        }
    }
}
var _totalActions = 0;
function createActions() {
    result = TASK_FAILED;
    if (taskConfig.variables) {
        $g.variables = taskConfig.variables;
    }
    $g.variables.homeUrl = taskConfig.homeUrl;
    $g.debug("Open home page:"+taskConfig.homeUrl);
    var tck = $g.getPath("tck");
    if ($g.fs.exists(tck)) {
        tck = $g.$json(tck);
        if (tck) phantom.cookies = tck;
    }
    var actions = taskConfig.actions;
    if (!actions) {
        return;
    }
    taskConfig.actions = $g.$ARR(actions);
    $g.acts.current.left = actionDelta;
    $g.acts.current.name = 'open_home';
    var curTime = new Date();
    $g.acts.current.time = curTime.getTime();
    casper.options.stepTimeout = 3 * 60 * 1000;
    if (taskConfig.referer) {
        casper.start();
        casper.thenOpen(taskConfig.homeUrl, {
            "method":"get",
            "headers":{
                "Referer":taskConfig.referer
            }
        }, checkOpened);
    } else {
        casper.start(taskConfig.homeUrl, checkOpened);
    }
    // after open url, wait random time
    $g.wait($g.math.randomBetween(1, 3) * 1000);
    _totalActions = analyzeLabels();
    $g.debug("Total action count is: " + _totalActions);
    addActions();
    addedActions = true;
    $g.debug("=========all labels:");
    $g.debug($g.labels);
    $g.debug("=========all loop labels:");
    $g.debug($g.loopLabels);
    // after execute all actions, wait 3 seconds for operation being finished
    $g.wait(2 * 1000);
    casper.then(function() {
        onSuccess();
        result = TASK_SUCCESS;
    });
}

// run actions
if (tmp) {
    $g.debug("Working directory: " + $g.pwd);
    $g.$nothrow(function() {
        createActions();
        casper.run();
    }, exitScript);
} else {
    exitScript();
}
