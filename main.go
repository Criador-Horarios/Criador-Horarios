package main

import (
	"fmt"
	"net/http"

	"./schedules"
)

func indexHandler(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, "/Criador-Horarios", 301)
}

func schedulesHandler(w http.ResponseWriter, r *http.Request) {
	cus := make([]*schedules.CurricularUnit, 0)
	url := "https://fenix.tecnico.ulisboa.pt/disciplinas/FP4517957/2018-2019/1-semestre/pagina-inicial"
	cus = append(cus, schedules.NewCU(url))
	fmt.Fprintf(w, "<h1>Simulador de Criador de Horarios</h1>")
	fmt.Fprintf(w, "<p>%v</p>", cus[0])
}

func main() {
	// http.HandleFunc("/", indexHandler)
	// http.HandleFunc("/Criador-Horarios", horariosHandler)
	// http.ListenAndServe(":8000", nil)
	nData := schedules.NewDate("Qui, 11:00 — 11:30")
	fmt.Println(nData)
}
