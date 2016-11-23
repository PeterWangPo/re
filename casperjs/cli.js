/**
 * Created by wang on 2015/12/12.
 */
var casper = require("casper").create();
require("utils").dump(casper.cli.args);
require("utils").dump(casper.cli.options);