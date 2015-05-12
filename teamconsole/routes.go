package main

import (
	"net/http"
)

type Route struct {
	Name        string
	Method      string
	Pattern     string
	HandlerFunc http.HandlerFunc
}

type Routes []Route

var routes = Routes{
	Route{
		"NodeCreate",
		"POST",
		"/api/nodes",
		Create,
	},
	Route{
		"NodeListAll",
		"GET",
		"/api/nodes",
		List,
	},
	Route{
		"NodeList",
		"GET",
		"/api/nodes/{id}",
		List,
	},
	Route{
		"NodeUpdate",
		"POST",
		"/api/nodes/{id}",
		Update,
	},
	Route{
		"NodeDelete",
		"DELETE",
		"/api/nodes/{id}",
		Delete,
	},
}
