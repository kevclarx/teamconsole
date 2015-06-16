package main

import (
	"encoding/json"
	"fmt"
	"golang.org/x/net/websocket"
	"os"
	//	"net/http"
	//	"strconv"
)

func Login(ws *websocket.Conn, msg WSMessage) bool {
	wsrep := LoginReply{Type: "login", Code: 200}
	err := websocket.JSON.Send(ws, wsrep)
	if err != nil {
		fmt.Printf("Couldn't send login reply:%s\n", err.Error())
		os.Exit(1)
	}
	return true
}

func List(ws *websocket.Conn, msg WSMessage) {
	wsrep := ListReply{Type: "list", Nodes: bookmarkTreeNode.getTree()}
	fmt.Printf("sending list reply %v\n", wsrep)
	err := websocket.JSON.Send(ws, wsrep)
	if err != nil {
		fmt.Printf("Couldn't send login reply:%s\n", err.Error())
		os.Exit(1)
	}
}

func Update(ws *websocket.Conn, msg WSMessage) {
	updatedNode := &BookmarkTreeNode{}
	err := json.Unmarshal(msg.Data, &updatedNode)
	if err != nil {
		fmt.Printf("update message decoder error: %s\n", err.Error())
		return
	}
	fmt.Printf("Update node:%s Parent:%s", updatedNode.Title, updatedNode.ParentId)
	//Update node data
	for _, n := range bookmarkTreeNode.getTree() {
		if n.Id == updatedNode.Id {
			n.ParentId = updatedNode.ParentId
			n.Index = updatedNode.Index
			n.Title = updatedNode.Title
			n.Url = updatedNode.Url
			break
		}
	}

	// Write it out to disk
	if err = bookmarkTreeNode.WriteFile(); err != nil {
		panic(err)
	}
}

/*
func Delete(w http.ResponseWriter, r *http.Request) {
	var nodeid int64
	var err error

	muxvars := mux.Vars(r)
	if val, ok := muxvars["id"]; ok {
		nodeid, err = strconv.ParseInt(val, 10, 64)
		if err != nil {
			// id var is present but not a number
			w.WriteHeader(422) // unprocessable return code
			return
		}
	}

	for i, n := range nodelist.nodes {
		if nodeid == n.Id {
			nodelist.nodes = append(nodelist.nodes[:i], nodelist.nodes[i+1:]...)
			// Write it out to disk
			if err := nodelist.WriteFile(); err != nil {
				panic(err)
			}
			w.WriteHeader(http.StatusOK)
			return
		}
	}
	w.WriteHeader(http.StatusNotFound)
}


func Create(ws *websocket.Conn) {
	decoder := json.NewDecoder(r.Body)
	node := &Node{}

	err := decoder.Decode(&node)
	if err != nil {
		fmt.Fprintf(w, err.Error())
		w.WriteHeader(422)
		return
	}

	node.Id = nodelist.nextid
	nodelist.nextid++
	nodelist.nodes = append(nodelist.nodes, node)

	// Write it out to disk
	if err := nodelist.WriteFile(); err != nil {
		panic(err)
	}

	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(&node); err != nil {
		panic(err)
	}

}



func List(w http.ResponseWriter, r *http.Request) {
	var nodeid int64
	var err error

	output := make([]*Node, 0)

	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	muxvars := mux.Vars(r)
	if val, ok := muxvars["id"]; ok {
		nodeid, err = strconv.ParseInt(val, 10, 64)
		if err != nil {
			// id var is present but not a number
			w.WriteHeader(422) // unprocessable return code
			return
		}
	}

	for _, n := range nodelist.nodes {
		if nodeid == 0 {
			output = append(output, n)
			continue
		}
		if nodeid == n.Id {
			output = append(output, n)
			break
		}
	}

	// didn't find any matching nodes for id
	if output == nil {
		w.WriteHeader(http.StatusNotFound)
		return
	}

	// write out matching node(s)
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(&output); err != nil {
		panic(err)
	}
}
*/
