package main

import (
	"encoding/json"
	"os"
	"strconv"
	"sync"
)

type BookmarkTreeNode struct {
	Id       string              `json:"id"`       // Server id for bookmark
	Parent   string              `json:"parent"`   // The id of the parent folder.
	Text     string              `json:"text"`     // The text displayed for the node in UI.
	Index    int64               `json:"index"`    // The 0-based position of this node within its parent folder.
	ReadOnly bool                `json:"readonly"` // special node that cannot be deleted or moved
	NodeType string              `json:"type"`     // node type
	Url      string              `json:"url"`      // url to open
	Children []*BookmarkTreeNode // An ordered list of children of this node.
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

	for _, node := range GetTree(bookmarkTreeNode) {
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
func GetTree(node *BookmarkTreeNode) []*BookmarkTreeNode {
	nodes := []*BookmarkTreeNode{}

	nodes = append(nodes, node)

	for _, child := range node.Children {
		nodes = append(nodes, GetTree(child)...)
	}

	return nodes
}

// Traverse tree and update node passed in
func (n *BookmarkTreeNode) UpdateNode(node *BookmarkTreeNode) *BookmarkTreeNode {
	for _, treenode := range GetTree(bookmarkTreeNode) {
		if treenode.Id == node.Id {
			treenode.Text = node.Text
			treenode.Url = node.Url
			return treenode
		}
	}
	return nil
}

// Traverse tree and delete node passed in
func (n *BookmarkTreeNode) DeleteNode(id, parentid string) bool {
	for _, parentnode := range GetTree(bookmarkTreeNode) {
		if parentnode.Id == parentid {
			for i, node := range parentnode.Children {
				if node.Id == id {
					if len(node.Children) == 0 {
						parentnode.Children = append(parentnode.Children[:i], parentnode.Children[i+1:]...)
						return true
					} else { // we only allow deleting nodes that are empty
						return false
					}

				}
			}
		}
	}
	return false
}

// Traverse tree and create node passed in
func (n *BookmarkTreeNode) CreateNode(node *BookmarkTreeNode) bool {
	for _, curnode := range GetTree(bookmarkTreeNode) {
		if curnode.Id == node.Parent {
			curnode.Children = append(curnode.Children, node)
			return true
		}
	}
	return false
}

// Create fresh BookmarkNode Tree from scratch
func (n *BookmarkTreeNode) CreateTree() {
	n.Id = "0"
	n.Text = "TeamConsole"
	n.ReadOnly = true
	n.NodeType = "folder"
}
