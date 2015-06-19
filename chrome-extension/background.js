/**
 * Created by Kevin on 6/12/2015.
 */

// Main object in global scope
var teamconsole = (function() {

    var settings = {
        server: 'teamconsole.yourdomain.com',
        port: 7329,
        title: 'TeamConsole',
        password: ''
    };

    // bookmarks list containing Bookmark objects
    var bookmarks = [];

    // Websocket connection properties
    var connection = {
        socket: null,
        status: "disconnected",
        paused: false
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

    // Bookmark object that contains both server and local client ids
    var Bookmark = function (bookmarkdata) {
        this.title = bookmarkdata.title;            // bookmark title
        this.s_id = bookmarkdata.s_id;              // server id
        this.c_id = bookmarkdata.c_id;              // client id (local to user's chrome scope)
        this.s_parentId = bookmarkdata.s_parentId;  // server parent id
        this.c_parentId = bookmarkdata.c_parentId;  // client parent id (local to user's chrome scope)
        this.index = bookmarkdata.index;            // index order within folder
        this.url = bookmarkdata.url;                // url to open
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
    var createBookmarks = function (nodes) {
        bookmarks = [];
        for (var i = 0; i < nodes.length; i++) {
            // First we must populate our server data
            bookmarks.push(new Bookmark({
                title: nodes[i].title,
                s_id: nodes[i].s_id,
                c_id: '',
                s_parentId: nodes[i].s_parentId,
                c_parentId: '',
                index: nodes[i].index,
                url: nodes[i].url
            }));
        }
        findOrCreateRootNode(function () { // find or create root node
            for (var i = 1; i < bookmarks.length; i++) {
                if (!bookmarks[i].c_id) { // indicates does not already exist so lets create it
                    var parentNode = findBookmark("s_id", bookmarks[i].s_parentId);
                    if (parentNode) {
                        createBookmark(i, parentNode.c_id);
                    } else {
                        console.log("ERROR: can't find parent node for " + this.bookmarks[i].title);
                    }
                }
            }
            console.log("Bookmark state synced.");
        });
    };

    // Create individual bookmark in chrome and record local id's in BookmarkManager
    var createBookmark = function (i, parentId) {
        chrome.bookmarks.create({
            parentId: parentId,
     //       index: bookmarks[i].index,
            title: bookmarks[i].title,
            url: bookmarks[i].url
        }, function (result) {
            bookmarks[i].c_id = result.id;
            bookmarks[i].c_parentId = result.parentId;
        });
    };

    // Find root bookmark or create if doesn't exist
    var findOrCreateRootNode = function (cb) {
        // find our root
        chrome.bookmarks.search({title: 'TeamConsole'}, function (results) {
            if (results.length === 0) {
                // didn't find existing root folder
                chrome.bookmarks.create({
                        'parentId': '1', // 1 is main bookmarks bar, user can move later
                        'title': 'TeamConsole'
                    },
                    function (newFolder) {
                        // update root node with local id's
                        bookmarks[0].c_id = newFolder.id;
                        bookmarks[0].c_parentId = newFolder.parentId;
                        bookmarks[0].index = newFolder.index;
                        cb();
                        //   alert("No TeamConsole bookmark folder found so created new folder: " + newFolder.title);
                    });
            } else {
                // found existing root folder
                bookmarks[0].c_id = results[0].id;
                bookmarks[0].c_parentId = results[0].parentId;
                bookmarks[0].index = results[0].index;

                // remove all nodes underneath the root so we can rebuild
                chrome.bookmarks.getChildren(results[0].id, function (childNode) {
                    childNode.forEach(function (node) {
                        chrome.bookmarks.removeTree(node.id, function () {
                            // removed
                        });
                    });
                });

                cb();
            }
        });
    };

    var update = function (bookmark) {
        var msg = {
            type: "update",
            data: bookmark
        };

        // Send the msg object to server
        sendMessage(msg);
    };

    var remove = function(id) {

    };

    // register all of Chrome's bookmark listeners to our object
    var addBookmarkListeners = function() {

        chrome.bookmarks.onCreated.addListener(function (id, bookmark) {
           // console.log("Bookmark created:" + bookmark.title);
        });

        chrome.bookmarks.onRemoved.addListener(function (id, removeInfo) {


        });

        chrome.bookmarks.onChanged.addListener(function (id, changeInfo) {
            var bookmark = findBookmark("c_id", id);
            if(bookmark) {
                bookmark.title = changeInfo.title;
                bookmark.url = changeInfo.url;
                update(bookmark);
            } else {
                console.log("Could not find changed bookmark id:" + id);
            }
        });

        chrome.bookmarks.onChildrenReordered.addListener(function (id, reorderInfo) {
            console.log("got reordered");
            console.log(reorderInfo);
        });

        chrome.bookmarks.onMoved.addListener(function (id, moveInfo) {
            var bookmark = findBookmark("c_id", id);
            // first make sure this is one of our bookmarks
            if (bookmark) {
                // we don't need to update server if moving root node
                if(bookmark.s_id === "0") {
                    return;
                }
                // if just an index change ignore - buggy
                if(moveInfo.oldParentId === moveInfo.parentId) {
                    return;
                }
                // now make sure we are moving it within our tree
                if (findBookmark("c_id", moveInfo.parentId)) {
                    bookmark.s_parentId = findBookmark("c_id",moveInfo.parentId).s_id;
                    bookmark.index = moveInfo.index;
                    update(bookmark);
                } else {
                    // move it back to original position
                    chrome.bookmarks.move(id, {
                        parentId: moveInfo.oldParentId,
                        index: moveInfo.oldIndex
                    }, function (result) {
                        alert("Must keep console bookmarks under TeamConsole.  Moving back.");
                    });
                }
            }
        });


    }; // end listeners

    var sendMessage = function (msg) {
        // Send the msg object as a JSON-formatted string.
        connection.socket.send(JSON.stringify(msg));
    };

    // Get list of all bookmarks from server
    var list = function() {
        var listrequest = {
            type: "list",
            data: ""
        };
        sendMessage(listrequest);
    };

    var connect = function () {

        // Create a new WebSocket, close existing one if it exists already
        if (connection.socket) {
            connection.socket.close();
        }
        connection.socket = new WebSocket('ws://' + settings.server + ':' + settings.port);

        // connection established
        connection.socket.onopen = function (event) {
            setIcon(true); // Set icon when socket established
            connection.status = 'connected';
            var msg = {
                type: "login",
                data: settings.password
            };
            // Send the msg object as a JSON-formatted string.
            sendMessage(msg);
        };

        // Handle messages sent by the server.
        connection.socket.onmessage = function (event) {
            var msg = JSON.parse(event.data);
            switch (msg.type) {
                case "login":
                    if (msg.code === 200) {
                        console.log("Login successful.");
                        list();
                    } else {
                        console.log("Login failed:" + msg.code);
                        connection.paused = true;
                        connection.socket.close();
                    }
                    break;
                case "list":
                    createBookmarks(msg.Nodes);
                    break;
                case "create":
                    break;
                case "delete":
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
            if (!connection.paused) {
                setTimeout(function () {
                    console.log("retrying connection...");
                    connect();
                }, 5000);
            }
        };
    };

    var init = function() {
        addBookmarkListeners();
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

        //entry point to load module and connect
        init: init
    };

})(); // end teamconsole namespace


// Main - we don't need to wait for DOM to begin
teamconsole.init();




