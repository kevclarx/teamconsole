/**
 * Created by Kevin on 6/12/2015.
 */

$( document ).ready(function(window) {
    var background = chrome.extension.getBackgroundPage();

    $("#server").val(background.teamconsole.settings.server);
    $("#port").val(background.teamconsole.settings.port);
    $("#password").val(background.teamconsole.settings.password);

    $("#save").on('click', function() {
        background.teamconsole.settings.server = $("#server").val();
        background.teamconsole.settings.port = $("#port").val();
        background.teamconsole.settings.password = $("#password").val();

        background.teamconsole.saveOptions(function() {
            $("#saving").val("Options Saved.");
            setTimeout(function() {
                $("#saving").val("");
            }, 750);
            background.teamconsole.connect();
        });
    });
});


