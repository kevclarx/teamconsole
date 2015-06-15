package main

import (
	//	"encoding/json"
	"fmt"
	"golang.org/x/net/websocket"
	"os"
	//	"net/http"
	//	"strconv"
)

func Login(ws *websocket.Conn, wsreq WSReq) bool {
	wsrep := LoginReply{Type: "login", Code: 200}
	err := websocket.JSON.Send(ws, wsrep)
	if err != nil {
		fmt.Printf("Couldn't send login reply:%s\n", err.Error())
		os.Exit(1)
	}
	return true
}

func List(ws *websocket.Conn, wsreq WSReq) {
	wsrep := ListReply{Type: "list", Nodes: bookmarkTreeNode.getTree()}
	err := websocket.JSON.Send(ws, wsrep)
	if err != nil {
		fmt.Printf("Couldn't send login reply:%s\n", err.Error())
		os.Exit(1)
	}
}

/*
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

func Update(w http.ResponseWriter, r *http.Request) {
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

	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	decoder := json.NewDecoder(r.Body)
	node := &Node{}
	err = decoder.Decode(&node)
	if err != nil {
		w.WriteHeader(422) // unprocessable return code
		fmt.Fprintf(w, err.Error())
		return
	}

	//Update node data
	for i, cur := range nodelist.nodes {
		if cur.Id == nodeid {
			nodelist.nodes[i] = node
			break
		}
	}

	// Write it out to disk
	if err = nodelist.WriteFile(); err != nil {
		panic(err)
	}
	w.WriteHeader(http.StatusOK)
}

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
