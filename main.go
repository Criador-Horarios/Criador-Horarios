package main

import (
    "fmt"
    "net/http"
    "./horarios"
)

func indexHandler(w http.ResponseWriter, r *http.Request) {
    http.Redirect(w, r, "/Criador-Horarios", 301)
}

func horariosHandler(w http.ResponseWriter, r *http.Request) {
    ucs := make([]*horarios.UnidadeCurricular, 0)
    url := "https://fenix.tecnico.ulisboa.pt/disciplinas/FP4517957/2018-2019/1-semestre/pagina-inicial"
    ucs = append(ucs, horarios.NovaUC(url))
    fmt.Fprintf(w, "<h1>Simulador de Criador de Horarios</h1>")
    fmt.Fprintf(w, "<p>%v</p>", ucs[0])
}

func main() {
    http.HandleFunc("/", indexHandler)
    http.HandleFunc("/Criador-Horarios", horariosHandler)
    http.ListenAndServe(":8000", nil)
}
