package main

import (
	"encoding/json"
	"os"
	"strconv"
	"sync"
)

// CType is the console type
type CType int64

const (
	SSH CType = iota
	HTTP
)

// Server side replication of Chrome's BookmarkTreeNode with addition of Console Type -
// https://developer.chrome.com/extensions/bookmarks#type-BookmarkTreeNode
type BookmarkTreeNode struct {
	Id          string              `json:"id"`
	ParentId    string              `json:"parentId"` //The id of the parent folder. Omitted for the root node.
	Index       int64               `json:"index"`    // The 0-based position of this node within its parent folder.
	Url         string              `json:"url"`      // The URL navigated to when a user clicks the bookmark. Omitted for folders.
	Title       string              `json:"title"`    // The text displayed for the node.
	ConsoleType CType               `json:"ctype"`    // Type of console, either SSH or HTTP
	Children    []*BookmarkTreeNode `json:"children"` // An ordered list of children of this node.
	m           sync.Mutex
}

// Read Bookmarks json file
func (n *BookmarkTreeNode) ReadFile() error {
	f, err := os.Open(*bookmarksFile)
	if err != nil {
		return err
	}
	defer f.Close()

	jsonDecoder := json.NewDecoder(f)
	if err := jsonDecoder.Decode(&bookmarkTreeNode); err != nil {
		return err
	}

	return nil
}

// Return max id of all nodes in BookmarkTree
func (n *BookmarkTreeNode) getMaxID() int {
	var maxID int

	for _, node := range n.getTree() {
		nodeid, _ := strconv.Atoi(node.Id)
		if nodeid > maxID {
			maxID = nodeid
		}
	}
	return maxID
}

// Write bookmarks out to disk
func (n *BookmarkTreeNode) WriteFile() error {
	f, err := os.Create(*bookmarksFile)
	if err != nil {
		return err
	}
	defer f.Close()

	jsonEncoder := json.NewEncoder(f)
	if err := jsonEncoder.Encode(&bookmarkTreeNode); err != nil {
		return err
	}
	return nil
}

// Return array of all bookmark nodes including root
func (n *BookmarkTreeNode) getTree() []*BookmarkTreeNode {
	nodes := []*BookmarkTreeNode{}

	if n.Id == "0" {
		nodes = append(nodes, n)
	}

	for _, node := range n.Children {
		nodes = append(nodes, node)
		node.getTree()
	}
	return nodes
}

// Create fresh BookmarkNode Tree from scratch
func (n *BookmarkTreeNode) CreateTree() {
	n.Id = "0"
	n.Title = "TeamConsole"

	n.Children = []*BookmarkTreeNode{
		{
			Id:       "1",
			Title:    "SSH",
			ParentId: "0",
			Index:    0,
		},
		{
			Id:       "2",
			Title:    "HTTP",
			ParentId: "0",
			Index:    1,
		},
	}
}
