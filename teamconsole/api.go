package main

import (
	"encoding/json"
	"fmt"
	"golang.org/x/net/websocket"
	"os"
	"strconv"
)

func Login(ws *websocket.Conn, msg WSMessage) bool {
	wsrep := CodeReply{Type: "login", Code: 200}
	err := websocket.JSON.Send(ws, wsrep)
	if err != nil {
		fmt.Printf("Couldn't send login reply:%s\n", err.Error())
		os.Exit(1)
	}
	return true
}

func List(ws *websocket.Conn, msg WSMessage) {
	wsrep := ListReply{Type: "list", Nodes: GetTree(bookmarkTreeNode)}
	err := websocket.JSON.Send(ws, wsrep)
	if err != nil {
		fmt.Printf("Couldn't send login reply:%s\n", err.Error())
		os.Exit(1)
	}
}

func Update(ws *websocket.Conn, msg WSMessage) {
	node := &BookmarkTreeNode{}
	err := json.Unmarshal(msg.Data, &node)
	if err != nil {
		fmt.Printf("update message unmarshal error: %s\n", err.Error())
		return
	}

	// update our node tree with changed node
	bookmarkTreeNode.UpdateNode(node)

	// Write it out to disk
	if err = bookmarkTreeNode.WriteFile(); err != nil {
		panic(err)
	}

	wsrep := CodeReply{Type: "update", Code: 200}
	err = websocket.JSON.Send(ws, wsrep)
	if err != nil {
		fmt.Printf("Couldn't send reply:%s\n", err.Error())
		os.Exit(1)
	}
}

func Delete(ws *websocket.Conn, msg WSMessage) {
	node := &BookmarkTreeNode{}
	err := json.Unmarshal(msg.Data, &node)
	if err != nil {
		fmt.Printf("delete message unmarshal error: %s\n", err.Error())
		return
	}

	wsrep := NodeReply{Type: "delete", Node: node}

	// delete node from our node tree
	if !bookmarkTreeNode.DeleteNode(node.Id, node.Parent) {
		node.Id = ""
		node.Text = "Must delete contents of folder first."
	}

	// Write it out to disk
	if err = bookmarkTreeNode.WriteFile(); err != nil {
		panic(err)
	}

	err = websocket.JSON.Send(ws, wsrep)
	if err != nil {
		fmt.Printf("Couldn't send reply:%s\n", err.Error())
		os.Exit(1)
	}
}

func Create(ws *websocket.Conn, msg WSMessage) {
	wsrep := NodeReply{Type: "create", Node: nil}

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
		wsrep = NodeReply{Type: "create", Node: node}
	}

	err = websocket.JSON.Send(ws, wsrep)
	if err != nil {
		fmt.Printf("Couldn't send reply:%s\n", err.Error())
		os.Exit(1)
	}

}
