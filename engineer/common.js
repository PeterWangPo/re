var $g = null;
if (typeof String.prototype.startsWith != 'function') {
    String.prototype.startsWith = function(str) {
        return this.slice(0, str.length) == str;
    };
}
if (typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function(substring, position) {
        substring = String(substring);

        var subLen = substring.length | 0;

        if (!subLen) return true; //Empty string

        var strLen = this.length;

        if (position === void 0) position = strLen;
        else position = position | 0;

        if (position < 1) return false;

        var fromIndex = (strLen < position ? strLen : position) - subLen;

        return (fromIndex >= 0 || subLen === -fromIndex) && (
            position === 0
            // if position not at the and of the string, we can optimise search substring
            //  by checking first symbol of substring exists in search position in current string
            || this.charCodeAt(fromIndex) === substring.charCodeAt(0) //fast false
        ) && this.indexOf(substring, fromIndex) === fromIndex;
    };
}
if (typeof String.prototype.replaceAll !== 'function') {
    String.prototype.replaceAll = function(s1, s2) {
        return this.replace(new RegExp(s1, "gm"), s2);
    }
}

function Common() {

}
Common.create = function(_$g) {
    $g = _$g;
    $g.isWin = $g.system.os.name == "windows";
    $g.$json = function(filePath) {
        if (!filePath || !$g.fs.exists(filePath)) {
            return false;
        }
        var data = false;
        $g.$nothrow(function() {
            var v = $g.fs.read(filePath);
            if (v && v.length > 0) data = JSON.parse(v);
        });
        return data;
    }
    $g.$json_from_string = function(v) {
        var data = false;
        $g.$nothrow(function() {
            if (v && v.length > 0) data = JSON.parse(v);
        });
        return data;
    }
    $g.indexOfArray = function(arr, check) {
        for (var ui = 0; ui < arr.length; ++ui) {
            if (check.indexOf(arr[ui]) != -1) {
                return ui;
            }
        }
        return -1;
    }
    $g.inArray = function(arr, check) {
        for (var ui = 0; ui < arr.length; ++ui) {
            if (check == arr[ui]) {
                return ui;
            }
        }
        return -1;
    }
    $g.extend = function(a, b, unwanted) {
        unwanted = unwanted || [];
        for(var p in b){
            if ($g.inArray(unwanted, p) == -1) a[p] = b[p];
        }
    }
    $g.clone = function(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
    $g.fs.$remove = function(path) {
        if ($g.fs.exists(path)) {
            $g.fs.remove(path);
        }
    }
    $g.fs.$rename = function(path1, path2) {
        $g.fs.$remove(path2);
        $g.fs.move(path1, path2);
    }
    $g.fs.$cp = function(path1, path2) {
        $g.fs.$remove(path2);
        if ($g.fs.exists(path1)) {
            $g.fs.copy(path1, path2);
        }
    }
    $g.fs.$mkdir = function(path) {
        if (!$g.fs.exists(path)) {
            $g.fs.makeDirectory(path);
        }
    }
    $g.fs.$md5 = function(path, fn) {
        var _fn = function(err, stdout, stderr) {
            if (!$g.isWin && !err && stdout) {
                stdout = stdout.split(' ');
                stdout = stdout[0];
            }
            fn(err, stdout, stderr);
        }
        if ($g.isWin) {
            $g.childProcess.execFile('md5sum.exe', [path], null, _fn);
        } else {
            $g.childProcess.execFile('md5sum', ['-b', path], null, _fn);
        }
    }
    $g.$nothrow = function(callback, cbErr, context) {
        try {
            if (context) {
                callback.call(context);
            } else {
                callback();
            }
        } catch (err) {
            if ($g.utils.isFunction(cbErr)) {
                if (context) {
                    cbErr.call(context, err.stack);
                } else {
                    cbErr(err.stack);
                }
            }
        }
    }
    $g.$ARR = function(ele) {
        if ($g.utils.isNull(ele)) {
            return [];
        }
        var elements = null;
        if ($g.utils.isArray(ele)) {
            elements = ele;
        } else {
            elements = [ele];
        }
        return elements;
    }
    $g.$N = function(e) {
        return e ? e : null;
    }
    $g.each = function(object, callback) {
        var name, i = 0,
            length = object.length,
            isObj = length === undefined || $g.utils.isFunction(object);
        if (isObj) {
            for (name in object) {
                if (callback(name, object[name]) === false) {
                    break;
                }
            }
        } else {
            for (; i < length;) {
                if (callback(i, object[i++]) === false) {
                    break;
                }
            }
        }
        return object;
    }
    $g.isEmpty = function(str) {
        return !str || str.length == 0;
    }
    $g.isTruthy = function(a) {
        if ($g.utils.isUndefined(a)) {
            return false;
        }
        if ($g.utils.isNull(a)) {
            return false;
        }
        if ($g.utils.isString(a)) {
            return !$g.isEmpty(a);
        }
        return !!a;
    }
    $g.$NUM = function(a, defaultValue) {
        if (!$g.utils.isUndefined(a) && $g.utils.isNumber(a)) {
            return a;
        }
        return defaultValue;
    }
    $g.replaceAll = function(s, s1, s2) {
        return s.replace(new RegExp(s1, "gm"), s2);
    }
    $g.endWith = function(s1, s2) {
        return s1.endsWith(s2);
    }
    $g.path = {
        isAbsolute: function(path) {
            if ($g.isEmpty(path)) {
                return false;
            }
            return $g.fs.isAbsolute(path);
        },
        parent: function(path) {
            if ($g.isEmpty(path)) {
                return "";
            }
            var p = path.lastIndexOf($g.sep);
            if (p == -1) {
                return "";
            }
            return path.substring(0, p);
        }
    }
    $g.math = {
        random: function(max) {
            return Math.round((Math.random() * max)) + 1;
        },
        randomBetween: function(start, end) {
            var r = Math.round((Math.random() * (end - start + 1))) + start;
            if (r > end) {
                r = end;
            }
            return r;
        }
    }
    $g.dumpArgs = function() {
        $g.utils.dump($g.system.args);
    }
    $g.trim = function(str) {
        return str.replace(/(^\s+)|(\s+$)/g, "");
    }
    $g.ltrim = function(str) {
        return str.replace(/(^\s+)/g, "");
    }
    $g.rtrim = function(str) {
        return str.replace(/(\s+$)/g, "");
    }
    $g.trimLast = function(str, chr) {
        if (!str || str.length == 0) return '';
        if (str.substr(str.length - chr.length) == chr) {
            return str.substr(0, str.length - chr.length);
        }
        return str;
    }
    $g.trimBeforeCr = function(str) {
        var pos1 = str.indexOf('\n');
        var pos2 = str.indexOf('\r');
        if (pos1 == -1 && pos2 == -1) {
            return str;
        } else if (pos1 == -1 && pos2 != -1) {
            return str.substring(0, pos2);
        } else if (pos1 != -1 && pos2 == -1) {
            return str.substring(0, pos1);
        }
        return str.substring(0, pos1 < pos2 ? pos1 : pos2);
    }
    $g.trimAfterCr = function(str) {
        var pos1 = str.lastIndexOf('\n');
        var pos2 = str.lastIndexOf('\r');
        if (pos1 == -1 && pos2 == -1) {
            return str;
        } else if (pos1 == -1 && pos2 != -1) {
            return str.substring(pos2 + 1);
        } else if (pos1 != -1 && pos2 == -1) {
            return str.substring(pos1 + 1);
        }
        var pos = pos1 < pos2 ? pos2 : pos1;
        return str.substring(pos + 1);
    }
    $g.trimBeforeLastSpace = function(str) {
        str = $g.trim(str);
        if (str.length == 0) {
            return str;
        }
        var pos = str.lastIndexOf(' ');
        if (pos == -1) {
            return str;
        }
        return str.substring(0, pos);
    }
    $g.trimBeforeNumOfSpaces = function(str, total) {
        str = $g.trim(str);
        if (str.length == 0) {
            return str;
        }
        while (total > 0) {
            var tppos = str.lastIndexOf(' ');
            if (tppos == -1) {
                break;
            }
            str = str.substr(0, tppos);
            --total;
        }
        return str;
    }
    $g.trimAllSpaces = function(str) {
        str = str.replace(/\s+/g, "").replace(/[\xF0-\xF7].../g, "").replace(/"/g, "");
        str = str.replace(/&nbsp;/g, "");
        if ($g.trimFaceImg) {
            str = str.replace(/\[.*\]/g, "");
        }
        str = str.replace(/[\[\]\{\}\(\)]+/g, "");
        return str;
    }
    $g.$trimArr = function(str, aTrim) {
        if (!aTrim) return str;
        aTrim = $g.$ARR(aTrim);
        for (var i = 0; i < aTrim.length; ++i) {
            str = $g.$trim(str, aTrim[i]);
        }
        return str;
    }
    $g.$trim = function(str, aTrim) {
        str = $g.trim(str);
        if (!$g.utils.isString(aTrim) || aTrim.length == 0) {
            return str;
        }
        if (aTrim == "encode") {
            str = encodeURIComponent(str);
        } else if (aTrim == "beforeCR") {
            str = $g.trimBeforeCr(str);
        } else if (aTrim == "digit") {
            var re = /(\d+)/g;
            str = str.replaceAll(',', '');
            if (re.test(str)) {
                str = parseInt(RegExp.$1);
            } else {
                str = 0;
            }
            return str;
        } else if (aTrim == "afterCR") {
            str = $g.trimAfterCr(str);
        } else if (aTrim.startsWith("before:")) {
            var rpl = aTrim.substring(7);
            if (rpl.length > 0) {
                var digitStart = parseInt(rpl);
                if (!isNaN(digitStart)) {
                    str = str.substring(0, digitStart);
                } else {
                    var pos = str.indexOf(rpl);
                    if (pos != -1) {
                        return str.substring(0, pos);
                    }
                }
            }
            return "";
        } else if (aTrim.startsWith("after:")) {
            var rpl = aTrim.substring(6);
            if (rpl.length > 0) {
                var digitStart = parseInt(rpl);
                if (!isNaN(digitStart)) {
                    str = str.substring(digitStart);
                } else {
                    var pos = str.lastIndexOf(rpl);
                    if (pos != -1) {
                        return str.substring(pos + rpl.length);
                    }
                }
            }
            return "";
        } else if (aTrim.startsWith("afterIfFind:")) {
            var rpl = aTrim.substring(12);
            if (rpl.length > 0) {
                var pos = str.lastIndexOf(rpl);
                if (pos != -1) {
                    return str.substring(pos + rpl.length);
                }
            }
            return str;
        } else if (aTrim.startsWith("between:")) {
            var args = aTrim.split(":");
            if (args.length > 3) {
                args = [];
                var re = /'(.+)':'(.+)'/g;
                if (re.test(aTrim)) {
                    args = [0, RegExp.$1, RegExp.$2]
                }
            }
            if (args.length == 3) {
                var digitStart = parseInt(args[1]);
                if (!isNaN(digitStart)) {
                    var end = parseInt(args[2]);
                    str = str.substring(digitStart, end);
                } else {
                    var pos = str.indexOf(args[1]);
                    if (pos != -1) {
                        var pos2 = str.lastIndexOf(args[2]);
                        if (pos2 != -1) {
                            return str.substring(pos + args[1].length, pos2);
                        }
                    }
                }
            }
            return "";
        } else if (aTrim == "removeSpaces") {
            str = $g.trimAllSpaces(str);
        } else if (aTrim.startsWith("remove:")) {
            var rpl = aTrim.substring(7);
            str = $g.replaceAll(str, rpl, "");
        }
        return str;
    }


    return Common;
}

// for arguments
Common.arg = {};
Common.arg.getArg = function(nameOrCb, defaultValue) {
    var tmp = $g.system.args;
    if ($g.utils.isString(nameOrCb)) {
        var name = nameOrCb + "=";
        for (var i = 0, cnt = tmp.length; i < cnt; ++i) {
            if (tmp[i].startsWith(name)) {
                var aArg = tmp[i].split('=');
                return aArg.length > 1 ? aArg[1] : defaultValue;
            }
        }
        return defaultValue ? defaultValue : null;
    }
    for (var i = 0, cnt = tmp.length; i < cnt; ++i) {
        var aArg = tmp[i].split('=');
        if (nameOrCb(aArg[0], aArg.length > 1 ? aArg[1] : null)) {
            break;
        }
    }
}

// for task log
Common.log = function(path) {
    this.logs = "";
    this.logPath = path + $g.sep + "log";
    this.resultPath = path + $g.sep + "ret";
}
Common.log.prototype = {
    append: function(op, notes) {
        //notes = $g.casper.base64encode(notes);
        this.logs += op + ": " + notes + "\r\n";
        $g.fs.write(this.logPath, this.logs);
    },
    finish: function(result) {
        $g.fs.write(this.resultPath, result);
    }
}

module.exports = Common;
