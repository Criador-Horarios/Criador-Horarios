package main

import (
	"encoding/json"
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
	fp := schedules.NewCU(url)
	cus = append(cus, fp)
	fmt.Fprintf(w, "<h1>Simulador de Criador de Horarios</h1>")
	fmt.Fprintf(w, "<p>%v</p>", cus[0])
}

func main() {
	fp := schedules.NewCU("https://fenix.tecnico.ulisboa.pt/disciplinas/FP4517957/2018-2019/1-semestre/pagina-inicial")
	fpJSON, _ := json.MarshalIndent(fp, "", "    ")
	fmt.Println(string(fpJSON))
	http.HandleFunc("/", indexHandler)
	http.HandleFunc("/Criador-Horarios", schedulesHandler)
	http.ListenAndServe(":8000", nil)
}
