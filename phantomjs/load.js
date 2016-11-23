/**
 * Created by wang on 2015/9/4.
 */
var page = require('webpage').create(),
    system = require('system'),
    t,address;
if(system.args.length === 1){
    console.log('some url');
    phantom.exit();
}
t = Date.now();
address = system.args[1];
page.open(address, function(status){
    if(status !== 'success'){
        console.log('open url failed');
    }else{
        t = Date.now() - t;
        console.log('Loading ' + system.args[1]);
        console.log('Loading time ' + t + 'msec');
    }
    phantom.exit();
})