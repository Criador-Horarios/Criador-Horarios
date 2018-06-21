package main

import (
    "fmt"
    "regexp"
    "encoding/json"
    "github.com/PuerkitoBio/goquery"
)

type UnidadeCurricular struct {
    Nome, Url string
    Turnos map[string][]*Turno
}

func main() {
    uc := NewUC("https://fenix.tecnico.ulisboa.pt/disciplinas/PO651795/2017-2018/1-semestre")
    ucJ, _ := json.Marshal(uc)
    fmt.Println(string(ucJ))
}

func NewUC(url string) *UnidadeCurricular {
    uc := UnidadeCurricular{Url: url}

    doc, _ := goquery.NewDocument(url + "/turnos")
    uc.Nome = doc.Find(".site-header").Find("a").Text()
    uc.Turnos = make(map[string][]*Turno)

    //Iterar em cada linha da tabela
    r, _ := regexp.Compile("[0-9]+([A-Z]*)[0-9]+")
    doc.Find("tbody").Find("tr").Each(func (lin int, tr *goquery.Selection) {
        //Iterar em cada coluna da tabela
        tr.Find("td").Each(func(col int, td *goquery.Selection) {
            switch col {
                //Nome
                case 0:
                    nome_turno := td.Text()
                    tipo_turno := (r.FindStringSubmatch(nome_turno))[1]
                    turno := &Turno{Nome: nome_turno, Tipo: tipo_turno}
                    if _, in := uc.Turnos[tipo_turno]; in {
                        if !inArray(uc.Turnos[tipo_turno], turno) {
                            uc.Turnos[tipo_turno] = append(uc.Turnos[tipo_turno], turno)
                        }
                    } else {
                        uc.Turnos[tipo_turno] = []*Turno{turno}
                    }
                //Data/Aulas
                case 2:

                //Turmas
                case 4:
            }
        })
    })

    return &uc
}

func inArray(turnos []*Turno, turno *Turno) bool {
    for i := 0; i < len(turnos); i++ {
        if turnos[i].Equals(turno) {
            return true
        }
    }
    return false
}
