/**
 * Created by Kevin on 6/12/2015.
 */

// Main object in global scope
var teamconsole = (function() {

    // Client handles connecting to websocket server and manipulating bookmark tree
    var socket, root, connStatus, pauseconnection;

    var settings = {
        server: 'teamconsole.yourdomain.com',
        port: 7329,
        title: 'TeamConsole',
        password: ''
    };

    var saveoptions = function (done) {
        chrome.storage.local.set({
            server: settings.server,
            port: settings.port,
            password: settings.password
        }, function () {
            done();
        });
    };

    var loadoptions = function (done) {
        chrome.storage.local.get(null, function (items) {
            settings.server = items.server || settings.server;
            settings.port = items.port || settings.port;
            settings.password = items.password || settings.password;
            done();
        });
    };

    var getStatus = function() {
        return connStatus;
    };

    var connect = function () {
        // Create a new WebSocket, close existing one if it exists already
        if(socket) {
            socket.close();
        }
        socket = new WebSocket('ws://' + settings.server + ':' + settings.port);

        // Set icon when socket established
        socket.onopen = function(event) {
            seticon();
            connStatus = 'connected';
            var msg = {
                type: "login",
                pw: settings.password
            };
            // Send the msg object as a JSON-formatted string.
            socket.send(JSON.stringify(msg));
        };

        // Handle messages sent by the server.
        socket.onmessage = function(event) {
            var msg = JSON.parse(event.data);

            switch(msg.type) {
                case "hash":
                    var hashes = msg.hashes;
                    console.log(hashes);
                    break;
                case "login":
                    if(msg.code === 200) {
                        console.log("Login successful.");
                    }
                    else {
                        console.log("Login failed:" + msg.code);
                        pauseconnection = true;
                        socket.close();
                    }
                    break;
                case "message":
                    text = "(" + timeStr + ") <b>" + msg.name + "</b>: " + msg.text + "<br>";
                    break;
                case "rejectusername":
                    text = "<b>Your username has been set to <em>" + msg.name + "</em> because the name you chose is in use.</b><br>"
                    break;
                case "userlist":
                    var ul = "";
                    for (i=0; i < msg.users.length; i++) {
                        ul += msg.users[i] + "<br>";
                    }
                    document.getElementById("userlistbox").innerHTML = ul;
                    break;
            }
        };

        // Handle any errors that occur.
        socket.onerror = function(error) {
            // console.log('WebSocket Error');
        };

        // Set icon when socket closes
        socket.onclose = function(event) {
            seticon();
            connStatus = 'disconnected';
            if(!pauseconnection) {
                setTimeout(function () {
                    console.log("retrying connection...");
                    connect();
                }, 5000);
            }
        };
    };

    // Change browseraction tooltip and color when websocket status changes
    var seticon = function () {
        if (socket.readyState === 1) {
            chrome.browserAction.setIcon({path: "icon-connected.png"});
            chrome.browserAction.setTitle({title: "TeamConsole connected"});
        } else {
            chrome.browserAction.setIcon({path: "icon-disconnected.png"});
            chrome.browserAction.setTitle({title: "TeamConsole disconnected"})
        }
    };

    var initFolders = function() {
        chrome.bookmarks.search({title: settings.title}, function (results) {
            if (results.length === 0) {
                chrome.bookmarks.create({
                        'parentId': '1', // 1 is main bookmarks bar
                        'title': settings.title
                    },
                    function (newFolder) {
                        root = newFolder.id;
                        alert("No TeamConsole bookmark folder found so created new folder: " + newFolder.title);
                    }
                );
            }
        });
    };

    chrome.bookmarks.onMoved.addListener(function(id, moveInfo) {
        console.log("Moved to parent: " + moveInfo.parentId);
    });

    return {
        settings: settings,
        getStatus: getStatus,
        saveoptions: saveoptions,
        loadoptions: loadoptions,
        connect: connect,
        initFolders: initFolders
    };

})();

// Main - we don't need to wait for DOM to begin
teamconsole.loadoptions(function() {
    teamconsole.initFolders();
    teamconsole.connect();
});

