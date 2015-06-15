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
var nextID int64

func main() {
	flag.Parse()

	// Global bookmark tree struct
	bookmarkTreeNode = &BookmarkTreeNode{}

	// If bookmarks file does not exist create new stub
	if _, err := os.Stat(*bookmarksFile); err != nil {
		// Read bookmarks from disk
		if err := bookmarkTreeNode.ReadFile(); err != nil {
			panic(err)
		}
	} else { /*not exists or some other error*/
		bookmarkTreeNode.CreateNewTree()
		if err = bookmarkTreeNode.WriteFile(); err != nil {
			panic(err)
		}
	}
	nextID = bookmarkTreeNode.getMaxID() + 1

	// Check to see if bookmark file is empty, if so populate with default entry
	fmt.Printf("Number of bookmark entries: %v\n", len(bookmarkTreeNode.getTree()))

	http.Handle("/", websocket.Handler(WSHandler))
	/*	func(w http.ResponseWriter, req *http.Request) {
		s := websocket.Server{Handler: websocket.Handler(WSHandler)}
		s.ServeHTTP(w, req)
	}) */
	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%d", *port), nil))
}
