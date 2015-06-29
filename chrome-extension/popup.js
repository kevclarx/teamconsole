$(function () {

    function displayStatus() {
        if(background.teamconsole.connection.status !== 'connected') {
            $("#connstatus").removeClass('alert-success');
            $("#connstatus").addClass('alert-danger');
        } else {
            $("#connstatus").removeClass('alert-danger');
            $("#connstatus").addClass('alert-success');
        }

        $("#connstatus").html('[' + background.teamconsole.settings.server + ':' + background.teamconsole.settings.port +
            '] ' + background.teamconsole.connection.status);

    }

    function openOptions() {
        if (chrome.runtime.openOptionsPage) {
            // New way to open options pages, if supported (Chrome 42+).
            chrome.runtime.openOptionsPage();
        } else {
            // Reasonable fallback.
            window.open(chrome.runtime.getURL('options.html'));
        }
    }

    function checkSecureShell() {
        chrome.management.get('pnhechapfaindjhompbnflcldabbghjo', function (result) {
            if(result) {
                if(result.enabled === false) {
                    $("#secureshell").addClass('alert-danger');
                    $('#secureshell').html('SecureShell extension is disabled!  Enable it to use SSH bookmarks.');
                }
            } else {
                $("#secureshell").addClass('alert-danger');
                $('#secureshell').html('<a href="https://chrome.google.com/webstore/detail/secure-shell/pnhechapfaindjhompbnflcldabbghjo?hl=en-US" target="_">Get SecureShell Extension</a>');
            }
        });
    }

    // Main
    var background = chrome.extension.getBackgroundPage();
    var node;

    displayStatus();
    checkSecureShell();

    // yes it is tightly coupled with the model - this is a simple app
    // and no need for pub/sub
    background.teamconsole.registerView(function(viewEvent, err) {
        if(err) {
            alert('Error: ' + viewEvent + ' code: ' + err);
            return;
        }

        if(viewEvent === 'status') {
            displayStatus();
        }
        if(viewEvent === 'update') {
            $('#nodetree').jstree(true).settings.core.data = background.teamconsole.getNodes();
            $('#nodetree').jstree(true).refresh();
        }
    });

    // add listeners

    //Edit button
    $("#btn_edit").click(function() {
        $("#connectbox").addClass("hidden");
        $("#toolbar").addClass("hidden");
        $("#nodetree").addClass("hidden");
        $("#editbox").removeClass("hidden");

        // now populate fields with current node values
        $("#edit_name").val(node.text);
        $("#edit_type").val(node.type);
        $("#edit_type").attr('disabled', true);

        if(node.type === "http") {
            $("#edit_url").val(node.url);
            $("#edit_urlform").removeClass("hidden");
        }

        if(node.type === "ssh") {
            $("#edit_host").val(node.url.split(":")[0]);
            $("#edit_port").val(node.url.split(":")[1]);
            $("#edit_ssh").removeClass("hidden");
        }
    });

    // Cancel button on new console screen
    $("#edit_cancel").click(function() {
        $("#editbox").addClass("hidden");
        $("#toolbar").removeClass("hidden");
        $("#nodetree").removeClass("hidden");
    }.bind(this));

    //Save button on new console screen
    $("#edit_save").click(function() {
        var editnode = {
            id:     node.id,
            name: $("#edit_name").val(),
            type:  $("#edit_type").val(),
            url:  $("#edit_url").val(),
            host: $("#edit_host").val(),
            port: $("#edit_port").val()
        };
        background.teamconsole.updateNode(editnode);
        $("#editbox").addClass("hidden");
        $("#toolbar").removeClass("hidden");
        $("#nodetree").removeClass("hidden");
    }.bind(this));


    //New button
    $("#btn_new").click(function() {
        $("#connectbox").addClass("hidden");
        $("#toolbar").addClass("hidden");
        $("#nodetree").addClass("hidden");
        $("#newbox").removeClass("hidden");
    });


    //New form type select list
    $("#new_type").change(function() {
        if ($(this).val() === "folder") {
            $("#new_urlform").addClass("hidden");
            $("#new_ssh").addClass("hidden");
        }
        if ($(this).val() === "ssh") {
            $("#new_urlform").addClass("hidden");
            $("#new_ssh").removeClass("hidden");
        }
        if ($(this).val() === "http") {
            $("#new_urlform").removeClass("hidden");
            $("#new_ssh").addClass("hidden");
        }
    });

    // Cancel button on new console screen
    $("#new_cancel").click(function() {
        $("#newbox").addClass("hidden");
        $("#toolbar").removeClass("hidden");
        $("#nodetree").removeClass("hidden");
    }.bind(this));

    //Save button on new console screen
    $("#new_save").click(function() {
        var newnode = {
            parent: node.id,
            name: $("#new_name").val(),
            type:  $("#new_type").val(),
            url:  $("#new_url").val(),
            host: $("#new_host").val(),
            port: $("#new_port").val()
        };
        background.teamconsole.createNode(newnode);
        $("#newbox").addClass("hidden");
        $("#toolbar").removeClass("hidden");
        $("#nodetree").removeClass("hidden");
    }.bind(this));




    //Delete button
    $("#btn_remove").click(function() {
        if(node.id === "0") {
            alert("Cannot delete root node.");
            return;
        }
        background.teamconsole.deleteNode(node.id, node.parent);
    });

    //Connect button
    $("#btn_connect").click(function() {
        if(node.type === "ssh") {
            var username = $('#username').val();
            var url = "chrome-extension://pnhechapfaindjhompbnflcldabbghjo/html/nassh.html#" + username + '@' + node.url;
            window.open(url);
        }
        if(node.type === "http") {
            window.open(node.url);
        }
    });



    // Our main console node tree, jsTree plugin for jQuery
    $('#nodetree').jstree({
        'core': {
            'check_callback' : true,
            'data': background.teamconsole.getNodes()
        },
        "plugins" : [ "wholerow" ],
    }).on("ready.jstree", function (e, data) {
        data.instance.open_node($("#0"));  // open root level on initial load
        data.instance.select_node($("#0")); // select root node on initial load
    }).on("delete_node.jstree", function(e, data) {
        console.log("deleted:" + data.text);
    }).on("create_node.jstree", function(e, data) {
        console.log("created:" + data.text);
    }).on("select_node.jstree", function(e, data) {
        // when clicking a node grey out options not applicable to that node
        // set 'node' as currently selected which can be used elsewhere for modifying the tree
        node = data.node.original;

        if(node.type === "folder") {  // type folder
            $("#connectbox").addClass("hidden");
            $("#btn_connect").attr("disabled", true);
            $("#btn_new").attr("disabled", false);
            $("#btn_edit").attr("disabled", false);
            $("#btn_remove").attr("disabled", false);
        }

        if(node.type === "ssh" || node.type === "http") {  // SSH, HTTP connection set toolbar states
            $("#connectbox").removeClass("hidden");
            $("#btn_connect").attr("disabled", false);
            $("#btn_new").attr("disabled", true);
            $("#btn_edit").attr("disabled", false);
            $("#btn_remove").attr("disabled", false);

            if(node.type === "ssh") {  //SSH connection show username box
                $("#connectstring").text('@' + node.url);
                $("#username").removeClass("hidden");
            }
            if(node.type === "http") {  //HTTP connection hide username box
                $("#connectstring").text(node.url);
                $("#username").addClass("hidden");
                $("#connectusername").addClass("hidden");
            }
        }

    });

});
