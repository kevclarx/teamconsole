package main

import (
	"fmt"
	"golang.org/x/net/websocket"
	"os"
)

type WSReq struct {
	Type    string `json:"type"`
	Request string `json:"request"`
}

type LoginReply struct {
	Type string `json:"type"`
	Code int64  `json:"code"`
}

func AuthError(ws *websocket.Conn) {
	wsrep := LoginReply{Type: "login", Code: 401}
	err := websocket.JSON.Send(ws, wsrep)
	if err != nil {
		fmt.Printf("Couldn't send login unauthorized reply:%s\n", err.Error())
		os.Exit(1)
	}
}

func WSHandler(ws *websocket.Conn) {
	defer ws.Close()
	var authenticated = false

	for {
		var wsreq WSReq
		err := websocket.JSON.Receive(ws, &wsreq)
		if err != nil {
			// fmt.Printf("Error receiving message:%s\n", err.Error())
			break
		}
		if wsreq.Type != "login" && !authenticated {
			AuthError(ws)
			break
		}
		switch wsreq.Type {
		case "login":
			authenticated = Login(ws, wsreq)
		case "list":
			List(ws, wsreq)
		}
	}
}
