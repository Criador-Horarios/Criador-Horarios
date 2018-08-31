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

func schedulesHandler(w http.ResponseWriter, r *http.Request) {
	cus := make([]*schedules.CurricularUnit, 0)
	url := "https://fenix.tecnico.ulisboa.pt/disciplinas/FP4517957/2018-2019/1-semestre/pagina-inicial"
	fp := schedules.NewCU(url)
	cus = append(cus, fp)
	fmt.Fprintf(w, "<h1>Simulador de Criador de Horarios</h1>")
	fmt.Fprintf(w, "<p>%v</p>", fp)
}

func main() {
	router := mux.NewRouter()
	router.HandleFunc("/", indexHandler)
	router.HandleFunc("/cus/{url}", getCU)
	log.Fatal(http.ListenAndServe(":8000", router))
}
