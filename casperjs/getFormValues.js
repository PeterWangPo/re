/**
 * Created by wang on 2015/9/4.
 */
var casper = require("casper").create();
//下面的脚本有问题。
casper.start("http://www.imooc.com/",function(){
    this.click("#js-signup-btn");
    if(this.exists("div#signup")){
        this.evaluate(function(email,pass,nick){
            document.querySelector("input[name='email']").value = email;
            document.querySelector("input[name='password']").value = pass;
            document.querySelector("input[name='cfmpwd']").value = pass;
            document.querySelector("input[name='nick']").value = nick;
        },'wangyisfs13@126.com','123413131qqwe','pickerser');
    }else{
        this.echo("click failed");
    }
    this.capture("c.jpg");
}).run();