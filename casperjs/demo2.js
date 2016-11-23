/**
 * Created by wang on 2015/8/30.
 */
var casper = require('casper').create();
casper.echo('args:');
var util = require("utils");
util.dump(casper.cli.args);
casper.echo("options:");
util.dump(casper.cli.options);
casper.exit();
