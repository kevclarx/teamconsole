package main

import (
	"encoding/json"
	"fmt"
	"golang.org/x/net/websocket"
	"os"
)

type WSMessage struct {
	Type string          `json:"type"`
	Data json.RawMessage `json:"data"`
}

type CodeReply struct {
	Type string `json:"type"`
	Code int64  `json:"code"`
}

type ListReply struct {
	Type  string `json:"type"`
	Nodes []*BookmarkTreeNode
}

func AuthError(ws *websocket.Conn, msg WSMessage) {
	wsrep := CodeReply{Type: "login", Code: 401}
	err := websocket.JSON.Send(ws, wsrep)
	if err != nil {
		fmt.Printf("Couldn't send login unauthorized reply:%s\n", err.Error())
		os.Exit(1)
	}
}

func WSHandler(ws *websocket.Conn) {
	defer ws.Close()
	var authenticated = false
	var msg WSMessage

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
			List(ws, msg)
		case "update":
			Update(ws, msg)
		case "create":
			Create(ws, msg)
		case "delete":
			Delete(ws, msg)
		}
	}
}
