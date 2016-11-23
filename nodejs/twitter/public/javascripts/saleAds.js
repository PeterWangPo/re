(function(w,undefined){
    function sideSlip(arg){
        var c = $(this),
            options = $.extend({
                position : 1,
                hValue : 0,
                vValue : 0
            },arg),
            originTop,show = !1,scrollH = 609,height,width;
        function init(){
            options.position = parseInt(options.position);
            width = options.width || c.width();
            height = options.height || c.height();
            if(1 == options.position){
                c.css({
                    left : options.hValue
                });
            }
            else if(2 == options.position){
                c.css({
                    right : options.hValue
                });
            }
            else{
                c.css({
                    margin : '0 auto',
                    left : '50%',
                    marginLeft : -width/2 + 'px'
                });
            }
            originTop = options.position < 3?options.vValue:(options.position == 4?2:$(window).height() - height - 2);
            c.css({
                position : 'fixed',
                zIndex : 7,
                top : originTop + 'px',
                overflow : 'hidden',
                height : height,
                width : width
            });

            if(4 == options.position){
                c.hide();
                if($(window).scrollTop() >= 175){
                    c.show();
                    show = !0;
                }

                $(window).scroll(function(){
                    if(!show && $(this).scrollTop() >= 176){
                        c.show();
                        show = !0;
                    }

                    if(show && $(this).scrollTop() < 176){
                        c.hide();
                        show = !1;
                    }
                });
            }
            else{
                show = !0;
            }

            if($.browser.msie&&$.browser.version.match(/6/)){
                c.css('position','absolute');
                ieFixHandle();
            }
            else{
                if(options.position != 3){
                    bottomScrollHandle();
                }
                else{
                    $(window).resize(function(){
                        originTop = options.position < 3?options.vValue:(options.position == 4?2:$(window).height() - height - 2);
                        c.css('top',originTop+ 'px');
                    });
                }
            }
        }

        function ieFixHandle(){
            if(show){
                c.css('top',originTop + $(this).scrollTop() + 'px');
            }

            $(window).resize(function(){
                originTop = options.position < 3?options.vValue:(options.position == 4?2:$(window).height() - height - 2);
                if(show){
                    c.css('top',originTop + $(this).scrollTop() + 'px');
                }
                return;
            });
        }

        function bottomScrollHandle(){
            var top = options.vValue;
                
            $(window).scroll(function(){
				var vertical = ($('#service-2013').length?$('#service-2013').offset().top:$('body').height()) - height - top;
                if($(this).scrollTop() >= vertical){
                    c.css({
                        top : vertical - $(this).scrollTop() + top + 'px'
                    });
                }
                else{
                    c.css({
                        top : top + 'px'
                    });
                }
            });
        }

        init();
    }


    $(function(){
        var appId = '';

        function getNewAdvertise(){
            $.ajax({
                url : 'http://mg.jd.com/json/gateway/at_tempAd.action?tempId=' + appId,
                dataType : 'jsonp',
                success : function(data){
                    try{
                        if(data.success){
                            if(typeof data.centreContent != 'undefined' && data.centreContent != ''){
                                var c = $('<div style="zoom:1;background-color:' + data.centreColor +';">' + data.centreContent + '</div>').prependTo('.layout-container');
                            }

                            if(typeof data.topContent != 'undefined' && data.topContent != ''){
                                var a = $('<div style="zoom:1;background-color:' + data.topColor + ';">' + data.topContent+'</div>').insertAfter('[id^="shortcut-2013"]');
                            }

                            if(typeof data.sideContent != 'undefined' && data.sideContent != ''){
                                var b = $('<div style="zoom:1;">' + data.sideContent + '</div>').appendTo('body');
                                sideSlip.call(b,{position:data.sideSite,width:data.sideWidth,height:data.sideHeight,hValue:data.sideSideSite,vValue:data.sideTopSite});
                            }

                            if(typeof data.icon != 'undefined' && data.icon != ''){
                                var e = $('<div style="zoom:1;"><img src="' + data.icon + '" /></div>').appendTo('body');
                                var iconCss = {
                                    position : 'absolute',
                                    top : data.iconTopSite,
                                    height : data.iconHeight,
                                    width : data.iconWidth
                                }
                                if(data.iconSite == 1){
                                    iconCss.left = data.iconSideSite;
                                }
                                else{
                                    iconCss.right = data.iconSideSite;
                                }
                                e.css(iconCss);
                            }

                            if(typeof data.leftContent != 'undefined' && data.leftContent != ''){
                                var g = $('<div style="zoom:1;">' + data.leftContent + '</div>').appendTo('body');
                                sideSlip.call(g,{position:1,width:data.leftSideWidth,height:data.leftSideHeight,hValue:data.leftSideSite,vValue:data.leftTopSite});

                            }
							/*
                            if(typeof data.rightContent != 'undefined' && data.rightContent != ''){
                                var m = $('<div style="zoom:1;">' + data.rightContent + '</div>').appendTo('body');
                                sideSlip.call(m,{position:2,width:data.rightSideWidth,height:data.rightSideHeight,hValue:data.rightSideSite,vValue:data.rightTopSite});

                            }
							*/
                            if(typeof data.bottomContent != 'undefined' && data.bottomContent != ''){
                                var h = $('<div style="zoom:1;background-color:' + data.bottomColor +';">' + data.bottomContent +'</div>').appendTo('.layout-container');
                            }
                        }
                    }
                    catch(e){}

                }
            });
        }

		jQuery.ajax({
			url : 'http://act.jshop.jd.com/adv.html',
			data : {
				appId :  $('#pageInstance_appId').val(),
				appType : 1
			},
			dataType : 'jsonp',
			success : function(data){
				if(data.result){
					var str = jQuery.trim(data.values);
					if(str == '') return;
					else{
						appId = data.values;
						getNewAdvertise();
					}
				}
			}
		});
    });
})(window);


