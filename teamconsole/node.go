package main

import (
	"encoding/json"
	"os"
	"sync"
)

type Node struct {
	Name      string  `json:"name"`
	Ipaddress string  `json:"ipaddress"`
	Id        int64   `json:"id"`
	Nodes     []*Node `json:"nodes"`
	m         sync.Mutex
}

type NodeList struct {
	nodes    []*Node
	filename string
	nextid   int64
	m        sync.Mutex
}

// Read nodes json file
func (n *NodeList) ReadFile() error {
	f, err := os.Open(n.filename)
	if err != nil {
		return err
	}
	defer f.Close()

	jsonDecoder := json.NewDecoder(f)
	if err := jsonDecoder.Decode(&n.nodes); err != nil {
		return err
	}
	n.nextid = n.getMaxID() + 1

	return nil
}

// Return max id of all nodes in nodelist
func (n *NodeList) getMaxID() int64 {
	var maxID int64

	for _, node := range n.nodes {
		if node.Id > maxID {
			maxID = node.Id
		}
	}
	return maxID
}

// Write nodes out to disk
func (n *NodeList) WriteFile() error {
	f, err := os.Create(n.filename)
	if err != nil {
		return err
	}
	defer f.Close()

	jsonEncoder := json.NewEncoder(f)
	if err := jsonEncoder.Encode(&n.nodes); err != nil {
		return err
	}
	return nil
}
