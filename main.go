package main

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"./schedules"
	"github.com/gorilla/mux"
)

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
	router.Handle("/", http.FileServer(http.Dir("./static")))
	router.HandleFunc("/cus/{id}", getCU)
	log.Fatal(http.ListenAndServe(":8000", router))
}
