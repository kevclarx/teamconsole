TeamConsole 
by Kevin Clark(kclark@tcpmutt.com)

Simple client/server application to facilitate easy sharing
of web and ssh console information among a team.

The frontend is written in AngularJS and communicates with 
a RESTful API on the backend written in Go.

All data is stored in a single JSON file in the data directory
so if you are concerned about backups please make copies on a
regular basis as there is no access control within the application
to prevent a user from deleting or modifying the data store.

Still very much a work in progress and it is not complete at this time.


