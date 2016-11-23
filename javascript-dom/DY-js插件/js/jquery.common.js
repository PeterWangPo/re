var DEFAULT_TB_CSS='table table-striped table-bordered table-hover';
function noop(){}
String.prototype.format = String.prototype.f = function() {
    var s = this,
        i = arguments.length;
    while (i--) {
        s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
    }
    return s;
}
function startsWith(str,prefix){
    return str.lastIndexOf(prefix,0) === 0;
}
function isNull(str) {
    if (str == null || str == "") return true;
    var regu = "^[ \t]+$";
    var re = new RegExp(regu);
    return re.test(str);
}
function _L(t)
{
    if (typeof(Lang) == 'undefined'){
        return t;
    }
    return !Lang[t] ? t : Lang[t];
}
function toBigCamel(s)
{
    return s.charAt(0).toUpperCase()+ s.substr(1);
}
function field_converter(r,s)
{
    for(var n in s)
    {
        if (!r[n])
        {
            continue;
        }
        var t = typeof(s[n]);
        if (t == "string")
        {
            r[n] = s[n].format(r[n]);
        }
        else if (t == "function")
        {
            r[n] = s[n](r[n]);
        }
    }
}
function obj_to_p(obj)
{
    var obType=typeof(obj);
    if (obType=="undefined")
    {
        return "";
    }
    if (obType == "string")
    {
        return obj;
    }
    var sep = '',p = '';
    for (k in obj)
    {
        p += sep+k+'='+obj[k];
        sep = '&';
    }
    return p;
}
function F(name) {
    return document.all ? window.frames[name] : $("#"+name)[0].contentWindow;
}
function toUrl(url)
{
    location.assign(url);
}
function toSearch(url,f)
{
    url += "&"+ f.serialize();
    toUrl(url);
}
function refresh_page()
{
    window.location.reload();
}
function new_img(src)
{
    var m = new Image();
    m.src = src;
    return m;
}
if (top == window) {
    var _loading_img = new_img('img/loading_small.gif');
    var _img2_ = new_img('img/warning_16.png');
    var _img3_ = new_img('img/loading.gif');
}
function gimg(s)
{
    return html_img({src:'img/' + s});
}
function img_loading()
{
    return html_img({src:'img/loading_small.gif'});
}
function img_spacer(w, h)
{
    w = w || 1;
    h = h || 1;
    return html_img({src:'img/ie-spacer.gif',width:w+'px',height:h+'px'});
}
function loading(frameId, page, bdcache) {
    var frame = $("#"+frameId);
    if (frame.length == 0) return;
    var ifm = typeof(frameId) == 'string' ? F(frameId) : frameId;
    var org_page = frame.attr("src");
    if (isNull(org_page) && (!page || isNull(page))){
        return;
    }
    if (!page || isNull(page)) {
        page = frame.attr("src");
    }
    if (bdcache && !isNull(org_page) && org_page == page){
        return;
    }
    var img_url = top._loading_img.src;
    frame.attr("src", "about:blank");
    if (ifm.window && ifm.window.document && ifm.window.document.body) {
        ifm.window.document.body.style.backgroundColor = "white";
        ifm.window.document.body.style.fontSize = "12px";
        ifm.window.document.body.innerHTML = "&nbsp;<br>"+html_div(html_img({border:'0',src:img_url})+"<br>" + _L("Loading page..."),{align:'center'});
    }
    frame.attr("src", page);
}
function mloading(frameId, bdcache) {
    loading(frameId, $("#"+frameId).attr('msrc'), bdcache);
}
function createOverlay(s, cls, html, divAttr)
{
    if (typeof(s) == "string") s = $(s);
    else if (!s) s = $('body');
    if (typeof(cls) == 'string') cls = {'class':cls};
    var i = '';
    if (cls !== false) {
        cls = cls || {'class':'icon-spin icon-spinner orange2 bigger-160'};
        i = html_i('', cls);
    }
    html = html || '';
    var dc = {'class':'message-loading-overlay'};
    if (divAttr) dc = $.extend(dc, divAttr);
    s.append(html_div(i + html, dc));
}
function hideOverlay(s)
{
    if (!s) s = '';
    $(s + ' ' + '.message-loading-overlay').remove();
}
function form_validation(selector, rules, submitHandler)
{
    var nr={},m={};
    for(var r in rules)
    {
        nr[r] = {};
        m[r] = {};
        for(var p in rules[r])
        {
            if ($.isArray(rules[r][p]))
            {
                nr[r][p] = rules[r][p][0];
                m[r][p] = rules[r][p][1];
            }
            else
            {
                nr[r][p] = rules[r][p];
            }
        }
    }
    $(selector).validate({
        errorElement: 'div',
        errorClass: 'help-inline',
        focusInvalid: true,
        rules: nr,
        messages: m,
        invalidHandler: function (event, validator) {
            $('.alert-danger', $('.login-form')).show();
        },
        highlight: function (e) {
            $(e).closest('.form-group').removeClass('has-info').addClass('has-error');
        },
        success: function (e) {
            $(e).closest('.form-group').removeClass('has-error').addClass('has-info');
            $(e).remove();
        },
        errorPlacement: function (error, element) {
            if(element.is(':checkbox') || element.is(':radio')) {
                var controls = element.closest('div[class*="col-"]');
                if(controls.find(':checkbox,:radio').length > 1) controls.append(error);
                else error.insertAfter(element.nextAll('.lbl:eq(0)').eq(0));
            }
            else if(element.is('.select2')) {
                error.insertAfter(element.siblings('[class*="select2-container"]:eq(0)'));
            }
            else if(element.is('.chosen-select')) {
                error.insertAfter(element.siblings('[class*="chosen-container"]:eq(0)'));
            }
            else error.insertAfter(element.parent());
        },
        submitHandler: submitHandler
    });
}
function gritter_remove_all() {
/*    if (window != top) {
        top.gritter_remove_all();
        return;
    }*/
    $.gritter.removeAll();
}
function gritter_notice(notice, option) {
/*    if (window != top) {
        top.gritter_notice(notice, option);
        return;
    }*/
    //title, notice, timeout, type, position, image, callbacks, css
    option = option || {};
    var title = option.title || "";
    var image = option.image || "";
    var css = option.css || "";
    var timeout = option.timeout || 3;
    var types = {
        error:"gritter-error",
        success:"gritter-success",
        warning:"gritter-warning",
        info:"gritter-info gritter-light"
    };
    var type = types[option.type] ? types[option.type] : types["info"];
    var positions = {
        center:"gritter-center",
        right:""
    };
    var position = option.position ? positions[option.position] : positions["right"];
    return $.gritter.add({
        text: notice,
        title: title,
        image: image,
        time: timeout * 1000,
        class_name: type + " " + position + " " + css,
        before_open: function(e) {
            if (option.before_open) {
                option.before_open(e);
            }
        },
        after_open: function(e) {
            if (option.after_open) {
                option.after_open(e);
            }
        },
        before_close: function(e, manual_close) {
            if (option.before_close) {
                option.before_close(e, manual_close);
            }
        },
        after_close: function(e, manual_close) {
            if (option.after_close) {
                option.after_close(e, manual_close);
            }
        }
    });
}
function ajax_action(options) {
    if (options.removeNote) {
        gritter_remove_all();
    }
    var gid = false;
    if (!options.noPrompt) {
        if (!options.text) options.text = _L('Operation is in progress, please wait...');
        gid = gritter_notice(options.text,{
            timeout:4,
            image:'img/loading_small.gif'
        });
    }
    if(options.loadPrompt){
        var id = options.ctnrId;
        var load_ctnr_class = "data-loading-overlay";
        if($("#"+id+" ."+load_ctnr_class).length){
            return false;
        }
        var loading_ele = html_div(html_i('',{class:'icon-spin icon-spinner bigger-160'})+_L('loading...'),{class:load_ctnr_class});
        $("#"+id).append(loading_ele);
    }
    $.ajax({
        url: options.url,
        data: options.params ? options.params : "",
        type: options.action,
        dataType: options.dataType || 'json',
        async:options.async === false ? false : true,
        success: function(data) {
            if (gid !== false) $.gritter.remove(gid);
            if (!data.success)
            {
                if (data.err == "need_login")
                {
                    gritter_notice(data.info,{
                        timeout:4,
                        type:'error',
                        image:'img/loading_small.gif',
                        before_close:function(){
                            top.location.href = data.url;
                        }
                    });
                    return;
                }
            }
            if (options.fn) options.fn(data);
            if(options.loadPrompt){
                $("#"+id+" ."+load_ctnr_class).remove();
            }
            if (options.noPrompt) {
                if (data.success && options.needRefresh) refresh_page();
                return;
            }
            if (data.success && options.needRefresh) {
                gritter_notice(data.info+"<br />"+_L("Prepare to refresh page..."),{
                    timeout:data.success ? 2 : 5,
                    type:data.info_type,
                    image:'img/loading_small.gif',
                    before_close:function(){
                        refresh_page();
                    }
                });
                return;
            }
            gritter_notice(data.info,{
                timeout:data.success ? 3 : 5,
                type:data.info_type
            });
        },
        timeout: options.timeout || 60000,
        error: function() {
            if (options.fn) options.fn({success:false});
            if (options.noPrompt) return;
            if (gid !== false) $.gritter.remove(gid);
            var failText = options.failText || _L('Failed to do the operation');
            gritter_notice(failText,{
                timeout:5,
                type:"error"
            });
        }
    });
}
function ajax_post(options) {
    options.action = "POST";
    ajax_action(options);
}
function ajax_get(options) {
    options.action = "GET";
    ajax_action(options);
}
function $up_file(options) {
    if (options.removeNote) {
        gritter_remove_all();
    }
    var gid = false;
    if (!options.noPrompt) {
        if (!options.text) options.text = _L('Operation is in progress, please wait...');
        gid = gritter_notice(options.text,{
            timeout:4,
            image:'img/loading_small.gif'
        });
    }
    $.ajaxFileUpload({
        url: options.url,
        secureuri: false,
        fileElementId: options.fileElementId,
        dataType: options.dataType || 'json',
        success: function(data) {
            if (gid !== false) $.gritter.remove(gid);
            if (!data.success)
            {
                if (data.err == "need_login")
                {
                    gritter_notice(data.info,{
                        timeout:4,
                        type:'error',
                        image:'img/loading_small.gif',
                        before_close:function(){
                            top.location.href = data.url;
                        }
                    });
                    return;
                }
            }
            if (options.fn) options.fn(data);
            if (options.noPrompt) {
                if (data.success && options.needRefresh) refresh_page();
                return;
            }
            if (data.success && options.needRefresh) {
                gritter_notice(data.info+"<br />"+_L("Prepare to refresh page..."),{
                    timeout:data.success ? 2 : 5,
                    type:data.info_type,
                    image:'img/loading_small.gif',
                    before_close:function(){
                        refresh_page();
                    }
                });
                return;
            }
            gritter_notice(data.info,{
                timeout:data.success ? 3 : 5,
                type:data.info_type
            });
        },
        timeout: options.timeout || 300000,
        error: function() {
            if (options.fn) options.fn({success:false});
            if (options.noPrompt) return;
            if (gid !== false) $.gritter.remove(gid);
            var failText = options.failText || _L('Failed to do the operation');
            gritter_notice(failText,{
                timeout:5,
                type:"error"
            });
        }
    });
}
function set_tooltip(o,t)
{
    o.attr({"data-rel":"tooltip","data-original-title":t});
}
function render_page()
{
    $('[data-rel=tooltip]').each(function(i,e){
        e = $(e);
        if (!e.hasClass('tooltip-info')) {
            e.addClass('tooltip-info');
        }
    });
    $('[data-rel=tooltip]').tooltip();
    $(".chosen-select").chosen();
    $('#modal-form').on('shown.bs.modal', function () {
        $(this).find('.chosen-container').each(function(){
            $(this).find('a:first-child').css('width' , '210px');
            $(this).find('.chosen-drop').css('width' , '210px');
            $(this).find('.chosen-search input').css('width' , '200px');
        });
    });
    var o = $("input[data-rel='date-range']");
    if (o.length > 0) {
        o.daterangepicker({
            format: 'YYYY/MM/DD',
            showDropdowns:true
        });
    }
    render_fctrl();
}
var HDR_OPS="__ops__";
function goto_page(url, page, pageSize) {
    url = url.replace(/&page=\w+/i, '');
    url = url.replace(/&pgsize=\w+/i, '');
    url = url.replace(/&page=/i, '');
    url = url.replace(/&pgsize=/i, '');
    url += "&page=" + page + "&pgsize=" + pageSize;
    location.assign(url);
}
function clean_sort_param(url) {
    var newUrl = url.replace(/&sortf=[\w-]+/ig, "");
    newUrl = newUrl.replace(/&sort=[\w-]+/ig, "");
    newUrl = newUrl.replace(/&sort=[\w-]+/ig, "");
    return newUrl.replace(/&sort=[\w-]+/ig, "");
}
function create_pager(pager,item_count)
{
    pager.fn = pager.fn || "goto_page";
    var pgsize=pager.page_size,cur_page=pager.page,url=pager.url;
    var total_page = Math.ceil(item_count / pgsize);
    var item_count_txt = _L("Pages: {0}. Total: {1}").format(total_page, item_count);
    var h = "",show_cnt = 2,width= 0,bw=32;
    var firstPage=_L('Go first page'),lastPage=_L('Go last page'),prePage=_L('Go previous page'),goPage=_L('Go page {0}'),nextPage=_L('Go next page'),refreshPage=_L('Refresh page');
    if (item_count > 0) {
        var pre_page = cur_page - 1,next_page = cur_page + 1;
        if (cur_page > 1) {
            h += html_li(html_a(html_i('',{'class':'icon-double-angle-left'}), {
                'data-rel':'tooltip','data-original-title':firstPage,'data-placement':'bottom',
                'onclick': pager.fn+"('" + url + "',1," + pgsize + ")",
                href: '#'
            }));
            h += html_li(html_a(html_i("",{'class':'icon-angle-left'}), {
                'data-rel':'tooltip','data-original-title':prePage,'data-placement':'bottom',
                'onclick': pager.fn+"('" + url + "'," + pre_page + "," + pgsize + ")",
                href: '#'
            }));
            width += bw*2;
        }
        var i = cur_page - show_cnt > 0 ? cur_page - show_cnt : 1;
        for (i; i < cur_page; ++i) {
            h += html_li(html_a(i, {
                'data-rel':'tooltip','data-original-title':goPage.format(i),'data-placement':'bottom',
                'onclick': pager.fn+"('" + url + "'," + i + "," + pgsize + ")",
                href: '#'
            }));
            width += bw;
        }
        h += html_li(html_a(i, {
            'data-rel':'tooltip','data-original-title':_L('Current page'),'data-placement':'bottom',
            href: '#'
        }),{'class': 'active'});
        width += bw;
        var ni = cur_page + show_cnt > total_page ? total_page : cur_page + show_cnt;
        var ni_num =parseInt(Math.log(ni)/Math.log(10));
        width += 36*ni_num;
        for (i++; i <= ni; ++i) {
            h += html_li(html_a(i, {
                'data-rel':'tooltip','data-original-title':goPage.format(i),'data-placement':'bottom',
                'onclick': pager.fn+"('" + url + "'," + i + "," + pgsize + ")",
                href: '#'
            }));
            width += bw;
        }
        if (cur_page < total_page) {
            h += html_li(html_a(html_i("",{'class':'icon-angle-right'}), {
                'data-rel':'tooltip','data-original-title':nextPage,'data-placement':'bottom',
                onclick: pager.fn+"('" + url + "'," + next_page + "," + pgsize + ")",
                href: '#'
            }));
            h += html_li(html_a(html_i('',{'class':'icon-double-angle-right'}), {
                'data-rel':'tooltip','data-original-title':lastPage,'data-placement':'bottom',
                'onclick': pager.fn+"('" + url + "'," + total_page + "," + pgsize + ")",
                href: '#'
            }));
            width += bw*2;
        }
    } else {
        i = 1;
        h += html_li(html_a(i, {
            'data-rel':'tooltip','data-original-title':_L('Current page'),'data-placement':'bottom',
            'class': 'active',
            href: '#'
        }));
        width += bw;
    }
    width += 6;
    h = html_div(html_ul(h,{'class':'pagination'}),{'class':'dataTables_paginate paging_bootstrap'});
    if(!pager.show_type){
        $(pager.selector).html(html_table(html_tr(html_td(item_count_txt+'&nbsp;'+html_a(html_i('',{'class':'icon-refresh bigger-110 icon-only'}),
            {'onclick':pager.fn+"('" + url + "'," + cur_page + "," + pgsize + ")",'href':'#',
                'data-rel':'tooltip','data-original-title':refreshPage,'data-placement':'bottom'}),
            {style:"vertical-align: middle;",align:'right'})+html_td(h,{'width':width+'px'})),{width:"100%",'class':'no-padding'}));
    }else{
        $(pager.selector).html(h);
    }
    render_page();
}
function create_ajax_sort_header(dataModel,pager,fn){
    var direction = pager.sort;
    if (isNull(pager.sort)) {direction='desc'}
    for (var i = 0, cnt = dataModel.length; i < cnt; ++i) {
        var curHeader = dataModel[i];
        var p = $('#' + curHeader),title='';
        p.find("div").remove();
        p.unbind('click');
        if(pager.sortf == curHeader){
            p.append(html_div('',{'class':"pull-right sort_" + direction,"data-rel":"tooltip","data-original-title":_L("sort_" + direction + "_note")}));
        }else{
            p.append(html_div('',{'class':"pull-right sort_both","data-rel":"tooltip","data-original-title":_L("Sortable")}));
        }
        p.click(function() {
            var sortf = $(this).attr('id');
            var sort = direction == "asc" ? "desc" : "asc"
            return fn(sortf,sort);
        });
        p.css("cursor", "pointer");
    }
}
function create_sort_header(dataModel, curSortHeader, direction, url)
{
    if (isNull(direction)) {direction='desc'}
    var newUrl = clean_sort_param(url);
    for (var i = 0, cnt = dataModel.length; i < cnt; ++i) {
        if (dataModel[i].length == 1 || !dataModel[i][3])
        {
            continue;
        }
        var curHeader = "th_" + dataModel[i][0];
        var p = $('#' + curHeader),title='';
        if (curSortHeader == curHeader) {
            var sort_direction = direction == "asc" ? "desc" : "asc";
            p.append(html_div('',{'class':"pull-right sort_" + direction,"data-rel":"tooltip","data-original-title":_L("sort_" + sort_direction + "_note")}));
            p.click(function() {
                var newSort = "&sort=" + (direction == "asc" ? "desc" : "asc");
                toUrl(newUrl + "&sortf=" + $(this).attr("id") + newSort);
            });
        } else {
            p.append(html_div('',{'class':"pull-right sort_both","data-rel":"tooltip","data-original-title":_L("Sortable")}));
            p.click(function() {
                toUrl(newUrl += "&sortf=" + $(this).attr("id"));
            });
        }
        p.css("cursor", "pointer");
    }
}
function create_data_table(dataModel,tableContainer,tableId,url,attr,noRecordTxt,showCheckbox,useDetailRow)
{
    if (!attr) {
        attr = {};
    }
    attr.style = "margin-bottom:0";
    var html=html_table_start(attr),head_row = "",cols= 0;
    if (showCheckbox || useDetailRow){
        ++cols;
        var sh = "";
        if (showCheckbox)
        {
            sh += html_input({"name":"checkall","value":"on","type":'checkbox','class':'ace'})+html_span('',{'class':"lbl"});
        }
        var tdc={"width":"3%",'style':'text-align:center'};
        if (showCheckbox && useDetailRow){
            sh = html_img({width:'18px','src':'img/space.gif'}) + sh;
            tdc.width='60px';
        } else if (sh == ""){
            sh = "&nbsp;"
        }
        head_row += html_th(sh,tdc);
    }
    for(var i= 0,cnt=dataModel.length;i<cnt;++i)
    {
        var item = dataModel[i];
        if (item.length == 1){
            continue;
        }
        ++cols;
        var th_attr={};
        if (item[0] != HDR_OPS && item[3])
        {
            th_attr["id"] = "th_"+item[0];
        }
        if (item[2])
        {
            th_attr["width"]=item[2];
        }
        head_row += html_th(item[1], th_attr);
    }
    html += html_thead(html_tr(head_row));
    html += html_table_end();
    $(tableContainer).html(html_div(html,{'class':"table-responsive"}));
    create_sort_header(dataModel, dataModel.pager.sortf, dataModel.pager.sort, url);

    var html=html_table_start(attr),head_row = "",cols= 0;
    html += html_tr(html_td(html_img({'border':'0','src':'img/loading_small.gif'})+'&nbsp;'+noRecordTxt, {'colspan':cols}));
    html += html_table_end();
    $(tableContainer).append(html_div(html,{'class':"table-responsive",'id':tableId,'style':'float:left;position:relative'}));
    render_page();
}
function toggle_dtl(rid)
{
    var o = $("#dtl_"+rid),a=$('#dtla_'+rid);
    if (o.hasClass('hide')){
        a.removeClass('icon-plus');
        a.addClass('icon-minus');
    } else {
        a.removeClass('icon-minus');
        a.addClass('icon-plus');
    }
    o.toggleClass();
}
function format_table_data_row(dataModel, r, fnConverter, showCheckbox, fnGetDetail) {
    var useDetailRow = $.isFunction(fnGetDetail)
    var h = '';
    if (fnConverter){
        fnConverter(r);
    }
    var td='';
    for(var j= 0,jCnt=dataModel.length;j<jCnt;++j)
    {
        if (dataModel[j].length == 1){
            continue;
        }
        if (j==0 && (useDetailRow || showCheckbox)){
            var subTd='';
            if (useDetailRow){
                subTd += html_a(html_i('',{'class':'icon-plus','id':'dtla_'+ r.id}),{'class':'btn btn-minier btn-info','role':'button','onclick':"toggle_dtl('"+ r.id+"')"});
            }
            if (showCheckbox){
                subTd += html_input({"value":r.id,"rid":r.id,"type":"checkbox",'class':'ace'})+"<span class=\"lbl\"></span>";
            }
            td+=html_td(subTd,{'style':'text-align:center','class':'tdhdr','width':'3%'});
        }
        td+=html_td(r[dataModel[j][0]],{mtag:dataModel[j][0], width:dataModel[j][2]});
    }
    h+=html_tr(td,{'rid': r.id});
    if (useDetailRow){
        h += html_tr(html_td(fnGetDetail(r),{'colspan':dataModel.length}),{'id':'dtl_'+ r.id,'class':'hide'});
    }
    return h;
}
function prepend_table_data(selector, dataModel, r, fnConverter, showCheckbox, fnGetDetail) {
    $(selector+" tbody").prepend(format_table_data_row(dataModel, r, fnConverter, showCheckbox, fnGetDetail));
}
function hide_table_data(selector, id) {
    $(selector+" tbody tr[rid='"+id+"']").hide();
}
function hide_table_no_records(selector) {
    $(selector+" tbody tr[rid='none']").hide();
}
function show_table_no_records(selector) {
    $(selector+" tbody tr[rid='none']").show();
}
function fill_table_data(selector,dataModel,records,noRecordText,pager,fnConverter,showCheckbox,fnGetDetail,no_pager)
{
    selector += " ";
    $(selector+" tbody tr").remove();
    var tcols=$(selector+"th").length;
    if (records.total == 0 || records.data.length == 0)
    {
        $(selector+" tbody").append("<tr rid='none'><td colspan='"+tcols+"'>"+noRecordText+"</td></tr>");
    }
    else
    {
        var html='';
        var data = records.data;
        for(var i=0,cnt=data.length;i<cnt;++i)
        {
            html += format_table_data_row(dataModel, data[i], fnConverter, showCheckbox, fnGetDetail);
        }
        $(selector+" tbody").append(html);
    }
    if (no_pager !== true) create_pager(pager, records.total);
    render_page();
}
function icon_btn(icon, tooltip, opt) {
    var b = {'class':'blue','data-rel':'tooltip','data-original-title':tooltip,'style':'cursor:pointer'};
    b = $.extend(b, opt);
    return html_a(html_i('',{'class':icon+' bigger-130'}), b);
}
function edit_icon(rid,objectName,dialogId,txtEdit) {
    return html_a(html_i('',{'class':'icon-edit-sign bigger-130'}),{'mtag':'edit','style':'cursor:pointer','class':'green', 'onclick':"click_modal_edit('"+dialogId+"','"+objectName+"','"+rid+"')", 'data-rel':'tooltip','data-original-title':txtEdit});
}
function del_icon(rid,objectName,txtDel) {
    return html_a(html_i('',{'class':'icon-trash bigger-130'}),{'mtag':'del','style':'cursor:pointer','class':'red','onclick':"do_del_"+objectName+"('"+rid+"')",'data-rel':'tooltip','data-original-title':txtDel});
}
function table_ops(rid,objectName,dialogId,txtEdit,txtDel,otherHtml)
{
    var h = '';
    if (txtEdit) h += edit_icon(rid,objectName,dialogId,txtEdit);
    if (txtDel) h += del_icon(rid,objectName,txtDel);
    if (otherHtml) h += otherHtml;
    return html_div(h,{'class':"visible-md visible-lg hidden-sm hidden-xs action-buttons"});
}
function link_checkbox(p)
{
    var o=p+" input[type='checkbox'][rid]";
    $(p+" input[name='checkall']").change(function()
    {
        var ck = this.checked;
        $(o).each(function(i,c){
            c.checked = ck;
        });
    });
}
function get_checked_ids(p)
{
    var sel = $(p+" input[type='checkbox'][rid]:checked");
    var ret = [];
    for(var i=0; i<sel.length;i++)
    {
        ret[i] = sel[i].value;
    }
    return ret;
}
function convert_data(d, converter)
{
    if (!converter)
    {
        return;
    }
    if ($.isFunction(converter))
    {
        converter(d);
    }
    else
    {
        field_converter(d,converter);
    }
}
function fill_data_form(f,s,ui,converter)
{
    convert_data(s, converter);
    var fn=noop;
    if (ui){
        for(var n in ui)
        {
            if (typeof(ui[n]) == "string")
            {
                ui[n] = [ui[n]];
            }
        }
        fn = function(f,n){
            if (!ui[n]) {
                return;
            }
            for(var i= 0,cnt=ui[n].length;i<cnt;++i)
            {
                var s = ui[n][i];
                if (s == "readonly")
                {
                    f.attr('readonly',true);
                }
                else if (s == 'hide')
                {
                    f.addClass('hide');
                }
            }
        }
    }
    for(var n in s)
    {
        var fields = $(f+" input[name='f["+n+"]']");
        if (fields.length > 0)
        {
            fn(fields, n);
            fields.val(s[n]);
            continue;
        }
        fields = $(f+" select[name='f["+n+"]']");
        if (fields.length > 0)
        {
            fn(fields, n);
            fn(fields);
            fields.val(s[n]);
        }
    }
}
function fill_search_form(f,s,converter)
{
    convert_data(f, converter);
    for(var n in s)
    {
        var fields = $(f+" input[name='s["+n+"]']");
        if (fields.length > 0)
        {
            fields.val(s[n]);
            continue;
        }
        fields = $(f+" select[name='s["+n+"]']");
        if (fields.length > 0)
        {
            fields.val(s[n]);
        }
    }
    var o = $("input[data-rel='date-range']");
    o.each(function(idx, d){
        var v = this.value;
        if (v.length > 0) {
            v = v.split('-');
            v[0] = v[0].trim();
            v[1] = v[1].trim();
            d = $(d);
            d.data('daterangepicker').setStartDate(v[0]);
            d.data('daterangepicker').setEndDate(v[1]);
        }
    });
}
function check_selected_id(tableSelector,noteNoSelection,allowMulti,noteMultiSelection)
{
    var id = get_checked_ids(tableSelector);
    if (id.length > 1 && !allowMulti){
        gritter_notice(noteMultiSelection,{
            timeout:4,
            type:'error'
        });
        return false;
    } else if (id.length == 0) {
        gritter_notice(noteNoSelection,{
            timeout:4,
            type:'error'
        });
        return false;
    }
    return id.join(',');
}
function render_fctrl(clsWidth) {
    clsWidth = clsWidth || 'width-60';
    $('input[type=file]').each(function(i, o) {
        o = $(o);
        if (o.parent().hasClass('ace-file-input')) return;
        o.ace_file_input().closest('.ace-file-input').addClass(clsWidth + ' inline').wrap('<div class="file-input-container"></div>');
    });
}
$.fn.sortElements = (function(){
    var sort = [].sort;
    return function(comparator, getSortable) {
        getSortable = getSortable || function(){return this;};
        var placements = this.map(function(){
            var sortElement = getSortable.call(this),
                parentNode = sortElement.parentNode,
                nextSibling = parentNode.insertBefore(
                    document.createTextNode(''),
                    sortElement.nextSibling
                );
            return function() {
                if (parentNode === this) {
                    throw new Error(
                        "You can't sort elements if any one is a descendant of another."
                    );
                }
                parentNode.insertBefore(this, nextSibling);
                parentNode.removeChild(nextSibling);
            };
        });
        return sort.call(this, comparator).each(function(i){
            placements[i].call(getSortable.call(this));
        });
    };
})();
function playSound(soundPath)
{
    if(((navigator.userAgent.match(/MSIE/i) ? true : false)) || ((!!navigator.userAgent.match(/Trident\/7.0/)) && (!!navigator.userAgent.match(/.NET4.0E/))))
    {
        if (!document.all._p_sound) {
            $("body").append('<bgsound id="_p_sound" />');
        }
        document.all._p_sound.src = soundPath;
    }
    else
    {
        var snd = new Audio(soundPath);
        snd.play();
    }
}
function insertText(s, v) {
    var o = $(s);
    o.focus();
    var e = o[0];
    if (document.all) {
        var r = document.selection.createRange();
        document.selection.empty();
        r.text = v;
        r.collapse();
        r.select();
    } else {
        var ns = e.selectionStart + v.length;
        var ov = o.val();
        o.val(ov.substr(0, e.selectionStart) + v + ov.substring(e.selectionEnd));
        e.selectionStart = ns;
        e.selectionEnd = ns;
    }
}
function adjustBodyHeight(s, delta) {
    var h = $(window).height() - delta;
    $(s).slimscroll({height: h + 'px'});
}
function bodySimScroll(s, delta){
    delta = delta || 0;
    adjustBodyHeight(s, delta);
    $(window).resize(function() {
        adjustBodyHeight(s, delta);
    });
}

function formatDate(date) {
    var myyear = date.getFullYear();
    var mymonth = date.getMonth()+1;
    var myweekday = date.getDate();

    if(mymonth < 10){
        mymonth = "0" + mymonth;
    }
    if(myweekday < 10){
        myweekday = "0" + myweekday;
    }
    return (myyear+"-"+mymonth + "-" + myweekday);
}
function get_week_range(d)
{
    var now = new Date();
    if(d){
        var now = new Date(d);
    }
    var nowDayOfWeek = now.getDay();
    var nowDayOfLast = 6-nowDayOfWeek;
    var nowDay = now.getDate();
    var nowMonth = now.getMonth();
    var nowYear = now.getYear(); //当前年
    nowYear += (nowYear < 2000) ? 1900 : 0;
    var weekStartDate = new Date(nowYear, nowMonth, nowDay - nowDayOfWeek);
    var weekEndDate = new Date(nowYear, nowMonth, nowDay + nowDayOfLast);
    var start_date = formatDate(weekStartDate);
    var end_date = formatDate(weekEndDate);
    return {'start_date':start_date,'end_date':end_date};
}