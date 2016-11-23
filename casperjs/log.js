/**
 * Created by wang on 2015/9/4.
 */
var casper = require('casper').create({
    verbose : true,
    logLevel : 'debug'
});
casper.log('debug','debug');
casper.log('error','error');
casper.log('info','info');
casper.log('warning','warinig');
casper.exit();