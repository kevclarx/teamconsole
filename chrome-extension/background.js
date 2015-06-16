/**
 * Created by Kevin on 6/12/2015.
 */

// Main object in global scope
var teamconsole = {};

// Extension setting manager
teamconsole.extensionManager = (function() {

    var ExtensionManager = function () {
        this.server = 'teamconsole.yourdomain.com';
        this.port = 7329;
        this.title = 'TeamConsole';
        this.password = '';
    };

    // Save basic connection info to chrome browser's local storage
    ExtensionManager.prototype.saveOptions = function (done) {
        chrome.storage.local.set({
            server: this.server,
            port: this.port,
            password: this.password
        }, function () {
            done();
        });
    };

    // Load basic connection info from chrome's local storage
    ExtensionManager.prototype.loadOptions = function (done) {
        chrome.storage.local.get(null, function (items) {
            this.server = items.server || this.server;
            this.port = items.port || this.port;
            this.password = items.password || this.password;
            done();
        }.bind(this));
    };

    // Change browseraction tooltip and color when websocket status changes
    ExtensionManager.prototype.setIcon = function (connected) {
        if (connected) {
            chrome.browserAction.setIcon({path: "icon-connected.png"});
            chrome.browserAction.setTitle({title: "TeamConsole connected"});
        } else {
            chrome.browserAction.setIcon({path: "icon-disconnected.png"});
            chrome.browserAction.setTitle({title: "TeamConsole disconnected"})
        }
    };

    return new ExtensionManager();
})();

teamconsole.bookmarkManager = (function() {

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

    // Our bookmark manager object
    var BookmarkManager = function () {
        this.bookmarks = [];
        this.addListeners();
    };

    // Find first bookmark in bookmarks[] that has key matching value
    BookmarkManager.prototype.findBookmark = function (key, value) {
        for (var i = 0; i < this.bookmarks.length; i++) {
            if (this.bookmarks[i][key] === value) {
                return this.bookmarks[i];
            }
        }
        return null;
    };

    BookmarkManager.prototype.addBookmarks = function (nodes) {
        for (var i = 0; i < nodes.length; i++) {
            // First we must populate our server data
            this.bookmarks.push(new Bookmark({
                title: nodes[i].title,
                s_id: nodes[i].id,
                c_id: '',
                s_parentId: nodes[i].parentId,
                c_parentId: '',
                index: nodes[i].index,
                url: nodes[i].url
            }));
        }
        this.findOrCreateRootNode(function() { // find or create root node
            this.createLocalNodes(function() {
                console.log("Bookmark state synced.");
            }.bind(this));
        }.bind(this));
    };

    // Find root bookmark or create if doesn't exist
    BookmarkManager.prototype.findOrCreateRootNode = function(cb) {
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
                        this.bookmarks[0].c_id = newFolder.id;
                        this.bookmarks[0].c_parentId = newFolder.parentId;
                        this.bookmarks[0].index = newFolder.index;
                        cb();
                     //   alert("No TeamConsole bookmark folder found so created new folder: " + newFolder.title);
                    }.bind(this));
            } else {
                // found existing root folder
                this.bookmarks[0].c_id = results[0].id;
                this.bookmarks[0].c_parentId = results[0].parentId;
                this.bookmarks[0].index = results[0].index;

                // remove all nodes underneath the root so we can rebuild
                chrome.bookmarks.getChildren(results[0].id, function(childNode) {
                    childNode.forEach(function(node) {
                        chrome.bookmarks.removeTree(node.id, function() {
                            // removed
                        });
                    });
                });

                cb();
            }
        }.bind(this));
    };

    // Create or update bookmarks in chrome if modified since last time
    BookmarkManager.prototype.createLocalNodes = function (cb) {

        for(var i = 1; i < this.bookmarks.length; i++) {
            if (!this.bookmarks[i].c_id) { // indicates does not already exist so lets create it
                var parentNode = this.findBookmark("s_id", this.bookmarks[i].s_parentId);
                if (parentNode) {
                    this.createBookmark(i, parentNode.c_id);
                } else {
                    console.log("ERROR: can't find parent node for " + this.bookmarks[i].title);
                }
            }
        }
        cb();
    };

    // Create individual bookmark in chrome and record local id's in BookmarkManager
    BookmarkManager.prototype.createBookmark = function(index, parentId) {
        chrome.bookmarks.create({
            parentId: parentId,
            index:  this.bookmarks[index].index,
            title:  this.bookmarks[index].title,
            url:    this.bookmarks[index].url
        }, function (result) {
            console.log(result);
            this.bookmarks[index].c_id = result.id;
            this.bookmarks[index].c_parentId = result.parentId;
        }.bind(this));
    };

  /*  BookmarkManager.prototype.updateBookmarkNode = function(updatedBookmark) {
        var bookmark = bookmarkList.findBookmark("c_id", updatedBookmark.id);
        if(!bookmark) {
            console.log("Could not find bookmark for client id:" + updatedBookmark.id);
            return;
        }
        bookmark.c_parentId = updatedBookmark.parentId || bookmark.c_parentId;
        bookmark.s_parentId = bookmarkList.findBookmark("c_parentId",updatedBookmark.parentId).s_id || bookmark.s_parentId;
        bookmark.c_id = updatedBookmark.id || bookmark.c_id;
        bookmark.title = updatedBookmark.title || bookmark.title;
        bookmark.url = updatedBookmark.url || bookmark.url;
        bookmark.index = updatedBookmark.index || bookmark.index;

        var msg = {
            type: "update",
            id: bookmark.s_id,
            parentId: bookmark.s_parentId,
            title: bookmark.title,
            url: bookmark.url,
            index: bookmark.index
        };
        console.log(msg);
        // Send the msg object as a JSON-formatted string.
        socket.send(JSON.stringify(msg));
    }; */

    // register all of Chrome's bookmark listeners to our object
    BookmarkManager.prototype.addListeners = function () {
        chrome.bookmarks.onCreated.addListener(function (id, bookmark) {
            console.log("Bookmark created:" + bookmark.title);
        }.bind(this));

        chrome.bookmarks.onRemoved.addListener(function (id, removeInfo) {

        }.bind(this));

        chrome.bookmarks.onChanged.addListener(function (id, changeInfo) {

        }.bind(this));

        chrome.bookmarks.onChildrenReordered.addListener(function (id, reorderInfo) {

        }.bind(this));

    /*    chrome.bookmarks.onMoved.addListener(function (id, moveInfo) {
            console.log("update message:" + id);
            console.log(moveInfo);
            // first make sure this is one of our bookmarks
            if (bookmarkList.findBookmark("c_id", id) !== null) {
                // now make sure we are moving it within our tree and not outside unless it is root
                if (bookmarkList.findBookmark("c_id", moveInfo.parentId) !== null || id === root.id) {
                    moveInfo.id = id;
                    updateBookmarkNode(moveInfo);
                } else {
                    chrome.bookmarks.move(id, {
                        parentId: moveInfo.oldParentId,
                        index: moveInfo.oldIndex
                    }, function (result) {
                        alert("Must keep console bookmarks under TeamConsole.  Moving back.");
                    });
                }
            }
        }.bind(this)); */
    }; // end listeners

    return new BookmarkManager();
})();

teamconsole.networkManager = (function(bookmarkManager, extensionManager) {

    // our 'private' variables
    var socket,         // websocket
        pauseconnection;// whether server updates are paused or not

    // Websocket manager object
    var NetworkManager = function () {
        this.socket = null;
        this.status = "disconnected";
    };

    // connect to websocket server and send login credentials
    NetworkManager.prototype.connect = function () {
        // Create a new WebSocket, close existing one if it exists already
        if (this.socket) {
            this.socket.close();
        }
        extensionManager.loadOptions(function() {
            this.socket = new WebSocket('ws://' + extensionManager.server + ':' + extensionManager.port);
            this.addListeners();
        }.bind(this));
    };

    NetworkManager.prototype.addListeners = function () {

        // connection established
        this.socket.onopen = function (event) {
            extensionManager.setIcon(true); // Set icon when socket established
            this.status = 'connected';
            var msg = {
                type: "login",
                request: extensionManager.password
            };
            // Send the msg object as a JSON-formatted string.
            this.socket.send(JSON.stringify(msg));
        }.bind(this);

        // Handle messages sent by the server.
        this.socket.onmessage = function (event) {
            var msg = JSON.parse(event.data);
            switch (msg.type) {
                case "hash":
                    var hashes = msg.hashes;
                    console.log(hashes);
                    break;
                case "login":
                    if (msg.code === 200) {
                        console.log("Login successful.");
                        msg = {
                            type: "list",
                            request: "foo"
                        };
                        // Send the msg object as a JSON-formatted string.
                        this.socket.send(JSON.stringify(msg));
                    }
                    else {
                        console.log("Login failed:" + msg.code);
                        pauseconnection = true;
                        this.socket.close();
                    }
                    break;
                case "list":
                    bookmarkManager.addBookmarks(msg.Nodes);
                    break;
            }
        }.bind(this);

        // Handle any errors that occur.
        this.socket.onerror = function (error) {
            // console.log('WebSocket Error');
        }.bind(this);

        // Set icon when socket closes
        this.socket.onclose = function (event) {
            extensionManager.setIcon(false);
            this.status = 'disconnected';
            if (!pauseconnection) {
                setTimeout(function () {
                    console.log("retrying connection...");
                    connect();
                }, 5000);
            }
        }.bind(this);
    };

    return new NetworkManager();
})(teamconsole.bookmarkManager, teamconsole.extensionManager);




// Main - we don't need to wait for DOM to begin
teamconsole.networkManager.connect();



