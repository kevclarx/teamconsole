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

type Console struct {
	ConsoleType CType  `json:"ctype"`
	Url         string `json:"url"`
	Desc        string `json:"desc"`
}

type BookmarkTreeNode struct {
	id       string              `json:"id"`       // Server id for bookmark
	parent   string              `json:"parent"`   // The id of the parent folder.
	Text     string              `json:"text"`     // The text displayed for the node in UI.
	Index    int64               `json:"index"`    // The 0-based position of this node within its parent folder.
	ReadOnly bool                `json:"readonly"` // special node that cannot be deleted or moved
	Consoles []*Console          `json:"consoles"` // Type of console, either SSH or HTTP
	Children []*BookmarkTreeNode `json:"children"` // An ordered list of children of this node.
	m        sync.Mutex
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
func (n *BookmarkTreeNode) GetMaxID() int {
	var maxID int

	for _, node := range n.GetTree() {
		nodeid, _ := strconv.Atoi(node.id)
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
func (n *BookmarkTreeNode) GetTree() []*BookmarkTreeNode {
	nodes := []*BookmarkTreeNode{}

	if n.id == "0" {
		nodes = append(nodes, n)
	}

	for _, node := range n.Children {
		nodes = append(nodes, node)
		node.GetTree()
	}
	return nodes
}

// Traverse tree and update node passed in
func (n *BookmarkTreeNode) UpdateNode(node BookmarkTreeNode) {

}

// Traverse tree and delete node passed in
func (n *BookmarkTreeNode) DeleteNode(node BookmarkTreeNode) {
	//	nodelist.nodes = append(nodelist.nodes[:i], nodelist.nodes[i+1:]...)
}

// Traverse tree and create node passed in
func (n *BookmarkTreeNode) CreateNode(node BookmarkTreeNode) {

}

// Create fresh BookmarkNode Tree from scratch
func (n *BookmarkTreeNode) CreateTree() {
	n.id = "0"
	n.Text = "TeamConsole"
	n.ReadOnly = true
}
