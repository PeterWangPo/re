var casper, $g;
var FIND_TIME_OUT = 15 * 60 * 1000;
var VCODE_TIME_OUT = 6 * 60 * 1000;
var OP_TIME_OUT = 90 * 1000;
var VCODE_STAT_READY = 0,
    VCODE_STAT_INPUTED = 1,
    VCODE_STAT_ACTIONED = 2,
    VCODE_STAT_MD5 = 3;

function Actions() {

}
function trimData(trims, data) {
    if (!trims) return data;
    var trims = $g.$ARR(trims);
    for (var i = 0; i < trims.length; ++i) {
        data = $g.$trim(data, trims[i]);
    }
    return data;
}
function setVar(opt) {
    if (!opt) return;
    for (var name in opt) {
        $g.variables[name] = $g.finalizeString(opt[name]);
    }
}
function callScript(params) {
    if (params.name) {
        casper.evaluate(function(n, p){
            window[n](p);
        }, params.name, params.params);
    } else if (params.from) {
        var ele = casper.getElementsInfo(params.from);
    } else {
        casper.evaluate(function(n){
            eval(n);
        }, $g.finalizeString(params.code));
    }
}
function checkScroll(selector, resolvedSelector) {
    if (selector.scroll && casper.exists(resolvedSelector)) {
        var rc = casper.getElementBounds(resolvedSelector);
        casper.scrollTo(0, rc.top);
    }
}
function findFrame(selector, eleResolver) {
    var chks = $g.$ARR(selector.frameHtml);
    var cnt = casper.page.childFramesCount();

    for (var i = 0; i < cnt; ++i) {
        casper.page.switchToChildFrame(i);
        var found = true;
        if (chks.length > 0) {
            var h = casper.getHTML();
            //$g.fs.write('/apps/iframe'+ i.toString()+".txt", h);
            for (var j = 0; j < chks.length; ++j) {
                if (h.indexOf(chks[j]) == -1) {
                    found = false;
                    break;
                }
            }
        }
        if (found) {
            $g.debug("find iframe");
            if ($g.utils.isString(eleResolver)) {
                if (eleResolver != "body") {
                    found = casper.exists(eleResolver);
                }
            } else if ($g.utils.isFunction(eleResolver)) {
                found = eleResolver();
            }
        }
        casper.page.switchToParentFrame();
        if (found) {
            return i;
        }
    }
    return -1;
}
function findFrameAndExecute(selector, eleResolver, cb) {
    var frame = findFrame(selector, eleResolver);
    if (frame != -1) {
        casper.page.switchToChildFrame(frame);
        cb();
        casper.page.switchToParentFrame();
        return true;
    }
    if ($g.utils.isNull(selector.recursive)) {
        return false;
    }
    var cnt = casper.page.childFramesCount();
    for (var i = 0; i < cnt; ++i) {
        casper.page.switchToChildFrame(i);
        var found = findFrameAndExecute(selector, eleResolver, cb);
        casper.page.switchToParentFrame();
        if (found) {
            return true;
        }
    }
    return false;
}
function $toFrame(selector, eleResolver) {
    if ($g.utils.isNumber(selector.frame)) {
        if (selector.frame >= 0 && selector.frame < casper.page.childFramesCount()) {
            if (selector.frameSelector) {
                $g.scrollToTop();
                var rc = casper.getElementBounds(selector.frameSelector);
                $g.frameOffset = {top:rc.top, left:rc.left};
                $g.debug($g.frameOffset);
            }
            casper.page.switchToChildFrame(selector.frame);
            return true;
        }
    } else if ($g.utils.isString(selector.frame)) {
        var frameName = $g.finalizeString(selector.frame);
        $g.debug("frame name resolve to:" + frameName);
        $g.scrollToTop();
        var rc = casper.getElementBounds("iframe[name='"+frameName+"']");
        $g.frameOffset = {top:rc.top, left:rc.left};
        casper.page.switchToChildFrame(frameName);
        return true;
    } else {
        var frame = findFrame(selector, eleResolver);
        if (frame != -1) {
            if (selector.frameSelector) {
                $g.scrollToTop();
                var rc = casper.getElementBounds(selector.frameSelector);
                $g.frameOffset = {top:rc.top, left:rc.left};
                $g.debug($g.frameOffset);
            }
            casper.page.switchToChildFrame(frame);
            return true;
        }
    }
    return false;
}

function $backFrame() {
    $g.frameOffset = false;
    casper.page.switchToParentFrame();
}
function $toPopup(urlTag) {
    try {
        var popupPage = casper.popups.find(urlTag);
        casper.page = popupPage;
        return true;
    } catch (e) {

    }    
    return false;
}
function $backPopup() {
    casper.page = casper.mainPage;
}
function isFrame(selector) {
    if ($g.utils.isNull(selector.frame)) {
        return false;
    }
    return selector.frame === true || $g.utils.isNumber(selector.frame);
}

function $action(selector, resolvedSelector, cb) {
    if ($g.utils.isString(selector.popup)) {
        if (!$toPopup(selector.popup)) {
            return false;
        }
        cb();
        $backPopup();
    }
    else if (selector.frame === true) {
        if (!findFrameAndExecute(selector, resolvedSelector, cb)) {
            $g.debug("Faild to find element in iframe");
            return false;
        }
    } else if ($g.utils.isNumber(selector.frame)) {
        if (selector.frame < casper.page.childFramesCount()) {
            casper.page.switchToChildFrame(selector.frame);
            cb();
            casper.page.switchToParentFrame();
        } else {
            $g.debug("Faild to find element in iframe");
            return false;
        }
    } else if ($g.utils.isString(selector.frame)) {
        casper.page.switchToChildFrame(selector.frame);
        cb();
        casper.page.switchToParentFrame();
    } else {
        cb();
    }
    return true;
}
function eleFinder(finder) {
    var parents = null;
    var i;
    var contains = $g.$ARR(finder.contains);
    if (finder.parent) {
        parents = $g.$ARR(finder.parent);
        for (i = 0; i < parents.length; ++i) {
            if (!parents[i].endsWith(' ')) {
                parents[i] = parents[i] + " ";
            }
        }
    } else {
        parents = [""];
    }
    if ($g.utils.isString(finder.selector)) {
        for (i = 0; i < parents.length; ++i) {
            var parent = parents[i];
            var found = false;
            var aSelector = parent + finder.selector;
            if (!casper.exists(aSelector)) {
                continue;
            }
            var items = casper.getElementsInfo(aSelector);
            for (var j = 0; j < items.length; ++j) {
                var item = items[j];
                found = contains.length > 0 ? true : false;
                for (var m = 0; m < contains.length; ++m) {
                    var txt;
                    if ($g.utils.isString(finder.useAttr)) {
                        txt = $g.trimAllSpaces(item.attributes[finder.useAttr]);
                    } else {
                        txt = $g.trimAllSpaces(item.text);
                    }
                    $g.log.append("find", txt);
                    if (finder.trim) {
                        txt = txt.replace(finder.trim, "");
                    }
                    if (m === 0 && finder.firstStartWith) {
                        if (!txt.startsWith($g.trimAllSpaces(contains[m]))) {
                            found = false;
                            break;
                        }
                    } else if (txt.indexOf($g.trimAllSpaces(contains[m])) == -1) {
                        found = false;
                        break;
                    }
                }
                if (found) {
                    return {
                        "parent": parent,
                        "item": item.tag
                    };
                }
            }
        }
        return null;
    }
    for (i = 0; i < parents.length; ++i) {
        var parent = parents[i];
        var found = false;
        var tmpRet = [], suc = true;
        var pntRet;
        for (var ai = 0; ai < finder.selector.length; ++ai) {
            var aSelector = parent + finder.selector[ai];
            if (casper.exists(aSelector)) {
                var aNewRet = casper.getElementsInfo(aSelector);
                tmpRet.push(aNewRet);
            } else {
                suc = false;
                break;
            }
        }
        if (!suc) {
            continue;
        }
        var isFromPnt = false;
        if (finder.from == "parent") {
            if (!casper.exists(parent)) {
                continue;
            }
            isFromPnt = true;
            pntRet = casper.getElementsInfo(parent);
        } else if ($g.utils.isString(finder.from)) {
            isFromPnt = true;
            if (!casper.exists(parent + finder.from)) {
                continue;
            }
            pntRet = casper.getElementsInfo(parent + finder.from);
        }
        for (var ei = 0, eicnt = tmpRet[0].length; ei < eicnt; ++ei) {
            found = true;
            for (var m = 0; m < contains.length; ++m) {
                var item = tmpRet[m][ei];
                var txt;
                if ($g.utils.isArray(finder.useAttr) && $g.utils.isString(finder.useAttr[m]) && finder.useAttr[m].length > 0) {
                    txt = $g.trimAllSpaces(item.attributes[finder.useAttr[m]]);
                } else {
                    txt = $g.trimAllSpaces(item.text);
                }
                if (finder.trim) {
                    txt = txt.replace(finder.trim, "");
                }
                for (var ci = 0; ci < contains[m].length; ++ci) {
                    if (txt.indexOf($g.trimAllSpaces(contains[m][ci])) == -1) {
                        found = false;
                        break;
                    }
                }
                if (!found) {
                    break;
                }
            }
            if (found) {
                return {
                    "parent": parent,
                    "item": isFromPnt ? pntRet[ei].tag : tmpRet[finder.from][ei].tag
                };
            }
        }
    }
    return null;
}
function _$find(finder) {
    var founds = null;
    var eleChecker = function(){
        founds = eleFinder(finder);
    }
    if (finder.frame === true) {
        findFrameAndExecute(finder, eleChecker, $g.noop);
    } else if ($g.utils.isNumber(finder.frame)) {
        if (finder.frame < casper.page.childFramesCount()) {
            casper.page.switchToChildFrame(finder.frame);
            eleChecker();
            casper.page.switchToParentFrame();
        } else {
            $g.debug("Faild to find element in iframe");
            $g.acts.ignoreAll();
        }
    } else if ($g.utils.isString(finder.frame)) {
        casper.page.switchToChildFrame(finder.frame);
        eleChecker();
        casper.page.switchToParentFrame();
    } else {
        eleChecker();
    }
    return founds;
}

function _$findByIdentity(finder) {
    var contains = $g.$ARR(finder.contains);
    var founds = null;
    var eleChecker = function() {
        var parents = null;
        var i;
        founds = null;
        if (finder.parent) {
            parents = $g.$ARR(finder.parent);
            for (i = 0; i < parents.length; ++i) {
                if (!parents[i].endsWith(' ')) {
                    parents[i] = parents[i] + " ";
                }
            }
        } else {
            parents = [""];
        }
        var identityTag = false;
        if (finder.byIdentity !== true) {
            identityTag = finder.byIdentity;
        }
        for (i = 0; i < parents.length; ++i) {
            var parent = parents[i];
            var tmpSelector = parent;
            if (finder.identity) {
                tmpSelector += finder.identity[i];
            }
            if (!casper.exists(tmpSelector)) {
                continue;
            }
            var pEle = casper.getElementsInfo(tmpSelector);
            if (pEle.length === 0) {
                continue;
            }
            for (var pii = 0; pii < pEle.length; ++pii) {
                var idt = fetchIdentity(pEle[pii].tag, finder.pattern, identityTag);
                if (!idt) {
                    continue;
                }
                var tmpRet = [];
                var pntRet;
                var itemSelector = $g.trimBeforeLastSpace(parent);
                if (itemSelector.length > 0) {
                    itemSelector += " ";
                }
                itemSelector += idt + " ";
                for (m = 0; m < finder.selector.length; ++m) {
                    var selcs = $g.$ARR(finder.selector[m]);
                    for (var selci = 0; selci < selcs.length; ++selci) {
                        var tmpSelci = itemSelector + selcs[selci];
                        if (casper.exists(tmpSelci)) {
                            tmpRet.push(casper.getElementInfo(tmpSelci));
                            break;
                        }
                    }
                }
                if (tmpRet.length != contains.length) {
                    continue;
                }
                var found = true;
                for (var m = 0; m < contains.length; ++m) {
                    var item = tmpRet[m];
                    var txt;
                    if ($g.utils.isArray(finder.useAttr) && $g.utils.isString(finder.useAttr[m]) && finder.useAttr[m].length > 0) {
                        txt = $g.trimAllSpaces(item.attributes[finder.useAttr[m]]);
                    } else {
                        txt = $g.trimAllSpaces(item.text);
                    }
                    for (var ci = 0; ci < contains[m].length; ++ci) {
                        if (txt.indexOf(contains[m][ci]) == -1) {
                            found = false;
                            break;
                        }
                    }
                    if (!found) {
                        break;
                    }
                }
                if (found) {
                    founds = {
                        "parent": parent,
                        "item": pEle[pii].tag
                    };
                    break;
                }
            }
        }
        return founds != null;
    }
    if (finder.frame === true) {
        findFrameAndExecute(finder, eleChecker, $g.noop);
    } else if ($g.utils.isNumber(finder.frame)) {
        if (finder.frame < casper.page.childFramesCount()) {
            casper.page.switchToChildFrame(finder.frame);
            eleChecker();
            casper.page.switchToParentFrame();
        } else {
            $g.debug("Faild to find element in iframe");
            $g.acts.ignoreAll();
        }
    } else if ($g.utils.isString(finder.frame)) {
        casper.page.switchToChildFrame(finder.frame);
        eleChecker();
        casper.page.switchToParentFrame();
    } else {
        eleChecker();
    }

    return founds;
}

function $find(finder) {
    finder = $g.$ARR(finder);
    var founds = null;
    for (var i = 0; i < finder.length; ++i) {
        if (finder[i].byIdentity) {
            founds = _$findByIdentity(finder[i]);
        } else {
            founds = _$find(finder[i]);
        }
        if (founds) {
            founds.index = i;
            break;
        }
    }
    return founds;
}
//var _fexId = 0, _fexTag = {};
function handle_iid(block, finder) {
    if (!finder.handle_iid) {
        return;
    }
    casper.evaluate(function(p, s, nx, child){
        var nodes = document.querySelectorAll(p);
        var slen = s.length, iids={};
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
                    if (attr && attr.indexOf(child.expected) != -1) {
                        find = true;
                        html = cn.innerHTML;
                        //console.log("nodes attr:"+child.from+" val:"+attr+"html:"+html);
                        break;
                    }
                }
                if (!find) continue;
            }
            var pos = html.indexOf(s);
            if (pos != -1) {
                html = html.substr(pos + slen);
                var pos2 = html.indexOf(nx);
                if (pos2 != -1) {
                    var iid = html.substr(0, pos2);
                    //console.log("find iid"+iid+", len:"+pos2);
                    if (n.getAttribute('myiid')) continue;
                    if (!iids[iid]) {
                        iids[iid] = true;
                        n.setAttribute('myiid', iid);
                    }
                }
            }
        }
    }, block, finder.handle_iid.search, 
        finder.handle_iid.next ? finder.handle_iid.next : '"',
        finder.handle_iid.child);
}
function _findex(block, finder) {
    if (!casper.exists(block)) {
        //$g.debug(block + " not exist");
        return null;
    }
    handle_iid(block, finder);    
    var eles = casper.getElementsInfo(block);
    $g.fs.write("blocks.txt", JSON.stringify(eles));
    for (var i = 0; i < eles.length; ++i) {
        var guid = eles[i].attributes[finder.iid];
        /*if (_fexTag[_fexId] && _fexTag[_fexId][guid]) {
            continue;
        }
        if (!_fexTag[_fexId]) _fexTag[_fexId] = {};
        _fexTag[_fexId][guid] = true;*/
        var p = block + '[' + finder.iid + "='" + guid + "']";
        //$g.debug(p);
        if (!casper.exists(p)){
            continue;
        }
        p += ' ';
        var selectors = $g.$ARR(finder.selector), contains = $g.$ARR(finder.contains);
        if (contains.length != selectors.length) {
            throw "findex-> selectors and contains length is not same";
        }
        var isFind = true;
        for (var j = 0; j < selectors.length; ++j) {
            var subSels = $g.$ARR(selectors[j]), subFind = false;
            for (var k = 0; k < subSels.length; ++k) {
                var ele = p + subSels[k];
                if (!casper.exists(ele)) {
                    //$g.debug(ele);
                    continue;
                }
                ele = casper.getElementsInfo(ele);
                if (ele.length > 1) {
                    if (finder.eleIndex && finder.eleIndex[j.toString()]) {
                        ele = ele[finder.eleIndex[j.toString()]];
                    } else {
                        ele = ele[0];
                    }
                } else {
                    ele = ele[0];
                }
                var txt = ele.text;
                if (finder.useAttr) {
                    finder.useAttr = $g.$ARR(finder.useAttr);
                    if ($g.utils.isString(finder.useAttr[k]) &&
                        finder.useAttr[k].length > 0) {
                        txt = ele.attributes[finder.useAttr[k]];
                    }
                }
                txt = $g.trimAllSpaces(txt);
                if (txt.length == 0) {
                    continue;
                }
                var subContains = $g.$ARR(contains[j]);
                subFind = true;
                for (var m = 0; m < subContains.length; ++m) {
                    subContains[m] = $g.trimAllSpaces(subContains[m]);
                    if (txt.indexOf(subContains[m]) == -1) {
                        subFind = false;
                        break;
                    }
                }
                if (subFind) break;
            }
            if (!subFind) {
                isFind = false;
                break;
            }
        }
        if (isFind) {
            //$g.fs.write("block.txt", JSON.stringify(casper.getElementsInfo(p)));
            return {guid:guid,name:finder.iid};
        }
    }
    return null;
}
function $findex(finder) {
    finder = $g.$ARR(finder);
    var founds = null;
    for (var i = 0; i < finder.length; ++i) {
        var parent = $g.$ARR(finder[i].parent);
        for (var j = 0; j < parent.length; ++j) {
            founds = _findex(parent[j], finder[i]);
            if (founds) {
                founds.prefix = finder[i].prefix ? finder[i].prefix : "";
                founds.index = i;
                founds.parent = parent[j];
                break;
            }
        }
        if (founds) {
            break;
        }
    }
    return founds;
}

function fetchIdentity(found, originPattern, selector) {
    var pos = -1;
    var pattern;
    var i;
    var attrName = "";
    var tmpPatternArr = $g.$ARR(originPattern);
    var selParttern = -1;
    var tmpOrgParttern = $g.$ARR(originPattern);

    for (i = 0; i < tmpPatternArr.length; ++i) {
        pattern = tmpPatternArr[i];
        if (pattern.charAt(0) == "#") {
            pattern = "id=\"" + pattern.substring(1);
        } else if (pattern.charAt(0) == ".") {
            pattern = "class=\"" + pattern.substring(1);
        } else {
            var v = "";
            for (var j = 0; j < pattern.length; ++j) {
                if (pattern.charAt(j) == '=') {
                    attrName = pattern.substring(0, j);
                    v = pattern.substring(j + 1);
                    break;
                }
            }
            if ($g.isEmpty(attrName)) {
                throw err + 105;
            }
            pattern = attrName + "=\"" + v;
        }
        tmpPatternArr[i] = pattern;
    }
    var err = "Can't find pattern: ";
    if ($g.isEmpty(found)) {
        throw err + 111;
    }
    for (i = 0; i < tmpPatternArr.length; ++i) {
        pos = found.indexOf(tmpPatternArr[i]);
        if (pos != -1) {
            selParttern = i;
            break;
        }
    }
    if (selParttern == -1) {
        throw err + 223;
    }
    var start = -1,
        end = -1,
        tagEnd = -1,
        tagName;
    if (selector && selector.tagName) {
        tagName = selector.tagName;
    } else {
        var tmpPos = pos - 1;
        while (tmpPos >= 0) {
            if (found.charAt(tmpPos) == '<') {
                ++tmpPos;
                break;
            }
            --tmpPos;
        }
        if (tmpPos == -1) {
            throw err + 497;
        }
        for (i = tmpPos; i < found.length; ++i) {
            if (found.charAt(i) == " ") {
                tagEnd = i;
                break;
            }
        }
        if (tagEnd == -1) {
            throw err + 124;
        }
        tagName = found.substring(tmpPos, tagEnd);
        //$g.debug(tagName);
    }
    pattern = tmpPatternArr[selParttern];
    for (i = pos, dst = pos + pattern.length; i < dst; ++i) {
        if (found.charAt(i) == '"') {
            start = i + 1;
            break;
        }
    }
    for (i = pos + pattern.length; i < found.length; ++i) {
        if (found.charAt(i) == '"') {
            end = i;
            break;
        }
    }
    if (end == -1 || start == -1) {
        throw err + 145;
    }
    var value = found.substring(start, end);
    if (selector && ($g.utils.isNumber(selector.start) || $g.utils.isArray(selector.start))) {
        if ($g.utils.isArray(selector.start)) {
            start = selector.start[selParttern];
        } else {
            start = $g.$NUM(selector.start, 0);
        }
        if ($g.utils.isArray(selector.end)) {
            end = selector.end[selParttern];
        } else {
            end = $g.$NUM(selector.end, -1);
        }
        if (start !== 0 || end != -1) {
            if (end != -1) {
                value = value.substring(start, end);
            } else {
                value = value.substring(start);
            }
        }
        if (selector.attrOnly) {
            return value;
        }
    }
    var finalSelector = "";
    originPattern = tmpOrgParttern[selParttern];
    if (selector && selector.notUsePattern) {
        finalSelector = $g.replaceAll(selector.selector, "@@pattern@@", value);
    } else {
        if (originPattern.charAt(0) == "#") {
            finalSelector = "#" + value;
        } else if (originPattern.charAt(0) == ".") {
            finalSelector = tagName + "[class='" + value + "']";
        } else {
            finalSelector = tagName + "[" + attrName + "='" + value + "']";
        }
        if (selector && !$g.isEmpty(selector.selector))
        {
            finalSelector = finalSelector + " " + selector.selector;
        }
    }
    return finalSelector;
}
function finalizeFoundex(fex, selector) {
    $g.debug("fex -> selector : " + selector);
    selector = $g.finalizeString(selector);
    selector = $g.replaceAll(selector, "<<fid>>", fex.guid);
    selector = $g.replaceAll(selector, "<<fname>>", fex.name);
    selector = $g.replaceAll(selector, "<<prefix>>", fex.prefix);
    selector = $g.replaceAll(selector, "<<parent>>", fex.parent);
    var m = "fex -> resolve selector to: " + selector;
    $g.debug(m);
    $g.echoLog(m + ' ' + JSON.stringify(fex));
    return selector;
}
function $selector(selector) {
    if ($g.utils.isString(selector) || $g.utils.isNull(selector)) {
        if ($g.acts.current.foundex) {
            return finalizeFoundex($g.acts.current.foundex, selector);
        }
        return $g.finalizeString(selector);
    }
    var found = "";
    if ($g.acts.current.foundex) {
        return finalizeFoundex($g.acts.current.foundex, selector.selector);
    } else if ($g.acts.current.found) {
        found = $g.acts.current.found;
    } else {
        if (selector.findex) {
            //++_fexId;
            var fex = $findex(selector.findex);
            if (fex) {
                return finalizeFoundex(fex, selector.selector);
            } else {
                throw "No element is found for foundex:" + selector.selector;
            }
        }
        if (!selector.find) {
            return $g.finalizeString(selector.selector);
        }
        if (!$g.utils.isNull(selector.frame)) {
            selector.find.frame = selector.frame;
        }
        if (!$g.utils.isNull(selector.frameHtml)) {
            selector.find.frameHtml = selector.frameHtml;
        }
        found = $find(selector.find);
    }
    var err = "No element is found for pattern: " + selector.pattern;
    if (!found) {
        throw err + 82;
    }
    var parent = found.parent ? found.parent : "";
    var finalSelector = fetchIdentity(found.item, selector.pattern, selector);
    if (selector.parent) {
        finalSelector = selector.parent + " " + finalSelector;
    }
    if (parent && parent.length > 0 && selector.trimParent > 0) {
        parent = $g.trimBeforeNumOfSpaces(parent, selector.trimParent);
        if (parent.length > 0) {
            parent += " ";
        }
    }
    finalSelector = parent + finalSelector;
    finalSelector = $g.finalizeString(finalSelector);
    if (selector.recoverHtmlChars) {
        finalSelector = $g.replaceAll(finalSelector, "&amp;", "&");
    }
    $g.debug("resolve selector to: " + finalSelector);
    return finalSelector;
}
function captureByPos(params) {
    var rc1 = false, rc2 = false, begin=$g.$ARR(params.begin), end=$g.$ARR(params.end);
    if (params.leftBound && params.leftBound == 'end') {
        var t = begin;
        begin = end;
        end = t;
    }
    if (!params.beginIsRc) {
        for (var i = 0; i < begin.length; ++i) {
            var aSelector = $selector(begin[i]);
            if (casper.exists(aSelector)) {
                rc1 = casper.getElementBounds(aSelector);
                break;
            }
        }
    } else {
        rc1 = $g.variables[begin[0]];
    }
    if (!params.endIsRc) {
        for (i = 0; i < end.length; ++i) {
            var aSelector = $selector(end[i]);
            if (casper.exists(aSelector)) {
                rc2 = casper.getElementBounds(aSelector);
                break;
            }
        }
    } else {
        rc2 = $g.variables[end[0]];
    }
    if (!rc1 || !rc2) return;
    if (!params.beginIsRc) $g.adjustOffsetByFrame(rc1);
    if (!params.endIsRc) $g.adjustOffsetByFrame(rc2);
    var fileName = "snapshot_" + $g.acts.current.snapIndex;
    ++$g.acts.current.snapIndex;
    $g.capture(fileName, false, {left:rc1.left,top:rc1.top,width:rc2.left+rc2.width-rc1.left,height:rc2.top+rc2.height-rc1.top}, true);
}
function checkString(src, target, operator) {
    if (!$g.utils.isString(operator)) {
        return true;
    }
    operator = operator.toLowerCase();
    if (operator == "contain") {
        return src.indexOf(target) != -1;
    } else if (operator == "notcontain") {
        return src.indexOf(target) == -1;
    } else if (operator == "equal") {
        return src == target;
    } else if (operator == "notequal") {
        return src != target;
    } else if (operator == "startswith") {
        return src.startsWith(target);
    } else if (operator == "notstartswith") {
        return !src.startsWith(target);
    } else if (operator == "endswith") {
        return src.endsWith(target);
    } else if (operator == "notendswith") {
        return !src.endsWith(target);
    } else if (operator == "in") {
        target = $g.$ARR(target);
        for (var i = 0; i < target.length; ++i) {
            if (src == target[i]) {
                return true;
            }
        }
        return false;
    }
    return true;
}

function checkVar(src, target, operator, trim) {
    operator = operator.toLowerCase();
    if (trim) {
        src = $g.trim(src);
    }
    if (operator == "equal") {
        return src == target;
    } else if (operator == "notequal") {
        return src != target;
    } else if (operator == "notempty") {
        return !$g.isEmpty(src);
    } else if (operator == "empty") {
        return $g.isEmpty(src);
    }
    return false;
}
function formatSelectorFromSet(selector, sets, aSelector, checkExist) {
    for (var i = 0; i < sets.values.length; ++i) {
        var newSelector = $g.replaceAll(aSelector, '<<'+sets.name+'>>', sets.values[i]);
        checkScroll(selector, aSelector);
        if (checkExist) {
            if (casper.exists(newSelector)) {
                if (sets.toVar) {
                    $g.variables[sets.toVar] = sets.values[i];
                }
                return newSelector;
            }
        } else {
            if (casper.visible(newSelector)) {
                if (sets.toVar) {
                    $g.variables[sets.toVar] = sets.values[i];
                }
                return newSelector;
            }
        }
    }
    return false;
}
function _parseCheckers(checkers, op) {
    var suc = true;
    var aSelector;
    if (!op) {
        op = "and";
    }
    if (op == "or") {
        suc = false;
    }
    for (var i = 0, cnt = checkers.length; i < cnt; ++i) {
        var checker = checkers[i];
        var tmp = false;
        if ($g.utils.isString(checker)) {
            checker = $g.getChecker(checker);
        }
        if ($g.utils.isArray(checker)) {
            tmp = _parseCheckers(checker);
        } else if ($g.utils.isString(checker.group)) {
            tmp = _parseCheckers(checker.checkers, checker.group);
        } else {
            var type = checker.type.toLowerCase();
            var operator = checker.operator;
            if (type == "checkurl") {
                tmp = checkString(casper.getCurrentUrl(), checker.expected, operator);
            } else if (type == "checktitle") {
                tmp = checkString(casper.getTitle(), checker.expected, operator);
            } else if (type == "checkattr") {
                aSelector = $selector(checker.selector);
                if (checker.inSet) {
                    aSelector = formatSelectorFromSet(checker.selector, checker.inSet, aSelector, true);
                }
                var text = "";
                if (aSelector && $action(checker.selector, aSelector, function() {
                    if (casper.exists(aSelector)) text = casper.getElementAttribute(aSelector, checker.name);
                })) {
                    tmp = checkString(text, checker.expected, operator);
                }
            } else if (type == "checktext") {
                if (checker.variable) {
                    //$g.utils.dump($g.variables);
                    tmp = checkString($g.variables[checker.variable] ? $g.variables[checker.variable] : "", checker.expected, operator);
                } else {
                    var text = "";
                    if (!checker.fromAlert) {
                        aSelector = $selector(checker.selector);
                        if (checker.inSet) {
                            aSelector = formatSelectorFromSet(checker.selector, checker.inSet, aSelector, true);
                        }
                    } else {
                        text = $g.alertMessage;
                    }
                    if (checker.fromAlert || (aSelector && $action(checker.selector, aSelector, function() {
                            if (casper.exists(aSelector)) {
                                var teles = casper.getElementsInfo(aSelector);
                                if (teles.length > 1) {
                                    if (!checker.index) checker.index = 0;
                                    var ctmsg = 'Total elements:'+teles.length+' index:'+checker.index+". selector:"+aSelector;
                                    $g.debug(ctmsg);
                                    $g.log.append('checktext', ctmsg);
                                    if (checker.index < teles.length) {
                                        teles = checker.index ? teles[checker.index] : teles[0];
                                    } else {
                                        $g.log.append('checktext', "Element index out of bound: "+checker.index.toString()+'/'+teles.length+'. Selector:'+aSelector);
                                    }
                                } else {
                                    teles = teles[0];
                                }
                                text = $g.trimAllSpaces(teles.text);
                                //$g.echoLog(text);
                            }
                        }))) {
                        tmp = checkString(text, $g.trimAllSpaces(checker.expected), operator);
                    }
                }
            } else if (type == "checkhtml") {
                aSelector = $selector(checker.selector);
                if (checker.inSet) {
                    aSelector = formatSelectorFromSet(checker.selector, checker.inSet, aSelector, true);
                }
                var text = "";
                if (aSelector && $action(checker.selector, aSelector, function() {
                    if (casper.exists(aSelector)) {
                        var teles = casper.getElementsInfo(aSelector);
                        if (teles.length > 0) {
                            teles = checker.index ? teles[checker.index] : teles[0];
                        } else {
                            teles = teles[0];
                        }
                        text = teles.tag;
                    }
                })) {
                    tmp = checkString(text, checker.expected, operator);
                }
            } else if (type == "checkvisible") {
                aSelector = $selector(checker.selector);
                if (checker.inSet) {
                    aSelector = formatSelectorFromSet(checker.selector, checker.inSet, aSelector, false);
                }
                var visible = false;
                if (aSelector) {
                    $action(checker.selector, aSelector, function() {
                        checkScroll(checker.selector, aSelector);
                        visible = casper.exists(aSelector) && casper.visible(aSelector);
                    });
                }
                tmp = visible;
            } else if (type == "checknotvisible") {
                aSelector = $selector(checker.selector);
                var visible = false;
                $action(checker.selector, aSelector, function() {
                    checkScroll(checker.selector, aSelector);
                    visible = casper.exists(aSelector) && casper.visible(aSelector);
                });
                tmp = !visible;
            } else if (type == "checkexist") {
                aSelector = $selector(checker.selector);
                if (checker.inSet) {
                    aSelector = formatSelectorFromSet(checker.selector, checker.inSet, aSelector, true);
                }
                var exists = false;
                if (aSelector) {
                    $action(checker.selector, aSelector, function() {
                        checkScroll(checker.selector, aSelector);
                        exists = casper.exists(aSelector)
                    });
                }
                tmp = exists;
            } else if (type == "checknotexist") {
                aSelector = $selector(checker.selector);
                var exists = false;
                $action(checker.selector, aSelector, function() {
                    checkScroll(checker.selector, aSelector);
                    exists = casper.exists(aSelector)
                });
                tmp = !exists;
            } else if (type == "checkvariable") {
                if (!checker.name) {
                    tmp = checkVar(checker.value, checker.expected, operator);
                } else {
                    if ($g.utils.isUndefined($g.variables[checker.name])) {
                        tmp = false;
                    } else {
                        var v = $g.variables[checker.name];
                        if ($g.utils.isString(checker.expected)) {
                            tmp = checkString(v, checker.expected, operator);
                        } else {
                            tmp = checkVar(v, checker.expected, operator);
                        }
                    }
                }
            } else if (type == "checkpopup") {
                try {
                    casper.popups.find(checker.expected);
                    tmp = true;
                } catch (e) {
                    tmp = false;
                }
            } else if (type == 'checkcount') {
                aSelector = $selector(checker.selector);
                var eles = [];
                if (casper.exists(aSelector)) eles = casper.getElementsInfo(aSelector);
                tmp = eles.length == checker.count;
            } else if (type == 'ischecked' || type == 'isnotchecked') {
                aSelector = $selector(checker.selector);
                if (!casper.exists(aSelector)) {
                    tmp = false;
                } else {
                    tmp = casper.evaluate(function(s){
                        var ns = document.querySelectorAll(s);
                        if (ns.length === 0) {
                            return false;
                        }
                        return ns[0].checked === true;
                    }, aSelector);
                }
                if (type == 'isnotchecked') tmp = !tmp;
            }
        }
        if (tmp) setVar(checker.setVar);
        if (op == "or") {
            suc |= tmp;
        } else {
            suc &= tmp;
        }
        if (suc && op == "or") {
            break;
        } else if (!suc && op == "and") {
            break;
        }
    }
    return suc;
}
function parseCheckers(checkers, defaultValue) {
    if (!defaultValue) {
        defaultValue = false;
    } else {
        defaultValue = true;
    }
    if (!checkers) {
        return defaultValue;
    }
    if ($g.utils.isString(checkers)) {
        checkers = $g.getChecker(checkers);
        if (!checkers) {
            return defaultValue;
        }
        return _parseCheckers($g.$ARR(checkers));
    }
    return _parseCheckers($g.$ARR(checkers));
}

function checkCondition(condition) {
    if (!condition) {
        return true;
    }
    if (condition.checkVar) {
        var cons = $g.$ARR(condition.checkers);
        for (var j = 0; j < cons.length; ++j) {
            if (!$g.variables[cons[j].name]) {
                return false;
            }
            var v = $g.variables[cons[j].name];
            if (cons[j].field) {
                v = $g.variables[cons[j].name][cons[j].field];
            }
            if (!checkVar(v, cons[j].target, cons[j].operator, cons[j].trim ? true : false)) {
                return false;
            }
        }
        $g.debug("var check is success");
        return true;
    }
    if (!parseCheckers(condition.checkers, true)) {
        if (condition.failWhenFalsy) {
            $g.acts.ignoreAll(condition.errText);
        }
        return false;
    }
    return true;
}
function sendKeys(aSelector, value, ele, donotClick, append){
    if (append !== true) {
        append = false;
    }
    //var reset = append ? false : true;
    //$g.debug("reset: "+reset);
    var ef = false;
    if (ele && ele.selectorAfterReset) {
        var tmpSel = $selector(ele.selector);
        ef = $g.finalizeString(ele.selectorAfterReset);
        ef = aSelector.replace(tmpSel, ef);
    }
    //$g.debug(casper.getElementInfo("#test"));
    casper.mouseEvent("mouseover", aSelector);
    /*if (append) {
        var e = casper.getElementInfo(aSelector);
        //$g.debug(e);
        if (e.attributes['value']) {
            value = e.attributes['value'] + value;
        } else {
            var eii = casper.evaluate(function(s){
                var ns = document.querySelectorAll(s);
                if (ns.length > 0) {
                    return ns[0].value;
                }
                return false;
            }, aSelector);
            if (eii) {
                value = eii + value;
            } else {
                value = e.text + value;
            }
        }
    }*/
    casper.sendKeys(aSelector, value, {
        keepFocus: true, reset: !append
    }, ef);
    if (donotClick !== true) {
        casper.click(aSelector);
    }
}
function inputAction(ele, aSelector, bMove, append)
{
    if (append !== true) {
        append = false;
    }
    var bFrame = isFrame(ele.selector);
    var inputValue = ele.value;
    if ($g.utils.isString(inputValue)) inputValue = $g.finalizeString(inputValue);
    if (aSelector == "body" || aSelector.startsWith("body[")) {
        casper.evaluate(function(v, append) {
            document.body.innerHTML = append ? document.body.innerHTML + v : v;
        }, inputValue, append);
    } else if (ele.selector.useEval || bFrame) {
        casper.evaluate(function(aSelector, v, append, attr) {
            var nodes = document.querySelectorAll(aSelector);
            if (attr == 'value') {
                for (var i = 0; i < nodes.length; ++i) {
                    nodes[i].value = append ? nodes[i].value + v : v;
                    nodes[i].attributes['value'] = append ? nodes[i].attributes['value'] + v : v;
                }
            } else if (attr == 'innerHTML' || attr == 'innerText') {
                //console.log(attr);
                for (var i = 0; i < nodes.length; ++i) {
                    nodes[i][attr] = append ? nodes[i][attr] + v : v;
                }
            } else {
                for (var i = 0; i < nodes.length; ++i) {
                    nodes[i].attributes[attr] = append ? nodes[i].attributes[attr] + v : v;
                }
            }
        }, aSelector, inputValue, append, ele.attr ? ele.attr : 'value');
    } else {
        casper.mouseEvent("mouseover", aSelector);
        casper.click(aSelector);
        if (ele.type == "form") {
            casper.fillSelectors(aSelector, inputValue,
                ele.submit ? true : false);
        } else if (ele.type == "enter") {
            casper.sendKeys(aSelector, casper.page.event.key.Enter,
                {keepFocus: true});
        } else {
            sendKeys(aSelector, inputValue, ele, null, append);
        }
    }
}
function changeElementAttribute(selector, method, name, newValue, sep) {
    if (!sep) {
        if (name == "style") sep = ";";
        else sep = " ";
    }
    casper.evaluate(function(aSelector, method, n, v, sep) {
        var nodes = document.querySelectorAll(aSelector);
        if (nodes.length === 0) {
            console.log("no element found");
            return;
        }
        for (var i = 0; i < nodes.length; ++i) {
            if (method == "set") {
                nodes[i].setAttribute(n, v);
            } else if (method == "remove") {
                var o = nodes[i].getAttribute(n);
                if (o && o.length > 0) {
                    v = o.replace(new RegExp(v, "gm"), "");
                    nodes[i].setAttribute(n, v);
                }
            } else if (method == "append") {
                var o = nodes[i].getAttribute(n), nov = sep + v;
                if (o && o.length > 0) {
                    if (o.indexOf(v) === 0 || o.indexOf(nov) != -1) continue;
                    o += nov;
                } else {
                    o = v;
                }
                nodes[i].setAttribute(n, o);
            } else if (method == "delete") {
                nodes[i].setAttribute(n, '');
            }
        }
    }, selector, method, name, newValue ? $g.finalizeString(newValue) : '', sep);
}
function getData(params, eles, name) {
    eles = $g.$ARR(eles);
    for (var i = 0, cnt = eles.length; i < cnt; ++i) {
        var ele = eles[i], data = false;
        if (ele == "from_fid") {
            if (!$g.acts.current.foundex || !$g.acts.current.foundex.guid) continue;
            data = $g.acts.current.foundex.guid;
        } else if (ele.fromUrl) {
            var urlData = {};
            if (ele.name) {
                var item = {};
                item[name] = ele.name;
                urlData = crawlerFromUrl({
                    "names":item
                });
                if (!urlData || urlData.length == 0) continue;
                urlData = urlData[0];
                if (!urlData[name]) continue;
            }
            if (ele.value) {
                data = $g.replaceAll(ele.value, "@@" + name + "@@", urlData[name]);
            } else {
                data = urlData[name];
            }
            data = $g.finalizeString(data);
        } else if (ele.code) {
            var data = casper.evaluate(function(n){
                return eval(n);
            }, $g.finalizeString(ele.code));
            if (data) {
                if (name) {
                    var newData = {};
                    for (var k in name) {
                        if (data[k]) {
                            newData[name[k]] = crawlerData(params, data[k].toString(), name[k]);
                        }
                    }
                    return newData;
                }
                return data;
            }
        } else {
            data = $selector(ele);
            if (!casper.exists(data)) continue;
            data = casper.getElementInfo(data);
        }
        data = crawlerData(params, data, name);
        if (data && data.length > 0) return data;
    }
    return false;
}
function parseAction(actions) {
    if (!actions) {
        return;
    }
    var acts = $g.$ARR(actions);
    for (var i = 0; i < acts.length; ++i) {
        var act = acts[i];
        if (i > 0 && acts[i - 1].needBreak) break;
        if (act.condition && !parseCheckers(act.condition)) {
            act.needBreak = false;
            continue;
        }
        if (act.__actioned && act.justOneTime) {
            act.needBreak = false;
            continue;
        }
        act.__actioned = true;
        if (act.name == "open") {
            parseOpen(act.params);
            continue;
        } else if (act.name == 'code') {
            callScript(act.params);
            continue;
        } else if (act.name == 'foundItemToVar') {
            if ($g.acts.current.foundex) {
                for (var k in act.map) {
                    if (!$g.acts.current.foundex[k]) continue;
                    $g.variables[act.map[k].name] = trimData(act.map[k].trims, $g.acts.current.foundex[k]);
                }
            }
            continue;
        } else if (act.name == "get_nid") {
            var p = act.params || {}, data = {};
            if (act.code) {
                data = getData(p, {code:act.code}, act.map);
                if (!data) {
                    $g.debug('failed to find in get_nid');
                    continue;
                }
            } else {
                data.nid = getData(p, act.nid, "nid");
                data.id = getData(p, act.id, "id");
            }
            if (!data.nid) {
                $g.debug('failed to find nid');
                continue;
            }
            if (!data.id) {
                $g.debug('failed to find id');
                continue;
            }
            $g.saveNid(data);
            continue;
        }
        var aSelector = "";
        //$g.debug(act);
        if (act.selector) aSelector = $selector(act.selector);
        var ret = true;
        if (act.selector && act.selector.attr) {
            var eles = $g.$ARR(act.selector.attr);
            //$g.debug(eles);
            for (var j = 0; j < eles.length; ++j) {
                var ele = eles[j];
                if (casper.exists(aSelector)) {
                    changeElementAttribute(aSelector, ele.method,
                        ele.name, ele.value, ele.sep);
                }
            }
        }
        if (act.name == "click") {
            ret = $action(act.selector, aSelector, function() {
                if (act.call) {
                    casper.evaluate(function(n){
                        eval(n);
                    }, aSelector);
                    return true;
                }
                //$g.echoLog("current click is: " + aSelector);
                //$g.debug(aSelector);
                if (!casper.exists(aSelector)) {
                    $g.logEleNotExist(aSelector);
                    return false;
                }
                $g.acts.random();
                $g.scrollToBottom();
                $g.scrollToTop();
                if (!act.selector.noMove) $g.acts.scrollTo(aSelector);
                if (act.selector.dumpPos) $g.dumpElementPos(aSelector);
                //var bFrame = isFrame(act.selector);
                if (act.selector.useEval) {
                    $g.acts.clickOne(aSelector);
                } else {
                    var eles = casper.getElementsInfo(aSelector);
                    if (eles.length > 1) {
                        var aIndex = 0;
                        if (act.percents) {
                            var pct = $g.math.randomBetween(0, 100), pctCnt=0;
                            for (var p in act.percents) {
                                var nowP = parseInt(p);
                                if (pct >= pctCnt && pct < (pctCnt + nowP)) {
                                    aIndex = act.percents[p];
                                    if (!$g.utils.isNumber(aIndex)) {
                                        var pTmp = aIndex;
                                        aIndex = pTmp.index;
                                        var pIndex = $g.math.randomBetween(0, pTmp.data.length - 1);
                                        $g.variables[pTmp.name] = pTmp.data[pIndex];
                                    }
                                    break;
                                }
                                pctCnt += nowP;
                            }
                        } else if (act.random) {
                            aIndex = $g.math.randomBetween(0, act.random.length - 1);
                            aIndex = act.random[aIndex];
                            if (aIndex >= eles.length) {
                                aIndex = 0;
                            }
                        } else if (act.index) {
                            if (act.index == "random") {
                                aIndex = $g.math.randomBetween(0, eles.length - 1);
                            } else if (act.index == "last") {
                                aIndex = eles.length - 1;
                            } else {
                                aIndex = act.index;
                            }
                        }
                        if (act.jump_labels) {
                            var sLable = aIndex.toString();
                            if (act.jump_labels[sLable]) $g.jump_label = act.jump_labels[sLable];
                        }
                        casper.evaluate(function(s){
                            var ns = document.querySelectorAll(s);
                            for (var i = 0; i < ns.length; ++i) {
                                ns[i].setAttribute("clk_myiid", i.toString());
                            }
                        }, aSelector);
                        aSelector += "[clk_myiid='"+aIndex.toString()+"']";
                        $g.debug('click by index: ' + aSelector);
                        if (casper.exists(aSelector)) {
                            if (act.selector.useMouse) {
                                var selPos = casper.getElementBounds(aSelector);
                                if (act.selector.offset) {
                                    if (act.selector.offset.x) selPos.left += act.selector.offset.x;
                                    if (act.selector.offset.y) selPos.top += act.selector.offset.y;
                                }
                                $g.echoLog('click pos: ' + JSON.stringify(selPos));
                                casper.mouse.move(selPos.left, selPos.top);
                                casper.mouse.click(selPos.left, selPos.top);
                            } else {
                                casper.mouse.move(aSelector);
                                casper.click(aSelector);
                            }
                        } else {
                            $g.debug("clk selecotr not exist: " + aSelector);
                        }
                    } else {
                        casper.mouse.move(aSelector);
                        casper.click(aSelector);
                    }
                }
            });
        } else if (act.name == "input") {
            ret = $action(act.selector, aSelector, function() {
                if (!casper.exists(aSelector)) {
                    $g.logEleNotExist(aSelector);
                    return false;
                }
                $g.acts.scrollTo(aSelector);
                inputAction(act, aSelector, true, act.append);
            });
        } else if (act.name == "scroll") {
            ret = $action(act.selector, aSelector, function() {
                if (!casper.exists(aSelector)) {
                    $g.logEleNotExist(aSelector);
                    return false;
                }
                $g.acts.scrollTo(aSelector);
            });
        } else if (act.name == "move") {
            ret = $action(act.selector, aSelector, function() {
                if (!casper.exists(aSelector)) {
                    $g.logEleNotExist(aSelector);
                    return false;
                }
                casper.mouseEvent("mouseover", aSelector);
                var aMEle = casper.getElementInfo(aSelector);
                if (aMEle) $g.acts.move(aMEle);
            });
        } else if (act.name == "snapshot") {
            if (act.byPos) captureByPos(act);
            else {
                var fileName = "snapshot_" + $g.acts.current.snapIndex;
                ++$g.acts.current.snapIndex;
                if ($g.utils.isString(act.selector) || $g.utils.isObject(act.selector)) {
                    ret = $action(act.selector, aSelector, function() {
                        if (!casper.exists(aSelector)) {
                            $g.logEleNotExist(aSelector);
                            return false;
                        }
                        var eles = casper.getElementsInfo(aSelector);
                        if (eles.length > 1) {
                            casper.evaluate(function(s){
                                var ns = document.querySelectorAll(s);
                                for (var i = 0; i < ns.length; ++i) {
                                    ns[i].setAttribute("snap_myiid", i.toString());
                                }
                            }, aSelector);
                            var aIndex = 0;
                            if (act.random) {
                                aIndex = $g.math.randomBetween(0, act.random.length - 1);
                                aIndex = act.random[aIndex];
                                if (aIndex >= eles.length) {
                                    aIndex = 0;
                                }
                            } else if (act.index) {
                                if (act.index == "random") {
                                    aIndex = $g.math.randomBetween(0, eles.length - 1);
                                } else if (act.index == "last") {
                                    aIndex = eles.length - 1;
                                } else {
                                    aIndex = act.index;
                                }
                            }
                            aSelector += "[snap_myiid='"+aIndex.toString()+"']";
                        }
                        $g.capture(fileName, aSelector);
                    });
                } else {
                    $g.capture(fileName);
                }
            }
        }
        if (!ret) {
            var m = "action: "+act.name+" element is not exist:"+aSelector;
            $g.debug(m);
            $g.log.append("parse action", m);
            if (!act.selector.ignorable) {
                $g.acts.ignoreAll("Can't find element to do action: " + act.name + ". Selector: " + aSelector);
                return false;
            }
        }
    }
}
function inputVcode(params) {
    var input = $selector(params.input);
    casper.mouseEvent("mouseover", input);
    casper.click(input);
    if (params.useEval) {
        casper.evaluate(function(aSelector, v) {
            var nodes = document.querySelectorAll(aSelector);
            for (var i = 0; i < nodes.length; ++i) {
                nodes[i].value = v;
            }
        }, input, params.code);
    } else {
        sendKeys(input, params.code, false, params.donotClick ? true : false);
    }
    $g.log.append("input vcode", "Input times: " + params.retry + ". Code: " + params.code);
    $g.debugCapture("vcode_inputed.jpg");
    params.ticks = $g.$ticks(3); // wait for 3 seconds
    params.vstat = VCODE_STAT_INPUTED;
}
function clickT9(params) {
    var btnPrefix = params.btnPrefix, offset = 1;
    if (!$g.utils.isUndefined(params.btnOffset)) offset = params.btnOffset;
    $g.debug("btn offset: " + offset.toString());
    for (var i = 0; i < params.code.length && i < 4; ++i) {
        var picIndex = parseInt(params.code.charAt(i));
        picIndex -= offset;
        parseAction({
            "name" : "click",
            "selector" : btnPrefix + picIndex.toString()
        });
    }
    $g.debugCapture("t9_vcode_inputed.jpg");
    params.ticks = $g.$ticks(3); // wait for 3 seconds
    params.vstat = VCODE_STAT_INPUTED;
}
function parseVCode(params) {
    var ret = false;
    var container = params.container ? params.container : params.image;
    container = $selector(container);
    if (params.vstat === VCODE_STAT_MD5) {
        $g.debug("wait vcode md5");
        return false;
    } else if (params.vstat === VCODE_STAT_INPUTED) {
        --params.ticks;
        if (params.ticks > 0) {
            return false;
        }
        if (params.actions) {
            parseAction(params.actions);
            if (params.call) {
                callScript(params.call);
            }
        }
        $g.debugCapture("vcode_actioned.jpg");
        $g.debug("Execute vcode actions");
        $g.log.append('input vcode', "Execute vcode actions");
        params.vstat = VCODE_STAT_ACTIONED;
        params.ticks = $g.$ticks(params.retryInterval - 2);
        return false;
    } else if (params.vstat === VCODE_STAT_ACTIONED) {
        --params.ticks;
        if (params.ticks > 0) {
            return false;
        }
        params.vstat = VCODE_STAT_READY;
        if (params.successAfterAction) {
            return true;
        }
        if (!casper.visible(container)) {
            return true;
        }
        if (params.auto) {
            params.auto = false;
        } else {
            ++params.retry;
        }
        if (params.retry > params.maxRetry) {
            return true;
        }
        $g.debug("retry vcode");
        params.ticks = 0;
        params.captured = false;
        if (params.clickImg || params.clickInput) {
            var cAct = {
                name: "click"
            };
            if (params.needClickImg) {
                cAct.selector = params.changeImage ? params.changeImage : params.image;
            } else {
                cAct.selector = params.changeImage ? params.changeImage : params.input;
            }
            parseAction(cAct);
            params.ticks = $g.$ticks(8); // wait for max 8 seconds for vcode comming
            params.lastInfo = false;
        }
        return false;
    } else if (!params.inited) {
        params.inited = true;
        if (casper.visible(container)) params.ticks = 0;
        else params.ticks = $g.$ticks(6); // wait for max 8 seconds for vcode comming
    } else if (params.ticks > 0) {
        --params.ticks;
    }
    if (params.ticks !== 0 || ret) {
        return ret;
    }
    if (!casper.visible(container)) {
        //$g.debug("container is not visible: " + container);
        return true;
    }
    var vcode_path = $g.getVCodeTextPath("vcode.txt");
    var auto_vcode_path = $g.getVCodeTextPath("auto_vcode.txt");
    if (!params.captured) {
        $g.fs.$remove(vcode_path);
        $g.fs.$remove(auto_vcode_path);
        var image = $selector(params.image);
        var tmpFilePath;
        if (casper.visible(image)) tmpFilePath = $g.captureVCode("vcode", image);
        else if (params.image1) {
            image = $selector(params.image1);
            if (casper.visible(image)) tmpFilePath = $g.captureVCode("vcode", image);
            else {
                $g.acts.ignoreAll();
                return true;
            }
        } else {
            $g.acts.ignoreAll();
            return true;
        }
        params.vstat = VCODE_STAT_MD5;
        params.captured = true;
        $g.debugCapture("checkvcode.jpg");
        $g.debug("vcode path: "+tmpFilePath);
        $g.echoLog("vcode path: "+tmpFilePath);
        $g.debug('calc vcode image file md5');
        var vcodeMd5Callback = function(err, m5, stderr) {
            $g.debug("vcodeMd5Callback return");
            if (!err) {
                params.newInfo = {size:$g.fs.size(tmpFilePath),m5:m5};
            } else {
                $g.debug(stderr);
                $g.log.append("input vcode", stderr);
                params.newInfo = {size:0,m5:0};
            }
            if (params.lastInfo && params.newInfo.size == params.lastInfo.size &&
                params.newInfo.m5 == params.lastInfo.m5) {
                $g.debug("vcode md5 is same");
                $g.log.append("input vcode", "vcode md5 is same");
                if (params.isT9) {
                    clickT9(params);
                } else {
                    inputVcode(params);
                }
                $g.fs.$remove(tmpFilePath);
            } else {
                $g.debug("vcode md5 is not same, old md5:");
                $g.utils.dump(params.lastInfo || "empty");
                $g.debug("new md5:");
                $g.utils.dump(params.newInfo);
                $g.debug("Waiting for input vcode...");
                $g.log.append("input vcode", "Waiting for input vcode...");
                params.lastInfo = params.newInfo;
                params.vstat = VCODE_STAT_READY;
                if (params.isT9) $g.fs.write($g.getVCodeFilePath("vcode", '.t9'), '1');
                $g.fs.$rename(tmpFilePath, $g.getVCodeFilePath("vcode"));
            }
        }
        $g.fs.$md5(tmpFilePath, vcodeMd5Callback);
    } else {
        var auto = true;
        var path = false;
        var vcode_failed_path = $g.getVCodeTextPath("vcode.failed");
        //$g.debug(vcode_path);
        if ($g.fs.exists(vcode_failed_path)) {
            $g.fs.$remove(vcode_failed_path);
            $g.acts.ignoreAll();
            return true;
        }
        if ($g.fs.exists(vcode_path)) {
            auto = false;
            path = vcode_path;
        } else if (params.detectable !== false && $g.fs.exists(auto_vcode_path)) {
            path = auto_vcode_path;
        }
        if (path) {
            var code = $g.fs.read(path);
            code = code || "";
            code = code.trim();
            if (code.length == 0) {
                params.captured = false;
                return false;
            }
            $g.fs.$remove(vcode_path);
            $g.fs.$remove(auto_vcode_path);
            $g.debug("VCode is inputed: " + code);
            params.auto = auto;
            if (code == '----') {
                return true;
            } else if (code == "!@!@!@") {
                params.captured = false;
                $g.log.append("input vcode", "not clear, input times: " + params.retry + ". Code is not clear!");
                if (params.needRefresh) {
                    casper.reload();
                    params.ticks = $g.$ticks(30); // wait for max 30 seconds for page ready
                } else {
                    parseAction({
                        name:"click", selector: params.changeImage ? params.changeImage : params.image
                    });
                    params.ticks = $g.$ticks(8); // wait for max 8 seconds for vcode comming
                }
                params.lastInfo = false;
                return false;
            }
            if (params.inputs) {
                parseAction(params.inputs);
            }
            $g.variables._vcode_ = code;
            params.code = code;
            if (params.isT9) {
                clickT9(params);
            } else {
                inputVcode(params);
            }
        }
    }
    return ret;
}

function processOldCrawlerOption(params) {
    if (!params.getInt) {
        return;
    }
    if (!params.options) {
        params.options = {};
    }
    for (var k = 0; k < params.getInt.length; ++k) {
        var name = params.getInt[k];
        if (!params.options[name]) {
            params.options[name] = {};
        }
        params.options[name].digit = true;
    }
}

function crawlerData(params, ele, name) {
    var isEle = !$g.utils.isString(ele);
    var data = isEle ? ele.text : ele;
    var hasOption = $g.utils.isObject(params.options) && $g.utils.isObject(params.options[name]);
    var aTrim = [null];
    if (hasOption) {
        if (isEle) {
            if (params.options[name].from) {
                data = ele.attributes[params.options[name].from];
                if (!data) {
                    data = "";
                }
            } else if (params.options[name].fromTag) {
                data = ele.tag;
            }
        }
        if (params.options[name].trim) {
            aTrim = params.options[name].trim;
        }
    }
    aTrim = $g.$ARR(aTrim);
    for (var i = 0; i < aTrim.length; ++i) {
        data = $g.$trim(data, aTrim[i]);
    }
    if (data && hasOption) {
        if (params.options[name].digit) {
            var re = /(\d+)/g;
            data = data.replaceAll(',', '');
            if (re.test(data)) {
                data = parseInt(RegExp.$1);
            } else {
                data = 0;
            }
        } else {
            if (params.options[name].prefix) {
                data = params.options[name].prefix + data;
            }
            if (params.options[name].suffix) {
                data = data + params.options[name].suffix;
            }
        }
    }
    return data;
}

function crawlerNormal(params) {
    var selectors = $g.$ARR(params.selectors);
    var tmpResults = [];
    var parent = "";
    if ($g.utils.isString(params.parent)) {
        parent = params.parent + " ";
    }
    processOldCrawlerOption(params);
    for (var i = 0; i < selectors.length; ++i) {
        var tmp = [];
        var selector = selectors[i];
        if ($g.utils.isString(selector) && selector.length === 0) {
            tmp.push("");
        } else {
            if ($g.utils.isString(selector)) {
                selector = parent + selector;
            } else {
                selector.selector = parent + selector.selector;
            }
            var aSelector = $selector(selector);
            $action(params, aSelector, function() {
                if (casper.exists(aSelector)) {
                    var ele = casper.getElementsInfo(aSelector);
                    var eleCount = params.count || ele.length;
                    if (eleCount > ele.length) eleCount = ele.length;
                    for (var k = 0; k < eleCount; ++k) {
                        tmp.push(crawlerData(params, ele[k], params.names[i]));
                    }
                }
                else {
                    tmp.push("");
                }
            });
        }
        tmpResults.push(tmp);
    }
    var results = [];
    if (tmpResults.length > 0) {
        var cnt = tmpResults[0].length;
        for (var i = 0; i < cnt; ++i) {
            var item = {};
            for (var j = 0; j < params.names.length; ++j) {
                var name = params.names[j];
                item[name] = tmpResults[j][i];
            }
            results.push(item);
        }
    }
    return results;
}

function crawlerComplex(params) {
    var results = [];
    var parent = "";
    if ($g.utils.isString(params.parent)) {
        parent = params.parent + " ";
    }
    processOldCrawlerOption(params);
    $action(params, null, function() {
        var eles = [];
        if (casper.exists(parent + params.item)) {
            eles = casper.getElementsInfo(parent + params.item);
        }
        for (var i = 0; i < eles.length; ++i) {
            var ele = eles[i];
            var itemTag = fetchIdentity(ele.tag, params.pattern);
            var selectors = $g.$ARR(params.selectors);
            var item = {};
            for (var k = 0; k < selectors.length; ++k) {
                var selector = $g.$ARR(selectors[k]);
                var found = false;
                var name = params.names[k];
                for (var j = 0; j < selector.length; ++j) {
                    var aSelector = parent + itemTag + " " + selector[j];
                    if (casper.exists(aSelector)) {
                        item[name] = crawlerData(params,
                            casper.getElementInfo(aSelector), name);
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    item[name] = "";
                }
            }
            results.push(item);
        }
    });
    return results;
}
function crawlerFromUrl(item, url) {
    if (!url) url = casper.getCurrentUrl();
    var params = [], aItem = {};
    var pos = url.indexOf('?');
    if (pos != -1) {
        var tmp = url.substr(pos + 1);
        tmp = tmp.split('&');
        for (var i = 0; i < tmp.length; ++i) {
            var p = tmp[i].split('=');
            if (p.length > 0) {
                params.push({name:p[0], value:p[1]});
            }
        }
    }
    if (item.names) {
        for (var name in item.names) {
            for (var i = 0; i < params.length; ++i) {
                if (params[i].name == item.names[name]) {
                    aItem[name] = params[i].value;
                }
            }
        }
    } else if (items.trims) {
        for (var name in item.trims) {
            var trims = $g.$ARR(item.trims[name]);
            var data = url;
            for (var i = 0; i < trims.length; ++i) {
                data = $g.$trim(data, trims[i]);
            }
            aItem[name] = data;
        }
    }
    return [aItem];
}
function inputOneElement(ele, params) {
    var aSelector = $selector(ele.selector);
    var inputResult = false;
    var ret = $action(ele.selector, aSelector, function() {
        if (!casper.exists(aSelector)) {
            if (ele.selector.ignorable) {
                return;
            }
            $g.acts.ignoreAll("Failed to find element to input data: " + aSelector);
            return;
        }
        inputResult = true;
        if (ele.click) casper.click(aSelector);
        inputAction(ele, aSelector, 
            params.move !== false || ele.move !== false,
            params.append);
    });
    if (!ret && !ele.selector.ignorable) {
        $g.acts.ignoreAll("Failed to find element to input data: " + aSelector);
        return false;
    } else if (!inputResult && !ele.selector.ignorable) {
        return false;
    }
    return true;
}
function inputData(params) {
    var elements = $g.$ARR(params);
    for (var i = 0; i < elements.length; ++i) {
        if (!inputOneElement(elements[i], params)) {
            break;
        }
    }
}
function changeAttributes(params) {
    var elements = $g.$ARR(params);
    for (var i = 0; i < elements.length; ++i) {
        var ele = elements[i];
        var aSelector = $selector(ele.selector);
        $action(ele.selector, aSelector, function() {
            changeElementAttribute(aSelector, ele.method,
                ele.name, ele.value, ele.sep);
        });
    }
}
function getActionUrl(params)
{
    var url = "";
    if ($g.utils.isString(params)) {
        url = $g.finalizeString(params);
    } else if ($g.utils.isObject(params.options)) {
        url = $g.finalizeString(params.url);
        if (params.isFormEncode) {
            if (!$g.utils.isObject(params.options.headers)) {
                params.options.headers = {};
            }
            params.options.headers["Content-Type"] = "application/x-www-form-urlencoded";
        }
        if (params.options.data) {
            for (var n in params.options.data) {
                params.options.data[n] = $g.finalizeString(params.options.data[n]);
                if (params.useEscape) {
                    params.options.data[n] = casper.evaluate(function(d) {
                        return escape(d);
                    }, params.options.data[n]);
                }
            }
        }
    } else if ($g.utils.isString(params.url) || $g.utils.isObject(params.url)) {
        if ($g.utils.isString(params.url)) {
            url = $g.finalizeString(params.url);
        } else if ($g.utils.isString(params.url.selector)) { 
            url = $g.finalizeString(params.url.selector);
        }
    }
    return url;
}
function getLevelName(level, idx) {
    var itemName = "L";
    for (var i = 0; i < level; ++i) {
        itemName += "_" + idx[i];
    }
    return itemName;
}
function $getForm(params) {
    if (!params.inited) {
        params.inited = true;
        params.ticks = 0;
        params.interval = params.interval ? params.interval : 30;
        params.level = 0;
        params.curLevel = 0;
        params.level = 0;
        params.minTicks = $g.$ticks(8);
    }
    var item = params.items[params.level];
    var aSelector = $selector(item.selector);
    var aOption = aSelector + " option";
    if (params.ticks != 0) {
        --params.ticks;
/*        if (!casper.exists(aOption)) {
            return false;
        } else if (params.ticks >= params.minTicks) {
            return false;
        }
        params.ticks = 0;*/
        return false;
    }
    if (params.curLevel === 0) {
        $g.forms = {};
        $g.forms["L"] = [];
        var eles = casper.getElementsInfo(aOption);
        $g.log.append("getform", aOption + "get data for level: L. item length: "+eles.length);
        $g.debug(aOption + "get data for level: L. item length: "+eles.length);
        for (var i = $g.utils.isNumber(item.start) ? item.start : 1; 
            i < eles.length; ++i) {
            var aTrim = $g.$ARR(item.trim);
            var txt = eles[i].text;
            for (var j = 0; j < aTrim.length; ++j) {
                txt = $g.$trim(txt, aTrim[j]);
            }
            $g.forms["L"].push({name:txt, value:eles[i].attributes["value"]});
        }
        params.curLevel = [];
        for (var i = 0; i < params.items.length; ++i) {
            params.curLevel.push(0);
        }
        var fele = {};
        fele[aSelector] = $g.forms["L"][0].value;
        casper.fillSelectors(params.form, fele, false);
        params.ticks = $g.$ticks(params.interval);
        ++params.level;
        return false;
    }
    var itemName = getLevelName(params.level, params.curLevel), needUpLevel = false;
    if (casper.exists(aOption)) {
        notExist = false;
        $g.forms[itemName] = [];
        var eles = casper.getElementsInfo(aOption);
        $g.log.append("getform", aOption + "get data for level: "+itemName+". item length: "+eles.length);
        $g.debug(aOption + "get data for level: "+itemName+". item length: "+eles.length);
        for (var i = $g.utils.isNumber(item.start) ? item.start : 1; 
            i < eles.length; ++i) {
            var aTrim = $g.$ARR(item.trim);
            var txt = eles[i].text;
            for (var j = 0; j < aTrim.length; ++j) {
                txt = $g.$trim(txt, aTrim[j]);
            }
            $g.forms[itemName].push({name:txt, value:eles[i].attributes.value});
        }
        if (params.level < params.items.length - 1) {
            var index = params.curLevel[params.level];
            fele = {};
            fele[aSelector] = $g.forms[itemName][index].value;
            casper.fillSelectors(params.form, fele, false);
            ++params.level;
            params.ticks = $g.$ticks(params.interval);
        } else {
            needUpLevel = true;
        }
    } else {
        needUpLevel = true;
        params.curLevel[params.level] = 0;
        --params.level;
    }
    if (needUpLevel) {
        do {
            params.curLevel[params.level] = 0;
            --params.level;
            if (params.level < 0) {
                return true;
            }
            ++params.curLevel[params.level];
            itemName = getLevelName(params.level, params.curLevel);
            $g.debug("up level: "+itemName);
            if (!$g.forms[itemName] || params.curLevel[params.level] < $g.forms[itemName].length) {
                var item = params.items[params.level];
                var index = params.curLevel[params.level];
                var aSelector = $selector(item.selector);
                fele = {};
                fele[aSelector] = $g.forms[itemName][index].value;
                casper.fillSelectors(params.form, fele, false);
                ++params.level;
                params.ticks = $g.$ticks(params.interval);
                break;
            }
        } while (true);
    }
    return false;
}
function parseOpen(params) {
    var url = getActionUrl(params);
    $g.debug("Open url:"+url);
    if ($g.isEmpty(url)) {
        $g.acts.ignoreAll();
    } else {
        if (params.options && $g.utils.isObject(params.options)) {
            $g.finalizeObject(params.options);
            casper.open(url, params.options);
        } else if (params.useMobile) {
            casper.open(url, {
                method:'get',
                headers:{
                    "User-Agent":"Mozilla/5.0 (iPhone; CPU iPhone OS 7_1_2 like Mac OS X) AppleWebKit/537.51.2 (KHTML, like Gecko) Version/7.0 Mobile/11D257 Safari/9537.53"
                }
            });
        }else {
            casper.open(url);
        }
    }
}
function $dumpResponse(params, filePath) {
    var d = $g.getResponseData();
    if (d) {
        $g.fs.write(filePath, JSON.stringify(d));
        $g.fs.write($g.getPath("get_res"), '1');
        return true;
    }
    return false;
}
function formatUrl(url, u, preU) {
    if (url.startsWith('/')) {
        return $g.trimLast(preU + url, '/');
    }
    if (url.length == 0) return u;
    if (url.startsWith('../')) {
        var pPos = 0, pUrl = url;
        pPos = u.indexOf('?');
        if (pPos !== -1) u = u.substr(0, pPos);
        pPos = u.lastIndexOf('/');
        if (pPos !== -1) {
            u = u.substr(0, pPos);
            do {
                pPos = u.lastIndexOf('/');
                if (pPos === -1) break;
                u = u.substr(0, pPos);
                pUrl = pUrl.substr(3);
            } while (pUrl.startsWith('../'));
        }
        return u + '/' + pUrl;
    }
    var t = url.substr(0, 4).toLowerCase();
    if (t != 'http') {
        var pos = u.indexOf('#');
        if (pos != -1) u = u.substr(0, pos);
        pos = u.lastIndexOf('/');
        if (pos == -1) return '';
        var pos2 = u.indexOf('://');
        if (pos2 + 2 == pos) {
            url = u + '/' + url;
        } else {
            url = u.substr(0, pos + 1) + url;
        }
    }
    return $g.trimLast(url, '/');
}
function initActions() {
    casper.saveTargets = function(targets, filePath) {
        $g.$nothrow(function() {
            var texts = [];
            if ($g.targets) {
                for (var i = 0; i < $g.targets.length; ++i) texts.push($g.targets[i]);
            }
            if (targets) {
                if ($g.utils.isString(targets)) {
                    targets = $g.$ARR(targets);
                } else if ($g.utils.isArray(targets)) {

                } else {
                    if (targets.toFrame) {
                        $toFrame(targets.toFrame);
                    }
                    targets = $g.$ARR(targets.selectors);
                }
                for (var i = 0; i < targets.length; ++i) {
                    var t = targets[i];
                    if (t.checkers) {
                        if (parseCheckers(t.checkers)) {
                            if (t.actions) parseAction(t.actions);
                            texts.push({s:t.name, t: t.data ? t.data : ""});
                        }
                        continue;
                    }
                    if (!casper.exists(t.selector) || !casper.visible(t.selector)) {
                        continue;
                    }
                    if (t.actions) parseAction(t.actions);
                    var ele = casper.getElementInfo(t.selector);
                    //$g.debug(ele);
                    var data = ele.text;
                    if (t.from) {
                        data = ele.attributes[t.from];
                    }
                    data = data.trim();
                    if (data.length > 0) {
                        texts.push({s:t.name,t:data});
                    }
                }
            }
            if (texts.length > 0) {
                var st = JSON.stringify(texts);
                $g.fs.write(filePath, st);
                $g.log.append('save target', st);
            }
        });
    }
    casper._actions = {
        input: function(params, condition) {
            if (params.fromFile) {
                var vcode_path = $g.getPCodeTextPath("pcode.txt");
                $g.fs.$remove(vcode_path);
                var timeout = params.timeout ? params.timeout : VCODE_TIME_OUT;
                var inputed = false;
                casper.waitFor(function() {
                    $g.acts.update(params);
                    if (!checkCondition(condition)) {
                        return true;
                    }
                    if ($g.fs.exists(vcode_path)) {
                        params.value = $g.fs.read(vcode_path);
                        params.value = params.value.trim();
                        $g.log.append("input pcode", "pcode: " + params.value);
                        $g.fs.$remove(vcode_path);
                        if (params.toVar) {
                            $g.variables[params.name] = params.value;
                            inputed = true;
                        } else {
                            inputed = inputOneElement(params, params);
                        }
                        return true;
                    }
                    return false;
                }, function() {
                    if (!inputed) {
                        $g.acts.ignoreAll(params.errorText ? params.errorText : "");
                    }
                }, function() {
                    $g.acts.ignoreAll(params.errorText ? params.errorText : "Failed to get input from file.");
                }, timeout);
            } else {
                casper.then(function() {
                    $g.acts.update(params);
                    if (!checkCondition(condition)) {
                        return;
                    }
                    inputData(params);
                });
            }
        },
        attr: function(params, condition) {
            casper.then(function() {
                $g.acts.update(params);
                if (!checkCondition(condition)) {
                    return;
                }
                changeAttributes(params);
            });
        },
        click: function(params, condition) {
            if (params.until) {
                var retryInterval = $g.utils.isNumber(params.retryInterval) ? params.retryInterval : 10;
                var nextTry = 0, retryTag = $g.$ticks(retryInterval), checkClick=0;
                casper.waitFor(function() {
                        $g.acts.update(params);
                        if (!checkCondition(condition)) {
                            return true;
                        }
                        var ret = false;
                        $g.$nothrow(function() {
                            ret = parseCheckers(params.until);
                        }, function(err) {
                            $g.debug(err);
                        });
                        if (!ret) {
                            if (nextTry <= 0) {
                                $g.debug("retry click");
                                nextTry = retryTag;
                                checkClick = 0;
                                parseAction({
                                    name: "click",
                                    selector: params.selector
                                });
                            } else {
                                --nextTry;
                                ++checkClick;
                                if (checkClick == 3 && params.click && casper.visible(params.click)) {
                                    $g.debug("click if exist");
                                    parseAction({
                                        name: "click",
                                        selector: params.click
                                    });
                                }
                            }
                        }
                        return ret;
                    }, $g.noop, function() {
                        if (!params.ignorable) {
                            $g.acts.ignoreAll(params.errorText ? params.errorText : "");
                        }
                }, params.timeout ? params.timeout : OP_TIME_OUT);
            } else if (params.count) {
                if (params.count == "random") {
                    params.count = $g.math.randomBetween(2, 5);
                }
                var interval = params.interval ? params.interval : $g.math.randomBetween(20, 30), actioned = false;
                interval = $g.$ticks(interval);
                params.tick = interval;
                params.curPage = 1;
                params.timeout = 8 * 60 * 1000;
                casper.waitFor(function() {
                    $g.acts.update(params);
                    if (!checkCondition(condition) || params.count == 0) {
                        return true;
                    }
                    if (!params.initPage) {
                        params.initPage = true;
                        if (params.pages && $g.variables[params.pages] && !isNaN($g.variables[params.pages])) {
                            if (params.count > $g.variables[params.pages]) params.count = $g.variables[params.pages];
                        }
                        $g.echoLog("click total pages:" + params.count);
                    }
                    if (params.tick == 0) {
                        actioned = false;
                        if (params.sucChecker && parseCheckers(params.sucChecker)) {
                            return true;
                        }
                        if (params.checkRetry && parseCheckers(params.checkRetry.checkers)) {
                            params.tick = interval;
                            $g.echoLog("retry, current click count is: " + params.count);
                            $g.debug("retry, current click count is: " + params.count);
                            parseAction(params.checkRetry.actions);
                        } else if (!params.waiter ||
                            parseCheckers(params.waiter)) {
                            $g.echoLog("current click count is: " + params.count);
                            $g.debug("current click count is: " + params.count);
                            //$g.debugCapture("click" + params.count + ".jpg");
                            --params.count;
                            ++params.curPage;
                            $g.variables._nextPage_ = params.curPage;
                            params.tick = interval;
                            parseAction({
                                name:"click",
                                call:params.call ? true : false,
                                selector: params.selector
                            });
                        }
                    } else {
                        if (params.tick > 0 && (params.tick % 10) == 0) {
                            $g.debug("tick1");
                            $g.acts.random();
                            if (params.scroll) {
                                parseAction({
                                    name:"scroll", selector:params.scroll
                                });
                            }
                        } else if (params.tick > 0 && (params.tick % 16) == 0) {
                            $g.scrollToBottom();
                        } else if (params.tick > 0 && (params.tick % 20) == 0) {
                            $g.scrollToTop();
                        }
                        if (!actioned && params.action) {
                            $g.debug("tick2");
                            actioned = true;
                            parseAction(params.action);
                        }
                        --params.tick;
                    }
                    return false;
                }, $g.noop, function() {
                    if (!params.ignorable) {
                        $g.acts.ignoreAll(params.errorText ? params.errorText : "");
                    }
                }, params.timeout);
            } else {
                var elements = $g.$ARR(params);
                var actions = [];
                for (var i = 0; i < elements.length; ++i) {
                    elements[i].name = 'click';
                    actions.push(elements[i]);
                }
                casper.then(function() {
                    $g.acts.update(params);
                    if (!checkCondition(condition)) {
                        return;
                    }
                    parseAction(actions);
                });
            }
        },
        open: function(params, condition) {
            casper.then(function() {
                $g.acts.update(params);
                if (!checkCondition(condition)) {
                    return;
                }
                parseOpen(params);
            });
        },
        wait: function(params, condition) {
            if (!params.interval) {
                if (params.popup) {
                    casper.waitFor(function() {
                        $g.acts.update(params);
                        if (!checkCondition(condition)) {
                            return true;
                        }
                        try {
                            casper.popups.find(params.popup);
                            return true;
                        } catch (e) {
                            return false;
                        }
                    }, $g.noop, function() {
                        if (!$g.utils.isNumber(params.sucJump) && !params.ignorable) {
                            $g.acts.ignoreAll(params.errorText ? params.errorText : "");
                        }
                    }, params.timeout ? params.timeout : OP_TIME_OUT);
                } else {
                    casper.waitFor(function() {
                        $g.acts.update(params);
                        if (!checkCondition(condition)) {
                            return true;
                        }
                        var ret = parseCheckers(params.checkers);
                        var suc = ret;
                        if (!ret && params.failedCheckers) {
                            ret = parseCheckers(params.failedCheckers);
                            if (ret) {
                                $g.acts.ignoreAll(params.failedCheckers.errorText ? params.failedCheckers.errorText : "");
                            }
                        }
                        if (ret && suc && $g.utils.isNumber(params.sucJump)){
                            $g.acts.ignore(params.sucJump-1);
                        }
                        return ret;
                    }, $g.noop, function() {
                        if (!$g.utils.isNumber(params.sucJump) && !params.ignorable) {
                            $g.acts.ignoreAll(params.errorText ? params.errorText : "");
                        }
                    }, params.timeout ? params.timeout : OP_TIME_OUT);
                }
            } else {
                var interval = params.interval;
                if (interval == "random") {
                    interval = $g.math.randomBetween(1, 4) * 1000;
                    if (params.multi) interval *= params.multi;
                    params.interval = interval;
                }
                $g.wait(interval, params);
            }
        },
        check: function(params, condition) {
            casper.then(function() {
                $g.acts.update(params);
                if (!checkCondition(condition)) {
                    return;
                }
                if (!parseCheckers(params.checkers)) {
                    var errorText = "";
                    if (params.errorTextSelector) {
                        errorText = casper.fetchText(params.errorTextSelector);
                    } else {
                        errorText = params.errorText ? params.errorText : "Failed to check condition.";
                    }
                    $g.log.append("check", errorText);
                    $g.acts.ignoreAll();
                }
            });
        },
        checkvcode: function(params, condition) {
            var failed = false;
            var suc = false;
            var byFailChecker = false;
            var failChecker = function(params) {
                if ((params.popup && !$toPopup(params.popup)) || 
                    (params.frame && !$toFrame(params))) {
                    $g.acts.ignoreAll();
                    return;
                }
                var container = params.container ? params.container : params.image;
                container = $selector(container);
                if (!failed && !casper.visible(container)) {
                    if (params.popup) {
                        $backPopup();
                    } else if (params.frame) {
                        $backFrame();
                    }
                    $g.debug("Check vcode finished");
                    return;
                }
                var errorText = "Failed to input check code";
                if (byFailChecker && params.failCheckerCode) {
                    errorText = params.failCheckerCode;
                } else if (failed && params.failCode) {
                    errorText = params.failCode;
                } else if (params.errorText && casper.exists(params.errorText)) {
                    errorText = casper.fetchText(params.errorText);
                }
                $g.log.append("checkvcode", errorText);
                if (params.popup) {
                    $backPopup();
                } else if (params.frame) {
                    $backFrame();
                }
                $g.acts.ignoreAll();
            }
            var timeout = params.timeout ? params.timeout : VCODE_TIME_OUT;
            // default 15 seconds
            params.retryInterval = params.retryInterval ? params.retryInterval : 15;
            if (!params.maxRetry || !$g.utils.isNumber(params.maxRetry)) {
                params.maxRetry = 8;
            }
            params.retry = 1;
            params.vstat = VCODE_STAT_READY;
            params.inited = false;
            if (params.inputs) {
                params.inputs = $g.$ARR(params.inputs);
                for (var tii = 0; tii < params.inputs.length; ++tii) {
                    params.inputs[tii].name = "input";
                }
            }
            var tmpTmout = params.maxRetry * params.retryInterval * 1000;
            params.timeout = tmpTmout > timeout ? tmpTmout : timeout;
            casper.waitFor(function() {
                $g.acts.update(params);
                if (!checkCondition(condition)) {
                    return true;
                }
                if ((params.popup && !$toPopup(params.popup)) || 
                    (params.frame && !$toFrame(params))) {
                    return false;
                }
                var ret = false;
                if (parseCheckers(params.sucChecker)) {
                    ret = true;
                    suc = true;
                }
                if (!ret) {
                    ret = parseVCode(params);
                }
                if (!ret && params.vstat === VCODE_STAT_ACTIONED &&
                    params.failChecker && parseCheckers(params.failChecker)) {
                    $g.debug("Check vcode failChecker failed");
                    byFailChecker = true;
                    failed = true;
                    ret = true;
                }
                if (params.popup) {
                    $backPopup();
                } else if (params.frame) {
                    $backFrame();
                }
                return ret;
            }, function() {
                if (!suc) {
                    failChecker(params);
                }
            }, function() {
                failChecker(params);
            }, params.timeout);
        },
        find: function(params, condition) {
            var next = {maxCount: -1};
            var aTimeout = 0;
            var maxTicks = 1;
            var isScrolled = false;
            if ($g.utils.isString(params.next)) {
                next.selector = params.next;
            } else if (params.next){
                next = params.next;
                if (!$g.isTruthy(next.maxCount) || !$g.utils.isNumber(next.maxCount)) {
                    next.maxCount = -1;
                }
            }
            if (next.maxCount <= 0) {
                next.maxCount = -1;
            }
            if (params.timeout) {
                aTimeout = params.timeout;
            } else if (params.no_next) {
                aTimeout = OP_TIME_OUT;
            } else {
                if (next.maxCount != -1) {
                    aTimeout = next.maxCount * OP_TIME_OUT;
                }
                if (aTimeout === 0) {
                    aTimeout = FIND_TIME_OUT;
                }
            }
            params.timeout = aTimeout;
            var tmp = 5;
            if (params.interval) {
                tmp = params.interval;
            }
            if (tmp <= 0) {
                tmp = 5;
            }
            maxTicks = $g.$ticks(tmp);
            var found = false;
            params.findPage = 1;
            if (params.sim === true) {
                params.ticks = maxTicks;
            } else {
                params.ticks = 0;
            }
            casper.waitFor(function() {
                $g.acts.update(params);
                if (!checkCondition(condition)) {
                    return true;
                }
                if (params.resetTicks) {
                    --params.ticks;
                    if (params.ticks <= 0) {
                        params.resetTicks = false;
                    } else {
                        return false;
                    }
                } else if (params.ticks >= maxTicks) {
                    params.ticks = 0;
                } else if (!found && params.findPage > 1) {
                    if (params.curPage && casper.exists(params.curPage)) {
                        var pg = casper.fetchText(params.curPage);
                        pg = $g.$trim(pg, "digit");
                        if (pg == params.findPage.toString()) {
                            //$g.debug("switch page success");
                            if (!params.resetTicks) {
                                params.resetTicks = true;
                                params.ticks = $g.$ticks(2);
                            }
                        }
                    }
                }
                if (params.ticks === 0) {
                    //$g.debugCapture("page_" + params.findPage + ".jpg");
                    var item = $find(params.find);
                    if (item) {
                        $g.debug("find");
                        $g.fs.write($g.getPath("fpg"), params.findPage.toString());
                        //$g.debugCapture("items" + params.findPage + ".jpg");
                        $g.acts.current.found = item;
                        if (params.toVar) {
                            $g.variables[params.toVar.name] = $selector(params.toVar.selector);
                        }
                        if ($g.utils.isArray(params.actions)) {
                            parseAction(params.actions[item.index]);
                        } else {
                            parseAction(params.actions);
                        }
                        //$g.acts.current.found = false;
                        //$g.debugCapture("items.jpg");
                        found = true;
                        return true;
                    } else if (params.no_next) {
                        return true;
                    } else if (next.selector || next.scroll || next.key) {
                        ++params.findPage;
                        if (next.maxCount != -1 && params.findPage > next.maxCount) {
                            return true;
                        }
                        if (params.finishChecker) {
                            if (parseCheckers(params.finishChecker)) return true;
                        }
                        $g.debug("in page: " + params.findPage);
                        $g.acts.current.found = false;
                        params.ticks = 1;
                        if (next.scroll) {
                            $g.scrollToBottom();
                        } else if (next.key) {
                            casper.sendKeys("body", casper.page.event.key.Right);
                        } else {
                            $g.variables._nextPage_ = params.findPage;
                            var aSelector = $selector(next.selector);
                            if (!casper.exists(aSelector)) {
                                casper.echo("no more page in find");
                                return true;
                            }
                            parseAction({
                                name: "click",
                                selector: next.selector
                            });
                        }
                    } else {
                        params.ticks = 1;
                        return false;
                    }
                } else {
                    if ((params.tick % 4) == 0) {
                        $g.acts.random();
                    }
                    ++params.ticks;
                }
                return false;
            }, function(){
                if (found) {
                    if (params.jump) {
                        $g.acts.ignore(params.jump);
                    } else if (params.jumpToSuc) {
                        $g.acts.success();
                    }
                } else if (!params.ignorable) {
                    $g.acts.ignoreAll();
                }
            }, function() {
                if (!found && !params.ignorable) {
                    $g.acts.ignoreAll()
                }
            }, params.timeout);
        },
        findex: function(params, condition) {
            var next = {maxCount: -1};
            var aTimeout = 0;
            var maxTicks = 1;
            var isScrolled = false;
            if ($g.utils.isString(params.next)) {
                next.selector = params.next;
            } else if (params.next){
                next = params.next;
                if (!$g.isTruthy(next.maxCount) || !$g.utils.isNumber(next.maxCount)) {
                    next.maxCount = -1;
                }
            }
            if (next.maxCount <= 0) {
                next.maxCount = -1;
            }
            if (params.timeout) {
                aTimeout = params.timeout;
            } else if (params.no_next) {
                aTimeout = OP_TIME_OUT;
            } else {
                if (next.maxCount != -1) {
                    aTimeout = next.maxCount * OP_TIME_OUT;
                }
                if (aTimeout === 0) {
                    aTimeout = FIND_TIME_OUT;
                }
            }
            params.timeout = aTimeout;
            $g.debug("^^^^set step ("+params._step+") find timeout:"+aTimeout);
            $g.log.append("debug", "set step ("+params._step+") find timeout:"+aTimeout);
            var tmp = 5;
            if (params.interval) {
                tmp = params.interval;
            }
            if (tmp <= 0) {
                tmp = 5;
            }
            maxTicks = $g.$ticks(tmp);
            var found = false;
            params.findPage = 1;
            if (params.sim === true) {
                params.ticks = maxTicks;
            } else {
                params.ticks = 0;
            }
            casper.waitFor(function() {
                $g.acts.update(params);
                if (!checkCondition(condition)) {
                    return true;
                }
                if (params.resetTicks) {
                    --params.ticks;
                    if (params.ticks <= 0) {
                        params.resetTicks = false;
                    } else {
                        return false;
                    }
                } else if (params.ticks >= maxTicks) {
                    params.ticks = 0;
                } else if (!found && params.findPage > 1) {
                    if (params.curPage && casper.exists(params.curPage)) {
                        var pg = casper.fetchText(params.curPage);
                        if (pg == params.findPage.toString()) {
                            if (!params.resetTicks) {
                                params.resetTicks = true;
                                params.ticks = $g.$ticks(2);
                            }
                        }
                    }
                }
                if (params.ticks === 0) {
                    //$g.debugCapture("page_" + params.findPage + ".jpg");
                    /*if (params.findPage == 1) {
                        ++_fexId;
                    }*/
                    if (found) {
                        parseAction(params.actions);
                        //$g.acts.current.foundex = false;
                        return true;
                    }
                    var item = $findex(params.find);
                    if (item) {
                        $g.debug("findex");
                        $g.fs.write($g.getPath("fpg"), params.findPage.toString());
                        //$g.debugCapture("items" + params.findPage + ".jpg");
                        //$g.debugCapture("itemsex.jpg");
                        $g.acts.current.foundex = item;
                        if (params.toVar) {
                            $g.variables[params.toVar.name] = $selector(params.toVar.selector);
                        }
                        params.ticks = $g.$ticks(3);
                        found = true;
                        return false;
                    } else if (params.no_next) {
                        return true;
                    } else if (next.selector || next.scroll || next.key) {
                        if (params.action_until) {
                            if (!parseCheckers(params.action_until.checkers)) {
                                params.ticks = $g.$ticks(3);
                                parseAction(params.action_until.actions);
                                return false;
                            }
                        }
                        ++params.findPage;
                        if (next.maxCount != -1 && params.findPage > next.maxCount) {
                            return true;
                        }
                        if (params.finishChecker) {
                            if (parseCheckers(params.finishChecker)) return true;
                        }
                        $g.debug("in page ex: " + params.findPage);
                        $g.acts.current.found = false;
                        params.ticks = 1;
                        if (next.scroll) {
                            $g.scrollToBottom();
                        } else if (next.key) {
                            casper.sendKeys("body", casper.page.event.key.Right);
                        } else {
                            $g.variables._nextPage_ = params.findPage;
                            var nsiSelectors = $g.$ARR(next.selector), foundNsi = false;
                            for (var nsi = 0, nsiCnt = nsiSelectors.length; nsi < nsiCnt; ++nsi) {
                                var aSelector = $selector(nsiSelectors[nsi]);
                                if (!casper.exists(aSelector)) {
                                    continue;
                                }
                                foundNsi = true;
                                parseAction({
                                    name: "click",
                                    selector: nsiSelectors[nsi]
                                });
                                break;
                            }
                            if (!foundNsi) {
                                casper.echo("no more page in findex");
                                return true;
                            }
                        }
                    } else {
                        params.ticks = 1;
                        return false;
                    }
                } else {
                    if ((params.tick % 4) == 0) {
                        $g.acts.random();
                    }
                    ++params.ticks;
                }
                return false;
            }, function(){
                if (found) {
                    if (params.jump) {
                        $g.acts.ignore(params.jump);
                    } else if (params.jumpToSuc) {
                        $g.acts.success();
                    }
                } else if (!params.ignorable) {
                    $g.acts.ignoreAll();
                }
            }, function() {
                if (!found && !params.ignorable) {
                    $g.acts.ignoreAll()
                }
            }, params.timeout);
        },
        snapshot: function(params, condition) {
            params._ticks = $g.$ticks(2);
            params._changedBG = false;
            casper.waitFor(function() {
                --params._ticks;
                if (!params._changedBG) {
                    params._changedBG = true;
                    $g.correctBackgroundColor();
                    if (params.addStyle) {
                        var styles = $g.$ARR(params.addStyle);
                        for (var i = 0; i < styles.length; ++i) {
                            $g.addStyle(styles[i]);
                        }
                    }
                }
                $g.acts.update(params);
                if (params._ticks == 0) {
                    if (checkCondition(condition)) {
                        if (params.byPos) captureByPos(params);
                        else {
                            parseAction({
                                name: "snapshot",
                                selector: params.selector
                            });
                        }
                    }
                    return true;
                }
                return false;
            }, $g.noop, $g.noop, 6000);
        },
        variables: function(params, condition) {
            casper.then(function() {
                $g.acts.update(params);
                if (!checkCondition(condition)) {
                    return;
                }
                var vs = $g.$ARR(params);
                var u = casper.getCurrentUrl(), preU = '';
                var pos = u.indexOf('://');
                if (pos != -1) {
                    pos = u.indexOf('/', pos + 3);
                    if (pos != -1) preU = u.substr(0, pos);
                }
                for (var i = 0; i < vs.length; ++i) {
                    var v = vs[i];
                    if (v.fromQueryString) {
                        var fqsU = v.url || u;
                        var fqsItem = {};
                        fqsItem[v.name] = v.key ? v.key : v.name;
                        var fqs = crawlerFromUrl({
                            "names":fqsItem
                        }, fqsU);
                        fqs = fqs[0];
                        if (fqs[v.name]) $g.variables[v.name] = fqs[v.name];
                    } else if (v.value) {
                        $g.variables[v.name] = v.value;
                    } else if (v.isRC) {
                        var tmpRC = casper.getElementBounds(v.selector);
                        $g.adjustOffsetByFrame(tmpRC);
                        $g.variables[v.name] = tmpRC;
                    } else if (v.fromPostRet) {
                        $g.variables[v.name] = $g.variables['post_ret_content'];
                        if (v.trim) $g.variables[v.name] = $g.$trimArr($g.variables[v.name], v.trim);
                    } else if (v.selector && v.selector.find) {
                        $g.variables[v.name] = $selector(v.selector);
                    } else if ($g.utils.isObject(v.random)) {
                        $g.variables[v.name] = $g.math.randomBetween(v.random.start, v.random.end);
                    } else if (v.fromResult) {
                        var index = 0;
                        if (v.index == "last") {
                            index = $g.results.length - 1;
                        } else if ($g.utils.isNumber(v.index)){
                            index = v.index;
                        } else {
                            v.index = $g.finalizeString(v.index);
                            index = parseInt(v.index);
                            v.index = index;
                        }
                        if (index < 0 || $g.results.length == 0) {
                            continue;
                        }
                        $g.variables[v.name] = $g.results[index][0][v.name];
                    } else if (v.fromJsVar) {
                        var tmpVar = casper.evaluate(function(n){
                                return window[n];
                        }, v.name);
                        if ($g.utils.isArray(tmpVar)) {
                            if (v.condition) {
                                var found = false;
                                $g.log.append("variables", "fromJsVar");
                                for (var j = 0; j < tmpVar.length; ++j) {
                                    var aVar = tmpVar[j];
                                    if (aVar[v.condition.name] == v.condition.value) {
                                        found = true;
                                        $g.variables[v.name] = aVar;
                                        break;
                                    }
                                }
                            } else {
                                $g.variables[v.name] = tmpVar;
                            }
                        } else {
                            if (v.field) {
                                $g.variables[v.name] = tmpVar[v.field];
                            } else {
                                $g.variables[v.name] = tmpVar;
                            }
                        }
                        $g.echoLog(JSON.stringify($g.variables));
                    } else if (v.selector) {
                        v.selector.attrOnly = true;
                        var aSelector = $selector(v.selector);
                        $action(v.selector, aSelector, function() {
                            if (!casper.exists(aSelector)) {
                                $g.logEleNotExist(aSelector);
                                return;
                            }
                            var ele;
                            if (v.fromSet) {
                                ele = casper.getElementsInfo(aSelector);
                                if (v.index == "last") {
                                    ele = ele[ele.length - 1];
                                } else if ($g.utils.isString(v.index)){
                                    v.index = $g.finalizeString(v.index);
                                    index = parseInt(v.index);
                                    v.index = index;
                                    ele = ele[v.index];
                                } else if (v.index < ele.length && v.index >= 0) {
                                    ele = ele[v.index];
                                } else if (v.index < 0 && Math.abs(v.index) < ele.length) {
                                    ele = ele[ele.length + v.index];
                                } else {
                                    $g.debug("Element index is outbound!");
                                    return;
                                }
                            } else {
                                ele = casper.getElementInfo(aSelector);
                            }
                            var data;
                            if ($g.utils.isString(v.from)) {
                                data = ele.attributes[v.from];
                            } else {
                                data = ele.text.trim();
                            }
                            data = $g.$trimArr(data, v.trim);
                            if (v.toArray) {
                                var dataSep = v.sep ||  ',';
                                data = data.split(dataSep);
                                if ($g.utils.isNumber(v.getFromArrayIndex)) {
                                    data = data[v.getFromArrayIndex];
                                }
                            }
                            $g.variables[v.name] = data;
                        });
                    }
                    if (v.isUrl) {
                        $g.variables[v.name] = formatUrl($g.variables[v.name] ? $g.variables[v.name] : '', u, preU);
                    }
                    if (v.decodeUrl) {
                        $g.variables[v.name] = decodeURIComponent($g.variables[v.name]);
                    } else if (v.encodeUrl) {
                        $g.variables[v.name] = encodeURIComponent($g.variables[v.name]);
                    }
                }
                //$g.utils.dump($g.variables);
            });
        },
        resetVar: function(params, condition) {
            casper.then(function() {
                $g.acts.update(params);
                if (!checkCondition(condition)) {
                    return;
                }
                $g.variables = {};
            });
        },
        crawler: function(params, condition) {
            casper.then(function() {
                $g.acts.update(params);
                if (!checkCondition(condition)) {
                    return;
                }
                var vs = $g.$ARR(params);
                for (var i = 0; i < vs.length; ++i) {
                    var tmp, item = vs[i];
                    if (item.fromUrl) {
                        tmp = crawlerFromUrl(item);
                    } else if (item.fromVariables) {
                        var o = {};
                        for (var vj = 0; vj < item.fromVariables.length; ++vj) {
                            var vjItem = item.fromVariables[vj];
                            o[vjItem[0]] = $g.variables[vjItem[1]] ? $g.variables[vjItem[1]] : '';
                        }
                        tmp = [o];
                    } else if (item.url) {
                        var o = {};
                        o[item.name] = casper.getCurrentUrl();
                        tmp = [o];
                    } else if (item.complex) {
                        tmp = crawlerComplex(item);
                    } else {
                        tmp = crawlerNormal(item);
                    }
                    $g.results.push(tmp);
                }
            });
        },
        crawlerEx: function(params, condition) {
            casper.then(function() {
                $g.acts.update(params);
                if (!checkCondition(condition)) {
                    return;
                }
                var vs = $g.$ARR(params);
                for (var i = 0; i < vs.length; ++i) {
                    var tmp = {}, item = vs[i];
                    if (item.fromUrl) {
                        $g.resultsEx[item.name] = crawlerFromUrl(item);
                    } else if (item.fromVariables) {
                        if ($g.utils.isString(item.fromVariables)) {
                            $g.resultsEx[item.name] = $g.variables[item.fromVariables] ? $g.variables[item.fromVariables] : '';
                        } else {
                            var o = {};
                            for (var vj = 0; vj < item.fromVariables.length; ++vj) {
                                var vjItem = item.fromVariables[vj];
                                o[vjItem[0]] = $g.variables[vjItem[1]] ? $g.variables[vjItem[1]] : '';
                            }
                            $g.resultsEx[item.name] = o;
                        }
                    } else if (item.url) {
                        $g.resultsEx[item.name] = casper.getCurrentUrl();
                    } else if (item.complex) {
                        $g.resultsEx[item.name] = crawlerComplex(item);
                    } else {
                        $g.resultsEx[item.name] = crawlerNormal(item);
                    }
                }
            });
        },
        jump: function(params, condition) {
            var checkFun = function(ret) {
                if (!ret) {
                    return;
                }
                if (params.failed) {
                    var text = "Failed when check jumping in step: " + $g.acts.curStep();
                    var aSelector = $selector(params.failed);
                    $action(params.failed, aSelector, function() {
                        if (!casper.exists(aSelector)) {
                            return;
                        }
                        text = casper.getElementInfo(aSelector).text;
                    });
                    $g.acts.ignoreAll(text);
                } else {
                    if (params.to) {
                        $g.acts.to(params);
                    } else if (params.label) {
                        $g.acts.toLabel(params.label, params);
                    } else if (params.step && params.step != -1) {
                        $g.acts.ignore(params.step);
                    } else if (params.continue_loop) {
                        $g.acts.continue_loop(params);
                    } else if (params.exit_loop) {
                        $g.acts.exit_loop(params);
                    } else {
                        $g.acts.success();
                    }
                }
            }
            if (params.test) {
                var isSuc = false;
                casper.waitFor(function() {
                    $g.acts.update(params);
                    var ret = false;
                    $g.$nothrow(function() {
                        ret = parseCheckers(params.checkers);
                        if (ret) {
                            isSuc = true;
                        } else if (params.reverseCheckers && parseCheckers(params.reverseCheckers)) {
                            ret = true;
                            isSuc = false;
                        }
                    }, function(err) {
                        $g.debug(err);
                    });
                    return ret;
                }, function() { checkFun(isSuc); }, 
                $g.noop, params.timeout ? params.timeout : OP_TIME_OUT);
            } else {
                casper.then(function() {
                    $g.acts.update(params);
                    if (!checkCondition(condition)) {
                        return;
                    }
                    if (params.checkers) {
                        checkFun(parseCheckers(params.checkers));
                    } else {
                        checkFun(true);
                    }
                });
            }
        },
        scroll: function(params, condition) {
            casper.then(function() {
                $g.acts.update(params);
                if (!checkCondition(condition)) {
                    return;
                }
                parseAction({
                    name:"scroll", selector:params.selector
                });
            });
        },
        mouseOver: function(params, condition) {
            casper.then(function() {
                $g.acts.update(params);
                if (!checkCondition(condition)) {
                    return;
                }
                parseAction({
                    name:"move", selector:params.selector
                });
            });
        },
        reopen: function(params, condition) {
            casper.then(function() {
                $g.acts.update(params);
                if (!checkCondition(condition)) {
                    return;
                }
                var url = casper.getCurrentUrl();
                if (params.replace) {
                    url = url.replace(params.replace.from, params.replace.to);
                }
                if (params.trim) {
                    var aTrim = $g.$ARR(params.trim);
                    for (var i = 0; i < aTrim.length; ++i) {
                        url = $g.$trim(url, aTrim[i]);
                    }
                }
                if (params.concat) {
                    url += params.concat;
                }
                $g.debug(url);
                $g.echoLog(url);
                if (url == casper.getCurrentUrl()) {
                    casper.reload();
                } else {
                    if (params.options && $g.utils.isObject(params.options)) {
                        casper.open(url, params.options);
                    } else {
                        casper.open(url);
                    }
                }
            });
        },
        call: function(params, condition) {
            casper.then(function() {
                $g.acts.update(params);
                if (!checkCondition(condition)) {
                    $g.echoLog("action is ignored");
                    return;
                }
                callScript(params);
            });
        },
        getForm: function(params, condition) {
            casper.waitFor(function() {
                $g.acts.update(params);
                return $getForm(params);
            }, $g.noop, $g.noop,
            params.timeout ? params.timeout : 10 * 60 * 1000);
        },
        switchPage: function(params, condition) {
            casper.then(function(){
                $g.acts.update(params);
                if ((params.popup && !$toPopup(params.popup)) || 
                    ((params.frame || params.frameHtml) && !$toFrame(params))) {
                    $g.acts.ignoreAll();
                }
            });
        },
        backPage: function(params, condition) {
            casper.then(function(){
                $g.acts.update(params);
                if (params.popup) {
                    $backPopup();
                } else if (params.frame) {
                    $backFrame();
                }
            });
        },
        dumpVar: function(params, condition) {
            casper.then(function(){
                $g.acts.update(params);
                $g.utils.dump($g.variables);
                $g.echoLog(JSON.stringify($g.variables));
            });
        },
        random: function(params, condition) {
            params.ticks = $g.$ticks(2);
            casper.waitFor(function() {
                --params.ticks;
                $g.acts.update(params);
                if (params.ticks == 0) {
                    $g.acts.random();
                    $g.scrollToBottom();
                    $g.scrollToTop();
                    params.ticks = $g.$ticks(2);
                }
                return false;
            }, $g.noop, $g.noop,
            params.timeout ? params.timeout : 6000);
        },
        lock: function(params, condition) {
            casper.waitFor(function() {
                $g.acts.update(params);
                if (!params.inited) {
                    params.inited = true;
                    $g.lockFilePath = $g.getLockFilePath('lock');
                    $g.fs.write($g.lockFilePath, '1');
                    $g.unLockFilePath = $g.getLockFilePath('unlock');
                }
                if ($g.fs.exists($g.lockFilePath)) return false;
                if (!$g.fs.exists($g.unLockFilePath)) return false;
                var v = $g.$json($g.unLockFilePath);
                $g.fs.$remove($g.unLockFilePath);
                $g.unLockFilePath = false;
                if (v) $g.utils.mergeObjects($g.variables, v);
                return true;
            }, $g.noop, function(){$g.acts.ignoreAll('Lock timeout');},
            params.timeout ? params.timeout : 10 * 60 * 1000);
        },
        dumpResponse: function(params) {
            if (params.wait) {
                params.dump = false;
                casper.waitFor(function() {
                    $g.acts.update(params);
                    if (!params.dump) {
                        params.dump = true;
                        if (!$dumpResponse(params, $g.getVCodeTextPath("res.txt"))) {
                            return false;
                        }
                        params.waitFile = $g.getVCodeTextPath("resback.txt");
                        $g.debug("wait for res back: " + params.waitFile);
                        $g.echoLog("wait for res back: " + params.waitFile);
                        return false;
                    }
                    if (!$g.fs.exists(params.waitFile)) {
                        return false;
                    }
                    var c = $g.fs.read(params.waitFile);
                    if (c == '1') {
                        $g.fs.$remove($g.getPath("get_res"));
                        $g.fs.$remove(params.waitFile);
                        return true;
                    }
                    $g.fs.$remove(params.waitFile);
                    $g.acts.ignoreAll("wait res back file failed");
                    return true;
                }, $g.noop, function(){$g.acts.ignoreAll('wait res back file timeout');},
                params.timeout ? params.timeout : 3 * 60 * 1000);
            } else {
                casper.then(function() {
                    $g.acts.update(params);
                    $dumpResponse(params, $g.getVCodeTextPath("res.txt"));
                });
            }
        },
        clearFinder: function(params) {
            casper.then(function() {
                $g.acts.update(params);
                $g.acts.current.found = false;
                $g.acts.current.foundex = false;
            });
        },
        dumpElement:function(params) {
            casper.then(function() {
                $g.acts.update(params);
                if (!casper.exists(params.selector)) {
                    $g.debug('element: ' + params.selector + ' does not exist');
                    return;
                }
                var e = casper.getElementInfo(params.selector);
                $g.debug(JSON.stringify(e));
                $g.debug(casper.getElementBounds(params.selector));
                if (params.toFile) {
                    $g.fs.write(JSON.stringify(e), $g.getPath(params.toFile));
                }
            });
        },
        counter:function(params) {
            casper.then(function() {
                $g.acts.update(params);
                if (!casper.exists(params.selector)) {
                    $g.debug("element count is: 0");
                    return;
                }
                var eles = casper.getElementsInfo(params.selector);
                $g.debug("element count is: "+eles.length);
            });
        },
        saveContent:function(params) {
            casper.then(function() {
                $g.acts.update(params);
                $g.saveHtml(params.fileName);
            });
        },
        loadImages:function(params) {
            casper.then(function() {
                $g.acts.update(params);
                $g.setLoadImages(params.value);
            });
        },
        echo:function(params) {
            casper.then(function() {
                $g.acts.update(params);
                $g.echoLog(params.msg);
            });
        },
        ajax:function(params, condition) {
            casper.then(function() {
                $g.acts.update(params);
                if (!checkCondition(condition)) {
                    $g.echoLog("action is ignored");
                    return;
                }
                if (!params.options) params.options = {};
                casper.evaluate(function(url, method, data) {
                    var xmlhttp = new XMLHttpRequest();
                    if(xmlhttp.overrideMimeType) {
                        xmlhttp.overrideMimeType("text/html");
                    }
                    xmlhttp.onreadystatechange=function(){};
                    xmlhttp.open(method, url, true);
                    if (method == 'post') {
                        xmlhttp.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
                        var sep = '', p = '';
                        for (var a in data) {
                            p += a+'='+data[a]+sep;
                            sep = '&';
                        }
                        xmlhttp.send(p);
                    }
                }, params.url, params.options.method || 'get', params.options.data || {});
            });
        },
        uploadFile:function(params, condition) {
            casper.then(function() {
                $g.acts.update(params);
                if (!checkCondition(condition)) {
                    $g.echoLog("action is ignored");
                    return;
                }
                casper.page.uploadFile(params.selector, params.path);
            });
        },
        createForm:function(params, condition) {
            casper.then(function() {
                $g.acts.update(params);
                if (!checkCondition(condition)) {
                    $g.echoLog("action is ignored");
                    return;
                }
                casper.evaluate(function(id, url, fields){
                    var f = document.createElement('form');
                    f.method = 'post';
                    f.enctype = 'multipart/form-data';
                    f.action = url;
                    f.id = id;
                    var h = '';
                    for (var i = 0; i < fields.length; ++i) {
                        fields[i].value = fields[i].value || '';
                        h += '<input type="'+fields[i].type+'" ';
                        if (fields[i].name) h+= ' name="'+fields[i].name+'"';
                        h+= ' value="'+fields[i].value+'" id="'+fields[i].id+'">';
                    }
                    f.innerHTML = h;
                    document.body.appendChild(f);
                }, params.id, params.action, params.fields);
            });
        },
        setContent:function(params, condition) {
            casper.then(function() {
                $g.acts.update(params);
                if (!checkCondition(condition)) {
                    $g.echoLog("action is ignored");
                    return;
                }
                casper.setContent('<html><head><meta charset="utf-8" /></head><body>'+params.html+'</body></html>');
                casper.page.render("setcontent.png");
            });
        },
        postFile:function(params, condition) {
            casper.waitFor(function() {
                $g.acts.update(params);
                if (!params.inited) {
                    if (!checkCondition(condition)) {
                        $g.echoLog("action is ignored");
                        return true;
                    }
                    params.inited = true;
                    params.target_file = $g.getPostRetFilePath();
                    $g.fs.$remove(params.target_file);
                    $g.savePostFile(params);
                }
                if (!$g.fs.exists(params.target_file)) {
                    return false;
                }
                $g.variables['post_ret_content'] = $g.fs.read(params.target_file);
                $g.echoLog(JSON.stringify($g.variables));
                $g.fs.$remove(params.target_file);
                return true;
            }, $g.noop, function(){$g.ignoreAll('wait post ret file failed');}, params.timeout ? params.timeout : OP_TIME_OUT);
        },
        checkPostRet:function(params, condition) {
            casper.then(function() {
                $g.acts.update(params);
                if (!checkCondition(condition)) {
                    $g.echoLog("action is ignored");
                    return true;
                }
                if (!parseCheckers(params.checkers)) {
                    var errorText = errorText = params.errorText ? params.errorText : "Failed to check condition.";
                    $g.acts.ignoreAll(errorText);
                }
            });
        },
        domOp: function(params, condition) {
            casper.then(function() {
                $g.acts.update(params);
                if (!checkCondition(condition)) {
                    $g.echoLog("action is ignored");
                    return true;
                }
                casper.evaluate(function(s, op, pa){
                    var n = document.querySelectorAll(s);
                    if (n.length === 0) return;
                    n = n[0];
                    var o = document.createElement(pa.name);
                    if (pa.html) o.innerHTML = pa.html;
                    else if (pa.text) o.innerText = pa.text;
                    if (pa.attrs) {
                        for (var p in pa.attrs) {
                            o.setAttribute(p, pa.attrs[p]);
                        }
                    }
                    if (op == 'append') n.appendChild(o);
                    else if (op == 'insertBefore') {
                        var child = n.firstChild;
                        if (pa.childSelector) {
                            child = document.querySelectorAll(pa.childSelector);
                            if (child.length > 0) child = child[0];
                            else child = n.firstChild;
                        }
                        n.insertBefore(o, child);
                    }
                }, params.selector, params.operator, params.options);
            });
        },
        tagElement: function(params, condition) {
            casper.then(function() {
                $g.acts.update(params);
                if (!checkCondition(condition)) {
                    $g.echoLog("action is ignored");
                    return true;
                }
                $g.variables['_tag_d_'] = '';
                var aSelector = $selector(params.selector);
                var cnt = casper.evaluate(function(s){
                    var nodes = document.querySelectorAll(s);
                    for (var i = 0; i < nodes.length; ++i) {
                        nodes[i].setAttribute('_tag_d_', i.toString());
                    }
                    return nodes.length;
                }, aSelector);
                for (var i = 0; i < cnt; ++i) {
                    if (params.type == 'visible') {
                        var suffix = "[_tag_d_='"+i.toString()+"']";
                        if (casper.visible(aSelector + suffix)) {
                            $g.variables['_tag_d_'] = suffix;
                            break;
                        }
                    }
                }
            });
        },
        until: function(params, condition) {
            var maxTicks = $g.$ticks(params.loopInterval ? params.interval : 5);
            params.ticks = 0;
            casper.waitFor(function() {
                $g.acts.update(params);
                if (!params.inited) {
                    if (!checkCondition(condition)) {
                        $g.echoLog("action is ignored");
                        return true;
                    }
                    params.inited = true;
                }
                if (parseCheckers(params.checkers)) return true;
                if (params.ticks === 0) {
                    params.ticks = maxTicks;
                    for (var i = 0; i < params.actions.length; ++i) {
                        if (parseCheckers(params.actions[i].condition)) {
                            parseAction(params.actions[i].actions);
                            break;
                        }
                    }
                } else {
                    --params.ticks;
                }
                return false;
            }, $g.noop, function(){$g.ignoreAll('until failed');}, params.timeout ? params.timeout : OP_TIME_OUT);
        },
        processUrl: function(params, condition) {
            casper.then(function() {
                $g.acts.update(params);
                if (!checkCondition(condition)) {
                    $g.echoLog("action is ignored");
                    return true;
                }
                var urlPart = params.url.split('/');
                if (urlPart.length >= 2) $g.variables._process_url_last_part_ = urlPart[urlPart.length - 2];
                else $g.variables._process_url_last_part_ = '';
                $g.variables._process_url_page_ = urlPart[urlPart.length - 1];
                var pos = $g.variables._process_url_page_.indexOf('?');
                $g.variables._process_url_query_string_ = '';
                if (pos !== -1) {
                    $g.variables._process_url_query_string_ = $g.variables._process_url_page_.substr(pos + 1);
                    $g.variables._process_url_page_ = $g.variables._process_url_page_.substr(0, pos);
                }
                urlPart = params.url.lastIndexOf('/');
                $g.variables._process_url_parent_ = params.url.substr(0, urlPart);
                urlPart = $g.variables._process_url_parent_.indexOf('://');
                urlPart += 3;
                urlPart = $g.variables._process_url_parent_.indexOf('/', urlPart);
                $g.variables._process_url_root_ = $g.variables._process_url_parent_.substr(0, urlPart);
                $g.variables._process_url_page_path_ = $g.variables._process_url_parent_.substring(urlPart + 1);
                urlPart = $g.variables._process_url_page_path_.split('/');
                $g.variables._process_url_first_part_ = urlPart[0];
                if ($g.variables._process_url_last_part_.length === 0) $g.variables._process_url_last_part_ = $g.variables._process_url_first_part_;
                //$g.debug($g.variables);
            });
        },
        getNid: function(params, condition) {
            casper.then(function() {
                $g.acts.update(params);
                if (!checkCondition(condition)) {
                    $g.echoLog("action is ignored");
                    return true;
                }
                var act = {name:"get_nid"};
                $g.extend(act, params);
                parseAction(act);
            });
        }
    };
}
Actions.create = function(_casper, _$g) {
    casper = _casper;
    $g = _$g;
    initActions();
}
module.exports = Actions;
