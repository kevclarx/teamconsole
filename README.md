## TeamConsole
Kevin Clark kclark@tcpmutt.com
---

### SUMMARY:
Chrome extension for managing SSH and HTML bookmarks across a team using Chrome browser.

### REQUIRES:

[SecureShell extension]: https://chrome.google.com/webstore/detail/secure-shell/pnhechapfaindjhompbnflcldabbghjo?hl=en-US" to use SSH in Chrome browser


Server to host TeamConsole listener, server OS can be windows, linux, OSX, or anything Go supports

### DESCRIPTION:

State is stored on a server that you provide by running the included Go code which creates and maintains
a bookmarks file which is synced to all clients.  Optionally a auth file can be specificed with
some basic password controls to prevent unauthorized users from accessing your bookmarks.


This extension is suitable for environments where you do not want to store sensitive data in "the cloud".  Since
it is intended to manage bookmarks for internal devices all communication is strictly to the server and no outside
connections are made.

### USAGE:

#### Server:
```
  $ ./teamconsole.exe -h
	Usage of teamconsole.exe:
  		-authfile="auth.json": 		file containing password, if empty no password is used
  		-bmfile="bookmarks.json": 	file containing bookmarks for teamconsole
  		-port=8888: 				port for server to listen on
```


#### Client:

  Client will connect automatically when browser is loaded.  Check the browser icon color for connectivity indicators( green = good).  

  Click the browser icon to display a popup of the bookmark tree where you can connect to devices or add/move/remove devices via the menu.

  Make sure you have a TeamConsole server listening on an accessible port and that you have specified the correct server and port in the extension's options page.

### TODO:
  - local storage of username preferences for each node
  - optimize initial data download on extension start so it doesn't have to download entire json structure
  - individual user based access and controls and permission structure



