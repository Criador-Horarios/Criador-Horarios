package main

import (
    "fmt"
    "net/http"
    "./horarios"
)

var uc *horarios.UnidadeCurricular

func indexHandler(w http.ResponseWriter, r *http.Request) {
    http.Redirect(w, r, "/Criador-Horarios", 301)
}

func horariosHandler(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "<p>%v</p>", uc)
}

func main() {
    uc = horarios.NovaUC("https://fenix.tecnico.ulisboa.pt/disciplinas/FP4517957/2018-2019/1-semestre/pagina-inicial")
    http.HandleFunc("/", indexHandler)
    http.HandleFunc("/Criador-Horarios", horariosHandler)
    http.ListenAndServe(":8000", nil)
}
