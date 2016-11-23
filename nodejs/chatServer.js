/**
 * Created by wang on 2015/9/9.
 */
var net = require("net");
var chatServer = net.createServer();
var clientList = [];
chatServer.on('connection', function(client){
    client.name = client.remoteAddress + ':' + client.remotePort;
    console.log(client.name + 'joined');
    client.write('hi' + client.name + '\n' );
    clientList.push(client);
    client.on('data',function(data){
        bordcast(data,client);
    });
    client.on('end',function(){
        console.log(client.name + 'quit');
        clientList.splice(clientList.indexOf(client),1);
    });
    client.on('error',function(e){
        console.log(e);
    });
    function bordcast(msg, client){
        var cleanup = [];
        for(var i = 0, len = clientList.length ; i < len ; i++){
            if(client != clientList[i]){
                if(clientList[i].writable){
                    clientList[i].write(client.name + ' say : ' +msg);
                }else{
                    cleanup.push(clientList[i]);
                    clientList[i].destroy();
                }
            }
        }
        for(var i = 0, len = cleanup.length; i < len; i++){
            clientList.splice(clientList.indexOf(cleanup[i]),1);
        }
    }
}).listen(9000);