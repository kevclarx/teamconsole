package main

import (
	"net/http"

	"github.com/gorilla/mux"
)

func NewRouter() *mux.Router {
	router := mux.NewRouter().StrictSlash(true)

	// Load all our REST endpoint routes from routes.go
	for _, route := range routes {
		var handler http.Handler
		handler = route.HandlerFunc
		handler = RequestLogger(handler, route.Name)

		router.
			Methods(route.Method).
			Path(route.Pattern).
			Name(route.Name).
			Handler(handler)
	}
	router.PathPrefix("/").Handler(http.FileServer(http.Dir("../html")))
	return router
}
