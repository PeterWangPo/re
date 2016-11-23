/**
 * Created by wang on 2015/9/4.
 */
var page = require('webpage').create();
page.open('https://www.baidu.com',function(status){
    console.log(status);
    if(status === 'success'){
        page.render('ex.jpg');
    }
    phantom.exit();
});