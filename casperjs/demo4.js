/**
 * Created by wang on 2015/8/30.
 */
var casper = require("casper").create();
casper.cli.drop("cli");
casper.cli.drop("casper-path");
if(casper.cli.args.length ===0 && Object.keys(casper.cli.options).length ===0 ){
    casper.echo("No args and options in the script");
}
casper.exit();