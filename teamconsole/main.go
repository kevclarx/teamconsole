package main

import (
	"fmt"
	"log"
	"net/http"
)

// Globals
var nodelist *NodeList

func main() {
	nodelist = &NodeList{filename: "../data/nodes.json"}
	// Read nodes config from disk
	err := nodelist.ReadFile()
	if err != nil {
		panic(err)
	}

	// Check to see if nodes is empty, if so populate with default entry
	fmt.Printf("Number of nodes: %v\n", len(nodelist.nodes))

	// Register our routes and start up http server
	router := NewRouter()
	log.Fatal(http.ListenAndServe(":8080", router))
}
