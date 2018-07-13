"use strict";

/*
 * Purpose: Running node.js and socket.io
 * Author : Sorav Garg (soravgarg123@gmail.com)
 */
const app = require('express')(),
    express = require('express'),
    server = require('http').Server(app),
    io = require('socket.io')(server, {
        pingInterval: 10000, // In MS (1S = 1000 MS)
        pingTimeout: 10000
    }),
    redis = require('socket.io-redis');

/* To set port */
app.set('port', 7575);

/* To Listen Port */
server.listen(app.get('port'), function() {
    console.log(`Express server listening on port ${app.get('port')}`);
});

/* Manage Root Request */
app.get('/', function(req, res) {
    var html = "<center><h1>Welcome !!</h1><br/><a href='http://localhost:7575/socket'>Click Here</a> To Access Socket Chat</center>";
    res.send(html);
})

/* For socket communicatrion */
app.get('/socket', function(req, res) {
    res.sendFile(__dirname + '/socket.html');
});

/* Manage Socket Redis to handle large no of socket connections & 6379 is default port of redis server
   Note: - Redis server should be installed on own server, for example if we are using 
   		   Linux (Ubuntu) OS, then you can install via this command.
   		   sudo apt-get install redis-server
*/
io.adapter(redis({
    host: 'localhost',
    port: 6379
}));

/* Manage Socket Connection Start */
io.on('connection', function(socket) {
    console.log('----------- Socket Connection Event --------------');

    /* To Join Room */
    socket.join('my-room');

    var handshakeQuery = socket.handshake.query;

    /* Purpose:- To manage custom params with socket object */
    var socketCustomId = (!handshakeQuery.uid) ? '' : handshakeQuery.uid;
    var userLocale = (!handshakeQuery.locale) ? 'tr' : handshakeQuery.locale;
    console.log('socketCustomId', socketCustomId);

    /* To detect disconnected users (Pre-defined event, called automatically) */
    socket.on('disconnect', function() {
        console.log('----------Socket Disconnect Event -----------');

        socket.leave('my-room');

        /* Get socket id */
        let socketId = socket.id;

        /* Manage user in room */
        if (socketCustomId) {
            console.log('disconnectUserID', socketCustomId);
            let disconnectedUserId = parseInt(socketCustomId);
        }
    });

    /* Auto Trigger on socket error */
    socket.on('error', function(e) {
        console.log('----------Socket Error Event -----------');
        if (e.error() != "websocket: close sent") {
            console.log('An socket unexpected error occured: ', e.error());
        }
    });

    /**
     * To send message (Custom Socket Event)
     * @param {string}  message
     * Socket Emit Cheat Sheet URL - https://socket.io/docs/emit-cheatsheet
     */
    socket.on('brodcast-user-msg', function(userData, callBack) {
        console.log('----------- Broadcast User Message Event --------------');
        console.log('userData', userData);

        /* 
        	1) Broadcast message to particular client - socket.to(<socketid>).emit(<event name>, <data>);
        	2) Broadcast message to all clients except sender    - socket.broadcast.emit(<event name>, <data>);
        	3) Broadcast message to all clients including sender - io.emit(<event name>, <data>);
        	Note:- Difference between Point 2 & 3 Is broadcast will not send message on newly create connection & io.emit will also send to newly created connections.
        */
        socket.broadcast.emit('brodcast-user-msg', userData);

        /* Return Callback */
        return callBack({
            status: 'success'
        });
    });

    /**
     * To Get User Socket ID
     * @param {integer} userID
     */
    var getUserSocketID = function(userID) {
        var clients = io.sockets.clients();
        let clientSocketObj = clients.connected;
        let socketIds = Object.keys(clientSocketObj);
        if (parseInt(socketIds.length) > 0) {
            let index = 0;
            for (var key in clientSocketObj) {
                let clientObjHandshakeData = clientSocketObj[key];
                if (clientObjHandshakeData != undefined && clientObjHandshakeData != "" && clientObjHandshakeData != null) {
                    let clientObjHandshakeDataQuery = clientObjHandshakeData.handshake;
                    if (clientObjHandshakeDataQuery != undefined && clientObjHandshakeDataQuery != "" && clientObjHandshakeDataQuery != null) {
                        let queryObj = clientObjHandshakeDataQuery.query;
                        if (queryObj != undefined && queryObj.uid != undefined && queryObj.uid == userID) {
                            return key;
                        }
                    }
                }
                index = index + 1;
                if (parseInt(index) === parseInt(socketIds.length)) {
                    return '';
                }
            }
        } else {
            return '';
        }
    }

    /**
     * To check if user socket is connected or not (Online/Offline)
     * @param {integer}  userID
     */
    var isUserSocketConnected = function(userID) {
        var clients = io.sockets.clients();
        let clientSocketObj = clients.connected;
        let socketIds = Object.keys(clientSocketObj);
        if (parseInt(socketIds.length) > 0) {
            let index = 0;
            for (var key in clientSocketObj) {
                let clientObjHandshakeData = clientSocketObj[key];
                if (clientObjHandshakeData != undefined && clientObjHandshakeData != "" && clientObjHandshakeData != null) {
                    let clientObjHandshakeDataQuery = clientObjHandshakeData.handshake;
                    if (clientObjHandshakeDataQuery != undefined && clientObjHandshakeDataQuery != "" && clientObjHandshakeDataQuery != null) {
                        let queryObj = clientObjHandshakeDataQuery.query;
                        if (queryObj != undefined && queryObj.uid != undefined && queryObj.uid == userID) {
                            return true;
                        }
                    }
                }
                index = index + 1;
                if (parseInt(index) === parseInt(socketIds.length)) {
                    return false;
                }
            }
        } else {
            return false;
        }
    }

    /**
     * To Get Online (Active) Users Count
     */
    var getOnlineUsersCount = function() {
        io.of('/').adapter.clients(['my-room'], (err, clients) => {
            if (!err) {
                return parseInt(clients.length);
            } else {
                return 0;
            }
        });
    }
});
/* Manage Socket Connection End */

module.exports = {
    app
};

/* End of file socket.js */
/* Location: ./socket.js */