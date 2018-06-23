package horarios

import (
    "fmt"
    "strings"
    "regexp"
    "github.com/PuerkitoBio/goquery"
)

type UnidadeCurricular struct {
    nome, url string
    turnos map[string][]*Turno
}

func NovaUC(url string) *UnidadeCurricular {
    regUrl, _ := regexp.Compile(".*-semestre")
    absUrl := regUrl.FindString(url)
    uc := &UnidadeCurricular{url: absUrl}

    doc, _ := goquery.NewDocument(absUrl + "/turnos")
    uc.nome = doc.Find(".site-header").Find("a").Text()
    uc.turnos = make(map[string][]*Turno)

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
                turno = findTurnoUC(uc, nomeTurno, tipoTurno)
                uc.AddTurno(turno)
            //Data
            case 2:
                data := NovaData(td.Text())
                turno.AddAula(NovaAula(turno, data))
            //Turmas
            case 4:
                if len(turno.turmas) == 0 {
                    turno.turmas = strings.Fields(td.Text())
                }
            }
        })
    })

    return uc
}

func (uc *UnidadeCurricular) AddTurno(t *Turno) {
    if _, in := uc.turnos[t.tipo]; in {
        if !inSlice(uc.turnos[t.tipo], t) {
            uc.turnos[t.tipo] = append(uc.turnos[t.tipo], t)
        }
    } else {
        uc.turnos[t.tipo] = make([]*Turno, 1)
        uc.turnos[t.tipo][0] = t
    }
}

func (uc *UnidadeCurricular) String() string {
    str := fmt.Sprintf("%s: %s\n", uc.nome, uc.url)
    for key, value := range uc.turnos {
        str += fmt.Sprintf("%s:\n", key)
        for i := 0; i < len(value); i++ {
            str += fmt.Sprintf("%v\n", value[i])
        }
    }
    return str
}

func inSlice(turnos []*Turno, turno *Turno) bool {
    for i := 0; i < len(turnos); i++ {
        if turnos[i].Equals(turno) {
            return true
        }
    }
    return false
}

// Devolve o endereco turno da uc com o mesmo nome e tipo. Se nao
// encontrar, cria um novo turno e devolve o seu endereco.
func findTurnoUC(uc *UnidadeCurricular, nome string, tipo string) *Turno {
    // Encontrar tipo no map
    if _, in := uc.turnos[tipo]; in {
        val := uc.turnos[tipo]
        // Encontrar nome na slice
        for i := 0; i < len(val); i++ {
            if val[i].getNome() == nome {
                return val[i]
            }
        }
    }
    // Devolve um turno novo se nao encontrar
    return NovoTurno(uc, nome, tipo)
}
