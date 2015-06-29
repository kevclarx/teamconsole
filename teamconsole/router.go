package main

import (
	"encoding/json"
	"fmt"
	"golang.org/x/net/websocket"
	"os"
)

type WSRequest struct {
	Type string          `json:"type"`
	Data json.RawMessage `json:"data"`
}

type WSReply struct {
	Type  string              `json:"type"`
	Code  int64               `json:"code"`
	Nodes []*BookmarkTreeNode `json:"nodes"`
}

func AuthError(ws *websocket.Conn, msg WSRequest) {
	reply := WSReply{Type: "login", Code: 401}
	UnicastReply(ws, &reply)
}

func UnicastReply(ws *websocket.Conn, reply *WSReply) {
	if err := websocket.JSON.Send(ws, reply); err != nil {
		fmt.Printf("Couldn't send reply:%s\n", err.Error())
		os.Exit(1)
	}
}

func BroadcastReply(reply *WSReply) {
	for conn := range connections {
		if err := websocket.JSON.Send(conn, reply); err != nil {
			fmt.Printf("Couldn't send reply:%s\n", err.Error())
			os.Exit(1)
		}
	}
}

func WSHandler(ws *websocket.Conn) {
	defer ws.Close()
	var authenticated = false
	var msg WSRequest

	connections[ws] = true

	for {
		err := websocket.JSON.Receive(ws, &msg)
		if err != nil {
			// client most likely disconnected so break out of loop and close socket
			//fmt.Printf("Error receiving message:%s\n", err.Error())
			break
		}
		if msg.Type != "login" && !authenticated {
			AuthError(ws, msg)
			break
		}
		switch msg.Type {

		case "login":
			authenticated = Login(ws, msg)
		case "list":
			List(ws)
		case "update":
			Update(ws, msg)
		case "create":
			Create(ws, msg)
		case "delete":
			Delete(ws, msg)
		}
	}
	delete(connections, ws)
}
