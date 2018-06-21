package main

import (
    "fmt"
    "strings"
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
    regTurnos, _ := regexp.Compile("\\d+([A-Z]*)\\d+")
    doc.Find("tbody").Find("tr").Each(func (lin int, tr *goquery.Selection) {
        var nomeTurno string
        var tipoTurno string
        var turno *Turno
        //Iterar em cada coluna da tabela
        tr.Find("td").Each(func(col int, td *goquery.Selection) {
            switch col {
                //Nome
                case 0:
                    nomeTurno = td.Text()
                    tipoTurno = (regTurnos.FindStringSubmatch(nomeTurno))[1]
                    turno = &Turno{Nome: nomeTurno, Tipo: tipoTurno}
                    if _, in := uc.Turnos[tipoTurno]; in {
                        if !inArray(uc.Turnos[tipoTurno], turno) {
                            uc.Turnos[tipoTurno] = append(uc.Turnos[tipoTurno], turno)
                        }
                    } else {
                        uc.Turnos[tipoTurno] = []*Turno{turno}
                    }
                //Data
                case 2:

                //Turmas
                case 4:
                    if len(turno.Turmas) == 0 {
                        turno.Turmas = strings.Fields(td.Text())
                    }
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
