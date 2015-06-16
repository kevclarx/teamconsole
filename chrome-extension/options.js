/**
 * Created by Kevin on 6/12/2015.
 */

var background = chrome.extension.getBackgroundPage();

// Update status to let user know options were saved.
var statusdiv = document.getElementById('status');
var server = document.getElementById('server');
var port = document.getElementById('port');
var password = document.getElementById('password');

function saveOptions() {
    background.teamconsole.extensionManager.server = server.value;
    background.teamconsole.extensionManager.port = port.value;
    background.teamconsole.extensionManager.password = password.value;
    background.teamconsole.extensionManager.saveOptions(function() {
        statusdiv.innerHTML = '<b>Options saved.</b>';
        setTimeout(function() {
            statusdiv.innerHTML = '';
        }, 750);
    });
}

function fillValues() {
    server.value = background.teamconsole.extensionManager.server;
    port.value = background.teamconsole.extensionManager.port;
    password.value = background.teamconsole.extensionManager.password;
}

document.addEventListener('DOMContentLoaded', fillValues);
document.getElementById('save').addEventListener('click',
    saveOptions);
