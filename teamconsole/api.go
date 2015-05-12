package main

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

func Create(w http.ResponseWriter, r *http.Request) {
	node := &Node{}
	node.Name = r.FormValue("name")
	node.Ipaddress = r.FormValue("ipaddress")
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
	w.Header().Set("Content-Type", "application/json; charset=UTF-8")

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
