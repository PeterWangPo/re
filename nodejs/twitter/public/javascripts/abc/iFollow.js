var S_ifollow = S_ifollow||{};

(function(j, $) {

	var hasPinpai = false;

	//植入关注品牌功能，只适用于店铺
	function followPinpai(shopId){

		$.ajax({
			url : "http://follow.soa.jd.com/brand/batchfollow?brandId=" + JSON.stringify([{shopId: shopId}]),
			//url : INTERFACE.batchfollow + JSON.stringify([{shopId: 43858}]),
			dataType : 'jsonp',
			success : function(data){
				if(data.code == 'F10000'){
					//console.log("关注品牌成功");
					//if(data.data){
					//	state = 1;
					//	domOperate();
					//}
				}else if(data.code == 'F0402'){
					//if(!data.data){
					//	state = 2;
					//	domOperate();
					//}
					//console.log("该品牌已关注");
				}else{
					//state = 3;
					//domOperate();
					//console.log("关注成功失败");
				}
			}
		});

	}

	//不是10000，都是关注失败  by李志博
	//临时状态state ：0未关注；1关注成功；2已经关注；3关注失败
	function domOperate(){

		var attentInfo = {
				mall : {
					msgOk : '关注成功',
					msgRepeat : '您已经关注过了',
					msgError : '关注失败',
					msgOverMax : '已达到关注店铺数量上限',
					msgOther : '查看我关注的<a href="http://t.jd.com/vender/followVenderList.action" target="_blank">店铺</a>和<a href="http://t.jd.com/follow/brand/list.action" target="_blank">品牌</a>'
				}
			},
			state = j.state;

		//取消关注
		if(state == 0){
			node.html('\u5173\u6ce8\u54c1\u724c');
			eventTag = true;
			return;
		}

		var jAttWrap = $(".j-attent-dialog-wrap"),
			mask = jAttWrap.find('.attent-dialog-mask'),
			con = jAttWrap.find('.attent-con'),
			msg = jAttWrap.find('.attent-msg'),
			other = jAttWrap.find('.attent-other'),
			close = jAttWrap.find('.attent-close');

		//关注成功
		if(state == 1){
			msg.html(attentInfo.mall.msgOk);
			other.html(attentInfo.mall.msgOther);
			con.addClass('attent-ok');
		}
		//已经关注
		else if(state == 2){
			msg.html(attentInfo.mall.msgRepeat);
			other.html(attentInfo.mall.msgOther);
			con.addClass('attent-repeat');
		}
		//关注失败
		else if(state == 3){
			msg.html(attentInfo.mall.msgError);
			other.html(attentInfo.mall.msgOther);
			con.addClass('attent-error');
		}
		//达到关注数量上限
		else if(state == 4){
			msg.html(attentInfo.mall.msgOverMax);
			other.html(attentInfo.mall.msgOther);
			con.addClass('attent-error');
		}
		jAttWrap.show();
		eventTag = true;
	}

	j.follow = function(param){

		param = jQuery.extend({
				node : '#shop-attention', //关注点击元素
				shopId: '#shop_id'
			}, param || {});

		var _this = this;

		this.jNode = $(param.node);
		this.followWhat = 1;//关注店铺

		j.state = 0; //0:unfollowed，1:followed
		j.id = $(param.shopId).val();

		setTimeout(function(){
			//全局事件初始化
			event(_this);
		}, 100);

		//绑定点击事件
		this.jNode.bind("click", function(){
			//$(param.pageIdValue).val()
			jdModelCallCenter.settings.fn = function() {
				j.addFollow();//登录后回调函数 。增加关注
			};
			$.login({
				modal: true,
				complete: function(result) {
					if (result != null && result.IsAuthenticated != null && result.IsAuthenticated) {
						jdModelCallCenter.settings.fn();//已经登陆后。增加关注
					}
				}
			});
		});

	};
	
	//发送关注请求
	j.addFollow = function(){

		var url = "http://follow.soa.jd.com/vender/follow";
		url+="?venderId=" + j.id;

		//这里调用关注接口
		 $.ajax({
			async: false,//同步调用
            url:url,
            dataType:"jsonp",
            success:function(data){
				j.requestSuccess(data);
            },
            error: function(reques,msg){
				//console.log("关注店铺，请求响应失败");
            	//j.followShopFail();
            }
		 });
		
	};

	//关注请求响应成功处理函数
	j.requestSuccess = function(data){
		if( data.code == 'F10000' ){//F10000 成功
			j.followSuccessCallBack();
			var pin = encodeURIComponent(getCookie("pin"));
			if(pin == null){
				return;
			}
			var jda = getCookie("__jda");
			if(jda == null){
				return;
			}
			var uuid = jda.split(".")[1];
			var img = new Image();
			var imgsrc = "http://mercury.jd.com/log.gif?t=shop.100001&v=src=shop$"+"shopid="+ j.id +"$action=0&pin=" +pin + "&uid="+ uuid + "&ver=1&m=UA-J2011-1&ref=" + encodeURIComponent(document.referrer) + "&rid=" + Math.random();
			img.setAttribute('src', imgsrc);
		}else if( data.code == 'F0402' ){//F0402 已关注过，不能加关注
			j.followed();
		}else if( data.code == 'F0410' ){//F0410关注达到最大数量，不能加关注
			j.followShopMax();
		}else{			//关注失败
			j.followErrorCallBack();
		}

		//如果此店铺有品牌，则同时关注品牌
		if(hasPinpai){
			followPinpai(j.id);
		}
	};

	//关注成功处理函数
	j.followSuccessCallBack = function(){
		j.state = 1;
		domOperate();
	};

	//关注失败处理函数
	j.followErrorCallBack = function(){
		j.state = 3;
		domOperate();
	}

	/**
	 * 获取关注数量
	 */
	j.getFollowNum = function(url,followNumSuccessCallBack){
		 $.ajax({
			 async: false,//同步调用
			 url:url,
             dataType:"jsonp",
             success:function(data){
			 	followNumSuccessCallBack(data);
             },
             error: function(reques,msg){
            	//弹出关注失败；
                //console.log("获取关注数量接口响应失败");
             }
		 });
	};
	

		/*$('#dialogA').jdThickBox({
			width: 300,
			height: 80,
			title: '提示', 
	        source: j.followVM.find('#followFailDiv').html()
		}); */
		

	//弹出关注达到最大限制；
	j.followShopMax = function(){
		j.state = 4;
		domOperate();
	};
	
	
	//弹出已关注
	j.followed = function(){
		j.state = 2;
		domOperate();
	};

	//初始化入口
	!function init(){
		cssInit();
	}();

	function cssInit(){
		var styleStr = "<style>"
			+".j-attent-dialog-wrap{display: none;}"
			+".attent-tip-wrap{display: none; z-index: 1001; position: absolute; top: 0; left: 0; width: 189px; height: 131px; background: url(http://img11.360buyimg.com/cms/jfs/t904/96/974597196/7702/c65fa11b/5562e781N10be5ec3.png) no-repeat;}"
			+".attent-tip-wrap i{position: absolute; right: 5px; top: 9px; width: 15px; height: 15px; background: url(http://img14.360buyimg.com/cms/jfs/t1087/118/953149406/1062/b1c27ba1/5562e785Ndd770a39.png) no-repeat; cursor: pointer;}"
			+".attent-dialog-mask{position: fixed; _positon: absolute; left:0; top:0; right:0; bottom:0; background:#000; opacity:0.3; z-index:100;}"
			+".attent-dialog{position: fixed; _positon: absolute; width:310px; height:185px; border:solid 5px rgba(8,1,3,0.3); background:#fff; left:50%; top:50%; margin:-92px 0 0 -155px; z-index:1001;}"
			+".attent-dialog.current{display:block;}"
			+".attent-dialog .attent-mt{height:32px; line-height:32px; background:#f5f5f5; font-size:16px; color:#222; text-indent:10px; overflow:hidden;}"
			+".attent-dialog .attent-close{float:right; width:32px; height:32px; text-indent:-9999px; background:url(http://img10.360buyimg.com/cms/jfs/t1420/84/156758085/1080/d48a39fe/555e9e79N85386290.png) center center no-repeat; cursor:pointer;}"
			+".attent-dialog .attent-ok, .attent-dialog .attent-repeat, .attent-dialog .attent-error{margin:48px 0 0 55px; height:40px; padding-left:48px;}"
			+".attent-dialog .attent-ok{background:url(http://img12.360buyimg.com/cms/jfs/t1435/352/153421548/1347/d377c92d/555e9e71Nb767e906.png) left center no-repeat;}"
			+".attent-dialog .attent-repeat, .attent-dialog .attent-error{background:url(http://img14.360buyimg.com/cms/jfs/t1516/358/164942511/1418/e0c25f0c/555e9e75Nfca9da16.png) left center no-repeat;}"
			+".attent-dialog .attent-ok .attent-msg{font-size:14px; color:#009900; font-weight:bold;}"
			+".attent-dialog .attent-repeat .attent-msg, .attent-dialog .attent-error .attent-msg{font-size:14px; color:#ff771e; font-weight:bold;}"
			+".attent-dialog .attent-other{color:#6f6363; display:block; margin-top:3px;}"
			+".attent-dialog .attent-other a{color:#004499; padding: 0 5px;}"
			+".attent-dialog.attent-mall .attent-other a{margin:0 5px;}"
			+"</style>";
		$("head").append(styleStr);
	}

	function event(that){

		var	attentHtml = '<div class="j-attent-dialog-wrap">'
							+'<div class="attent-dialog-mask"></div>'
							+'<div class="attent-dialog">'
							+	'<div class="attent-mt">'
							+		'<span class="attent-close"  title="关闭">关闭</span>'
							+		'<span class="attent-title">提示</span>'
							+	'</div>'
							+	'<div class="attent-mc">'
							+		'<div class="attent-con">'
							+			'<span class="attent-msg"></span>'
							+			'<span class="attent-other"></span>'
							+		'</div>'
							+	'</div>'
							+'</div>'
							+'</div><div class="j-attent-tip-wrap attent-tip-wrap"><i></i></div>';

		var jAttWrap = $(".j-attent-dialog-wrap");

		if(jAttWrap.length === 0){
			jAttWrap = $(attentHtml).appendTo("body");
		}

		jAttWrap.find('.attent-close').click(function(){
			jAttWrap.hide();
		});

		//有品牌的时候需要增加引导提示操作
		var hasPinpaiId = $("#pinpai_brandId").val();
		if(hasPinpaiId !== "0" && hasPinpaiId !== undefined){
		//if(true){

			hasPinpai = true;

			var offset = that.jNode.offset();

			//定位关注提示框的位置
			var jTip =  $(".j-attent-tip-wrap").css({"left": offset.left - 50, "top": offset.top + 28}).fadeIn();
			jTip.find("i").bind("click", function(){
				jTip.hide();
			});
			$("body").bind("click", function(e){
				var target = e.target || e.srcElement;
				if(target !== jTip[0]){
					jTip.hide();
				}
			});

			setTimeout(function(){
				jTip.fadeOut();
			}, 3000);

		}

	}

})(S_ifollow, jQuery);


