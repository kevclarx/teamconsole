function displayStatus() {
    var connStatus = background.teamconsole.getStatus();
    var statusdiv = document.getElementById('connstatus');
    statusdiv.innerHTML = '<b>Connection status: ' + connStatus + "</b><br>Server:" +
        background.teamconsole.settings.server + ':' + background.teamconsole.settings.port + '<br>';

    if(connStatus !== 'connected') {
        statusdiv.className = 'alert alert-danger';
        statusdiv.innerHTML = statusdiv.innerHTML + '<br>Check server name and port in options!';
    } else {
        statusdiv.className = 'alert alert-success';
    }
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
                document.getElementById('secureshell').innerHTML =
                    '<p class="alert alert-danger" role="alert">' +
                    'SecureShell extension is disabled!  Enable it to use SSH bookmarks.' +
                    '</p>';
            }
        } else {
            document.getElementById('secureshell').innerHTML =
                '<span class="alert alert-danger" role="alert">' +
                '<a href="https://chrome.google.com/webstore/detail/secure-shell/pnhechapfaindjhompbnflcldabbghjo?hl=en-US" target="_">Get SecureShell Extension</a>' +
                '</span>';
        }
    });
}

// Main
var background = chrome.extension.getBackgroundPage();

window.addEventListener("DOMContentLoaded", function() {
    document.getElementById('options').addEventListener('click', openOptions);
    displayStatus();
    checkSecureShell();
}, false);

