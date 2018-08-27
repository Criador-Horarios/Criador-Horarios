package horarios

import (
	"fmt"
	"regexp"
	"strings"

	"github.com/PuerkitoBio/goquery"
)

type UnidadeCurricular struct {
	Nome   string
	url    string
	Turnos map[string][]*Turno
}

// Inicializa a UC, devolvendo o seu endereco. Utiliza o goquery
// para dar scrape a pagina da unidade curricular passada pelo url
// para obter a informacao necessaria sobre a UC.
func NovaUC(url string) *UnidadeCurricular {
	regURL, _ := regexp.Compile(".*-semestre")
	absURL := regURL.FindString(url)
	uc := &UnidadeCurricular{url: absURL}

	doc, _ := goquery.NewDocument(absURL + "/turnos")
	uc.Nome = doc.Find(".site-header").Find("a").Text()
	uc.Turnos = make(map[string][]*Turno)

	//Iterar em cada linha da tabela
	regTurnos, _ := regexp.Compile("\\d+([A-Z]*)\\d+")
	doc.Find("tbody").Find("tr").Each(func(lin int, tr *goquery.Selection) {
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
				if len(turno.Turmas) == 0 {
					turno.Turmas = strings.Fields(td.Text())
				}
			}
		})
	})

	return uc
}

// Acrescenta o turno aos turnos da uc, se o tipo de turno ainda nao
// existir, cria uma nova slice e atribui-lhe t como o seu primeiro valor..
func (uc *UnidadeCurricular) AddTurno(t *Turno) {
	if _, in := uc.Turnos[t.GetTipo()]; in {
		if !turnoRepetido(uc.Turnos[t.GetTipo()], t) {
			uc.Turnos[t.GetTipo()] = append(uc.Turnos[t.GetTipo()], t)
		}
	} else {
		uc.Turnos[t.GetTipo()] = make([]*Turno, 1)
		uc.Turnos[t.GetTipo()][0] = t
	}
}

// Representacao em string de uma UC.
func (uc *UnidadeCurricular) String() string {
	str := fmt.Sprintf("%s: %s\n", uc.Nome, uc.url)
	for tipoTurno, turnos := range uc.Turnos {
		str += fmt.Sprintf("%s:\n", tipoTurno)
		for _, turno := range turnos {
			str += fmt.Sprintf("%v\n", turno)
		}
	}
	return str
}

// Devolve se ha um turno semelhante dentro da slice turnos ou nao.
func turnoRepetido(turnos []*Turno, turno *Turno) bool {
	for _, t := range turnos {
		if t.Equals(turno) {
			return true
		}
	}
	return false
}

// Devolve o endereco do turno da uc com o mesmo nome e tipo.
// Se nao encontrar, cria um novo turno e devolve o seu endereco.
func findOrCreateTurnoUC(uc *UnidadeCurricular, nome string, tipo string) *Turno {
	// Encontrar tipo no map
	if _, in := uc.Turnos[tipo]; in {
		val := uc.Turnos[tipo]
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
