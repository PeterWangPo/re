/* virtuals-tuan/home common.js Date:2015-05-05 10:44:49 */
seajs.use(["jdf/1.0.0/unit/shortcut/2.0.0/shortcut.js","jdf/1.0.0/ui/lazyload/1.0.0/lazyload","jdf/1.0.0/ui/countdown/1.0.0/countdown","jdf/1.0.0/unit/login/1.0.0/login.js","jdf/1.0.0/ui/ceilinglamp/1.0.0/ceilinglamp"],function(a,b,c,d){$("body").lazyload({delay:50,placeholderClass:"loading-style2"}),a(),$("#mytuan").delegate("a","click",function(){var a="http://tuan.jd.com",b=$(this).data("href");return d({modal:!0,complete:function(){window.location=a+b}}),!1}),$("#ceilinglamp").ceilinglamp({scrollDelay:0,threshold:0,arrive:$("#ceilinglampArrive")}),$("#ceilinglamp1").ceilinglamp({scrollDelay:0,threshold:0});var f=$(".time"),g=function(a){return 10>a?"0"+parseInt(a):String(a)},h=function(a,b){var c=new Date(1e3*parseInt(a)),d=c.getFullYear(),e=g(c.getMonth()+1),f=g(c.getDate()),h=g(c.getHours()),i=g(c.getMinutes()),j=g(c.getSeconds()),k="";switch(b){case"y/m/d":k=d+"/"+e+"/"+f;break;case"h:m":k=h+":"+i;break;default:k=d+"/"+e+"/"+f+" "+h+":"+i+":"+j}return k};if(f.length>0)for(var i=0;i<f.length;i++){var j=$(f[i]).data("end-time");$(f[i]).countdown({isTwoDigits:!0,endTime:h(j),currentTime:0,isTwoDigits:!1,onEnd:function(){this.el.html("\u7ed3\u675f\u4e86")},onChange:function(a){var b="00"==a.day?"":a.day+"\u5929";this.el.html("\u8ddd\u7ed3\u675f\u8fd8\u6709"+b+a.hour+"\u5c0f\u65f6"+a.minute+"\u5206"+a.second+"\u79d2")}})}}),function(){if(pageConfig.navId){var a=document.getElementById("nav-"+pageConfig.navId);a&&(a.className+=" curr")}}(),function(){$("#deal-subscribe-form").submit(function(){var a=$("#deal-subscribe-form-email").attr("value"),b=/^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/.test(a);return b?$(this).find(".dingyue-prompt").hide():$(this).find(".dingyue-prompt").show(),b}),$("#deal-subscribe-form-email").focus(function(){$(this).nextAll(".dingyue-prompt").hide()}),$('[data-widget="li|hover"]').delegate("li","mouseenter mouseleave",function(a){"mouseenter"==a.type?$(this).addClass("hover"):"mouseleave"==a.type&&$(this).removeClass("hover")})}(),function(){var a=$("#service:first");a&&a.length>0&&seajs.use(["jdf/1.0.0/ui/fixable/1.0.0/fixable","jdf/1.0.0/ui/gotop/1.0.0/gotop"],function(){$("body").append('<div id="go-top" class="go-top hide"><ul class="clearfix">                <li class="item j-go-top" clstag="h|keycount|2015|16a">                    <a href="javascript:;">                        <span class="icon-top" >\u25c7</span>                        <span class="text-top" >\u9876\u90e8</span>                    </a>                </li>                <li clstag="h|keycount|2015|16b">                <a href="http://surveys.jd.com/index.php?r=survey/index/sid/839166/lang/zh-Hans" class="link-survey" target="_blank"><span class="icon-survey"></span><span class="icon-survey-text">\u53cd\u9988</span></a></li>            </ul></div>');var b=$("#go-top"),c=0;c=-(b.width()+5),b.fixable({x:"right",y:"bottom",xValue:c,yValue:0,zIndex:10,context:a}),b.gotop({hasAnimate:!0,gotopClass:"j-go-top"})})}(),function(a){a.fn.placeholder=function(){return this.each(function(){var b=a(this),c=b.attr("xtip")||"\u8bf7\u8f93\u5165\u5730\u533a\u3001\u5546\u54c1\u540d\u79f0\u7b49";$form=b.closest(".s-result-form"),b.focus(function(){a(this).val()===c&&a(this).val("")}).keydown(function(){}).blur(function(){setTimeout(function(){""===b.val()&&b.val(c)},200)}),$form.submit(function(){var c=a.trim(b.val()),d=["script","alert","confirm","prompt","select","from","where","update","delete","insert","drop","alter"];if(c=c.toLowerCase(),""===c)return!1;for(var e=0;e<d.length;e++)if(-1!=c.indexOf(d[e]))return!1})})},a("inPut.text").placeholder()}(jQuery);
/* virtuals-tuan/home index.js Date:2015-03-31 13:23:02 */
seajs.use(["jdf/1.0.0/ui/switchable/1.0.0/switchable"],function(){$("#switchable").switchable({type:"focus",navItem:"ui-switchable-item",navSelectedClass:"ui-switchable-selected",contentClass:"ui-switchable-panel-main",mainClass:"ui-switchable-panel",stayTime:5e3,autoPlay:!0}),$("#seckillTab").switchable({navItem:"tab-item",navSelectedClass:"tab-current",contentClass:"tab-switchable",mainClass:"tab-switchable-item",event:"click"}),$("#slider1,#slider2,#slider3").switchable({type:"slider",mainClass:"slider-item",mainSelectedClass:"slider-item-slected",contentClass:"slider-item-pannel",prevClass:"slider-prev",nextClass:"slider-next",speed:600,step:4,hasPage:!0,seamlessLoop:!0})}),function(){var b,a=$("#accordion");a.delegate('[data-accordion="hover"]',"mouseenter",function(){clearTimeout(b);var a=$(this);b=setTimeout(function(){a.addClass("hover").siblings("li").removeClass("hover")},150)}),$("#seckillTab").delegate(".slider","mouseenter mouseleave",function(a){var b=$(this).find(".slider-prev"),c=$(this).find(".slider-next"),d=$(this).find("li").length;return 4>=d?!1:void("mouseenter"==a.type?(b.show(),c.show()):"mouseleave"==a.type&&(b.hide(),c.hide()))})}();