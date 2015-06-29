/**
 * Created by Kevin on 6/12/2015.
 */

// Main object in global scope
var teamconsole = (function() {

    var settings = {
        server: 'teamconsole.yourdomain.com',
        port: 8888,
        password: ''
    };

    // bookmarks list containing Bookmark objects
    var bookmarks = [];
    var _view = null;

    // Websocket connection properties
    var connection = {
        socket: null,
        status: "disconnected",
        paused: false
    };

    // popup.js view
    var registerView = function(view) {
        _view = view;
    };

    // Save basic connection info to chrome browser's local storage
    var saveOptions = function (done) {
        chrome.storage.local.set({
            server: settings.server,
            port: settings.port,
            password: settings.password
        }, function () {
            done();
        });
    };

    // Load basic connection info from chrome's local storage
    var loadOptions = function (done) {
        chrome.storage.local.get(null, function (items) {
            settings.server = items.server || settings.server;
            settings.port = items.port || settings.port;
            settings.password = items.password || settings.password;
            done();
        });
    };

    // Change browseraction tooltip and color when websocket status changes
    var setIcon = function (connected) {
        if (connected) {
            chrome.browserAction.setIcon({path: "img/icon-connected.png"});
            chrome.browserAction.setTitle({title: "TeamConsole connected"});
        } else {
            chrome.browserAction.setIcon({path: "img/icon-disconnected.png"});
            chrome.browserAction.setTitle({title: "TeamConsole disconnected"})
        }
    };

    // Find first bookmark in bookmarks[] that has key matching value
    var findBookmark = function (key, value) {
        for (var i = 0; i < bookmarks.length; i++) {
            if (bookmarks[i][key] === value) {
                return bookmarks[i];
            }
        }
        return null;
    };

    // Takes array of all bookmarks and creates them in browser
    var populateBookmarks = function (nodes) {
        bookmarks = [];
        for (var i = 0; i < nodes.length; i++) {
            // Change null parent to # so jsTree can parse properly
            if(nodes[i].parent === "") {
                nodes[i].parent = "#";
            }
            bookmarks.push(nodes[i]);
        }
    };

    var updateBookmark = function(node) {
        for(var i=0; i < bookmarks.length; i++) {
            if(bookmarks[i].id === node.id) {
                bookmarks[i] = node;
                return;
            }
        }
    };

    var sendRequest = function (type, msg) {
        // create our request object
        var request = {
            type: type,
            data: msg
        };

        // Send the request object as a JSON-formatted string.
        connection.socket.send(JSON.stringify(request));
    };

    var connect = function () {
        // Create a new WebSocket, close existing one if it exists already
        connection.socket = new WebSocket('ws://' + settings.server + ':' + settings.port);

        // connection established
        connection.socket.onopen = function (event) {
            setIcon(true); // Set icon when socket established
            connection.status = 'connected';
            if(_view) {
                _view('status');
            }
            sendRequest("login", settings.password);
        };

        // Handle messages sent by the server.
        connection.socket.onmessage = function (event) {
            var msg = JSON.parse(event.data);
            switch (msg.type) {
                case "login":
                    if (msg.code === 200) {
                        console.log("Login successful.");
                        sendRequest("list",null);
                    } else {
                        console.log("Login failed:" + msg.code);
                        connection.paused = true;
                        connection.socket.close();
                    }
                    break;
                case "list":
                    populateBookmarks(msg.nodes);
                    if(_view) {
                        _view('update');
                    }
                    break;
                case "create":
                    if(msg.nodes) {
                        bookmarks.push(msg.nodes[0]);
                        if(_view) {
                            _view('update');
                        }
                    }
                    break;
                case "delete":
                    if(msg.code !== 200) {
                        if(_view) {
                            _view('delete', msg.code);
                        }
                    }
                    break;
                case "update":
                    if(msg.nodes[0].id) {
                        updateBookmark(msg.nodes[0]);
                        if(_view) {
                            _view('update');
                        }
                    }
                    break;
            }
        };

        // Handle any errors that occur.
        connection.socket.onerror = function (error) {
            // console.log('WebSocket Error');
        };

        // Set icon when socket closes
        connection.socket.onclose = function (event) {
            setIcon(false);
            connection.status = 'disconnected';
            if(_view) {
                _view('status');
            }
            if (!connection.paused) {
                setTimeout(function () {
                    console.log("retrying connection...");
                    connect();
                }, 5000);
            }
        };
    };

    var getNodes = function() {
        return bookmarks;
    };

    // send new node off to server to be created, expect created response with node details including id
    var createNode = function(node) {
        var newnode = {
                id: "",
                parent: node.parent,
                text: node.name,
                type: node.type,
                url: node.url
        };

        if(node.type === "ssh") {
            newnode.url = node.host + ":" + node.port;
        }

        sendRequest("create", newnode);
    };

    // send new node off to server to be created, expect created response with node details including id
    var updateNode = function(node) {
        var updatenode = {
            id: node.id,
            text: node.name,
            type: node.type,
            url: node.url
        };

        if(node.type === "ssh") {
            updatenode.url = node.host + ":" + node.port;
        }

        sendRequest("update", updatenode);
    };


    var deleteNode = function(nodeid, parentid) {
        sendRequest("delete", {id: nodeid, parent: parentid});
    };

    var init = function() {
        loadOptions(function() {
           connect();
        });
    };

    return {
        //network methods
        connect: connect,
        connection: connection,

        // extension config/icon methods
        loadOptions:    loadOptions,
        saveOptions:    saveOptions,
        setIcon:        setIcon,
        settings:       settings,

        // nodes methods
        getNodes:       getNodes,
        createNode:     createNode,
        deleteNode:     deleteNode,
        updateNode:     updateNode,

        //entry point and listener registration
        init: init,
        registerView:   registerView
    };

})(); // end teamconsole namespace


// Main - we don't need to wait for DOM to begin
teamconsole.init();




