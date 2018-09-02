package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"strings"

	"./schedules"
	"github.com/gorilla/mux"
)

func indexHandler(w http.ResponseWriter, r *http.Request) {
	page, _ := ioutil.ReadFile("index.html")
	fmt.Fprint(w, string(page))
}

// getCU returns a JSON response of a CU. The format for the
// CU id is NAME_LECTIVEYEAR_SEMESTER.
func getCU(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]
	url := "https://fenix.tecnico.ulisboa.pt/disciplinas/" + strings.Replace(id, "_", "/", -1)
	newCU := schedules.NewCU(url)
	json.NewEncoder(w).Encode(newCU)
}

func main() {
	router := mux.NewRouter()
	router.HandleFunc("/", indexHandler)
	router.HandleFunc("/cus/{id}", getCU)
	log.Fatal(http.ListenAndServe(":8000", router))
}
