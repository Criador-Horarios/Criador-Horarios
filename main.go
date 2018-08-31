package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"

	"./schedules"
	"github.com/gorilla/mux"
)

func indexHandler(w http.ResponseWriter, r *http.Request) {
	page, _ := ioutil.ReadFile("index.html")
	fmt.Fprint(w, string(page))
}

func getCU(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	url := vars["url"]
	fmt.Println(url)
	newCU := schedules.NewCU(url)
	json.NewEncoder(w).Encode(newCU)
}

func main() {
	router := mux.NewRouter()
	router.HandleFunc("/", indexHandler)
	router.HandleFunc("/cus/{url}", getCU)
	log.Fatal(http.ListenAndServe(":8000", router))
}
