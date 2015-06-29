package main

import (
	"encoding/json"
	"fmt"
	"golang.org/x/net/websocket"
	"strconv"
)

func Login(ws *websocket.Conn, msg WSRequest) bool {
	reply := WSReply{Type: "login", Code: 200}

	if true {
		UnicastReply(ws, &reply)
		return true
	}
	return false
}

func List(ws *websocket.Conn) {
	reply := WSReply{Type: "list", Nodes: GetTree(bookmarkTreeNode)}
	UnicastReply(ws, &reply)
}

func ListAll() {
	reply := WSReply{Type: "list", Nodes: GetTree(bookmarkTreeNode)}
	BroadcastReply(&reply)
}

func Update(ws *websocket.Conn, msg WSRequest) {
	node := &BookmarkTreeNode{}
	err := json.Unmarshal(msg.Data, &node)
	if err != nil {
		fmt.Printf("update message unmarshal error: %s\n", err.Error())
		return
	}

	// update our node tree with changed node
	if node = bookmarkTreeNode.UpdateNode(node); node != nil {
		// Write it out to disk
		if err = bookmarkTreeNode.WriteFile(); err != nil {
			panic(err)
		}
	}

	reply := &WSReply{Type: "update"}
	reply.Nodes = append(reply.Nodes, node)
	BroadcastReply(reply)
}

func Delete(ws *websocket.Conn, msg WSRequest) {
	node := &BookmarkTreeNode{}
	err := json.Unmarshal(msg.Data, &node)
	if err != nil {
		fmt.Printf("delete message unmarshal error: %s\n", err.Error())
		return
	}

	reply := WSReply{Type: "delete", Code: 200}

	// delete node from our node tree
	if !bookmarkTreeNode.DeleteNode(node.Id, node.Parent) {
		reply.Code = 401
	}

	// Write it out to disk
	if err = bookmarkTreeNode.WriteFile(); err != nil {
		panic(err)
	}

	UnicastReply(ws, &reply)

	// Now send updated tree to everybody, eventually change this to specific prune message
	ListAll()
}

func Create(ws *websocket.Conn, msg WSRequest) {
	reply := WSReply{Type: "create", Nodes: nil}

	node := &BookmarkTreeNode{}
	err := json.Unmarshal(msg.Data, &node)
	if err != nil {
		fmt.Printf("create message unmarshal error: %s\n", err.Error())
		return
	}

	// add node to our node tree
	if bookmarkTreeNode.CreateNode(node) {
		node.Id = strconv.Itoa(nextID)
		nextID++

		// Write it out to disk
		if err = bookmarkTreeNode.WriteFile(); err != nil {
			panic(err)
		}
		reply.Nodes = append(reply.Nodes, node)
	}

	UnicastReply(ws, &reply)
}
