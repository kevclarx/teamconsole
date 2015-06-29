package main

import (
	"flag"
	"fmt"
	"golang.org/x/net/websocket"
	"log"
	"net/http"
	"os"
)

// Globals
var bookmarkTreeNode *BookmarkTreeNode
var bookmarksFile = flag.String("bmfile", "bookmarks.json", "file containing bookmarks for teamconsole")
var authFile = flag.String("authfile", "auth.json", "file containing password, if empty no password is used")
var port = flag.Int("port", 8888, "port for server to listen on")
var nextID int
var connections map[*websocket.Conn]bool

func main() {
	flag.Parse()

	// Create our websocket pool
	connections = make(map[*websocket.Conn]bool)

	// Global bookmark tree struct
	bookmarkTreeNode = &BookmarkTreeNode{}
	bookmarkTreeNode.CreateTree()

	if _, err := os.Stat(*bookmarksFile); err == nil {
		// Read bookmarks file from disk and replace default stub
		if err := bookmarkTreeNode.ReadFile(); err != nil {
			panic(err)
		}
	} else {
		// file didn't exist before so lets write default structure to disk
		if err := bookmarkTreeNode.WriteFile(); err != nil {
			panic(err)
		}
	}
	nextID = bookmarkTreeNode.GetMaxID() + 1

	fmt.Printf("Number of bookmark entries: %v\n", len(GetTree(bookmarkTreeNode)))

	http.Handle("/", websocket.Handler(WSHandler))
	/*	func(w http.ResponseWriter, req *http.Request) {
		s := websocket.Server{Handler: websocket.Handler(WSHandler)}
		s.ServeHTTP(w, req)
	}) */
	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%d", *port), nil))
}
