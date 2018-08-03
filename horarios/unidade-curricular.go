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

// Inicializa a UC, devolvendo o seu endereco. Utiliza o goquery
// para dar scrape a pagina da unidade curricular passada pelo url
// para obter a informacao necessaria sobre a UC.
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
                turno = findOrCreateTurnoUC(uc, nomeTurno, tipoTurno)
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

// Acrescenta o turno aos turnos da uc, se o tipo de turno ainda nao 
// existir, cria uma nova slice e atribui-lhe t como o seu primeiro valor..
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

// Representacao em string de uma UC.
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

/* Pretendo ver se ha maneira de implementar um tipo de
"genericos" ou templates  nestas duas funcoes, uma vez que o codigo so funciona
para tipos muito especificos quando sao coisas relativamente simples*/

// Devolve se o turno esta dentro da slice turnos ou nao.
func inSlice(turnos []*Turno, turno *Turno) bool {
    for i := 0; i < len(turnos); i++ {
        if turnos[i].Equals(turno) {
            return true
        }
    }
    return false
}

// Devolve o endereco do turno da uc com o mesmo nome e tipo. Se nao
// encontrar, cria um novo turno e devolve o seu endereco.
func findOrCreateTurnoUC(uc *UnidadeCurricular, nome string, tipo string) *Turno {
    // Encontrar tipo no map
    if _, in := uc.turnos[tipo]; in {
        val := uc.turnos[tipo]
        // Encontrar nome na slice
        for i := 0; i < len(val); i++ {
            if val[i].GetNome() == nome {
                return val[i]
            }
        }
    }
    // Devolve um turno novo se nao encontrar
    return NovoTurno(uc, nome, tipo)
}
