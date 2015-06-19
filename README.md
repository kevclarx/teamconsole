TeamConsole 
written by: Kevin Clark kclark@tcpmutt.com

SUMMARY:
--------
Chrome extension for managing SSH and HTML bookmarks across a team using Chrome browser.

REQUIRES:
---------
<a href="https://chrome.google.com/webstore/detail/secure-shell/pnhechapfaindjhompbnflcldabbghjo?hl=en-US">SecureShell Extension</a> to use SSH in Chrome browser

DESCRIPTION:
------------
State is stored on a server that you provide by running the included Go code which creates and maintains
a bookmarks file which is synced to all clients.  Optionally a auth file can be specificed with
some basic password controls to prevent unauthorized users from accessing your bookmarks.

This extension is suitable for environments where you do not want to store sensitive data in "the cloud".  Since
it is intended to manage bookmarks for internal devices all communication is strictly to the server and no outside
connections are made.

TODO:
  - local storage of username preferences for each node
  - optimize initial data download on extension start so it doesn't have to download entire json structure
  - individual user based access and controls and permission structure



