function html_attr(attrs)
{
    var at = "";
    if (attrs)
    {
        for(var key in attrs)
        {
            if (typeof(attrs[key]) == "object")
            {
                var subattrs = attrs[key];
                for(var k in subattrs)
                {
                    at += isNull(subattrs[k]) ? " "+k : " "+k+"=\""+subattrs[k]+"\"";
                }
            }
            else
            {
                at += isNull(attrs[key]) ? " "+key : " "+key+"=\""+attrs[key]+"\"";
            }
        }
    }
    return at;
}
function html_ele(tag, txt, attrs)
{
    return isNull(txt) ? "<"+tag+html_attr(attrs)+" />" : "<"+tag+html_attr(attrs)+">"+txt+"</"+tag+">";
}
function html_span(txt, attrs)
{
    return html_ele("span", txt, attrs);
}
function html_p(txt, attrs)
{
    return html_ele("p", txt, attrs);
}
function html_button(txt, attrs)
{
    return html_ele("button", txt, attrs);
}
function html_ul(txt, attrs)
{
    return html_ele("ul", txt, attrs);
}
function html_li(txt, attrs)
{
    return html_ele("li", txt, attrs);
}
function html_i(txt, attrs)
{
    return html_ele("i", txt, attrs);
}
function html_b(txt, attrs)
{
    return html_ele("b", txt, attrs);
}
function html_img(attrs)
{
    return "<img"+html_attr(attrs)+" />";
}
function html_a(txt, attrs)
{
    return html_ele("a", txt, attrs);
}
function html_em(attrs)
{
    return "<em"+html_attr(attrs)+" />";
}
function html_tr(txt, attr)
{
    return html_ele("tr", txt, attr);
}
function html_th(txt, attr)
{
    return html_ele("th", txt, attr);
}
function html_td(txt, attr)
{
    return html_ele("td", txt, attr);
}
function html_thead(txt)
{
    return html_ele("thead", txt);
}
function html_table(rows, attrs)
{
    return html_ele("table", rows, attrs);
}
function html_table_start(attrs)
{
    return "<table"+html_attr(attrs)+">";
}
function html_table_end()
{
    return "</table>";
}
function html_div(txt,attrs)
{
    return html_ele("div", txt, attrs);
}
function html_option(txt,attrs)
{
    return html_ele("option",txt,attrs);
}
function html_select(options,attrs)
{
    return html_ele("select",options,attrs);
}
function html_input(attrs)
{
    return html_ele("input",null,attrs);
}
function html_radio(attrs)
{
    attrs["type"] = "radio";
    return html_input(attrs);
}
function html_label(txt, attrs)
{
    return html_ele("label",txt, attrs);
}
function html_form(txt, attrs)
{
    return html_ele("form", txt, attrs);
}
function fetch_option(option,item)
{
    if (option.length>=1)
    {
        var v,t;
        t = item[option[0]];
        if (option.length == 2)
        {
            v = item[option[1]];
        }
        else
        {
            v = t;
        }
        return {t:t,v:v};
    }
    return {t:item,v:item};
}
function html_select_from_array(arr,option,attrs)
{
    var html = "";
    for(var j=0,cnt=arr.length;j<cnt;++j)
    {
        var opt = fetch_option(option,arr[j]);
        var subattr = {value:opt.v};
        if (attrs["selected"] == opt.v)
        {
            subattr["selected"]='';
        }
        html += html_option(opt.t,subattr);
    }
    return html_select(html,attrs);
}
function select_add_option(o,n,v)
{
    o.append(html_option(n,{value:v}));
    /*o.options[o.options.length] = new Option(v,n);
     ++o.options.length;*/
}
function select_option(o,v)
{
    for(var i=0,cnt=o.options.length;i<cnt;++i)
    {
        if (o.options[i].text == v)
        {
            o.options[i].selected = true;
            o.selectedIndex = i;
        }
    }
}
function generateNumberOptions(range, step) {
    step = step || 1;
    var h = '';
    for (var i = range[0]; i <= range[1]; i += step) {
        var v = i.toString();
        h += html_option(v, {value:v});
    }
    return h;
}