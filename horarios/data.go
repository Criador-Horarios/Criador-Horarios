package horarios

import (
	"fmt"
	"strconv"
)

// Dias da semana
const DIASSEMANA = 7
const DIASUTEIS = 6

var DiasPt = [...]string{"Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"}
var DiasEn = [...]string{"Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"}

// HH:MM
const TEMPOINICIO = 8
const MININTERVALO = 30
const HORA = 60

type Hora struct {
	hora, minuto int
	val          int
}

type Tempo struct {
	inicio, fim int
}

type Data struct {
	diaStr string
	dia    int
	tempo  Tempo
	// inicio *Hora
	// fim    *Hora
}

// Inicializa a data, devolve o seu endereco.
func NovaData(dataStr string) *Data {
	data := &Data{}
	data.dia = DiaStrParaInt(dataStr[0:3])
	data.diaStr = DiaParaStr(data.dia)
	data.tempo = NovoTempo(dataStr[5:10], dataStr[15:20])
	// data.inicio = NovaHora(dataStr[5:10])
	// data.fim = NovaHora(dataStr[15:20])
	return data
}

// Devolve a representacao em int de um dia em string.
func DiaStrParaInt(s string) int {
	for i := 0; i < DIASSEMANA; i++ {
		if DiasPt[i] == s || DiasEn[i] == s {
			return i
		}
	}
	return DIASSEMANA
}

// Devolve um dia como inteiro respetivo a string.
func DiaParaStr(d int) string {
	return DiasPt[d]
}

// Inicializa a hora com os dados obtidos da pagina da UC.
func NovaHora(s string) *Hora {
	h := &Hora{}
	h.hora, _ = strconv.Atoi(s[0:2])
	h.minuto, _ = strconv.Atoi(s[3:5])
	h.val = horaInt(h)
	return h
}

func NovoTempo(inicio string, fim string) Tempo {
	t := Tempo{}
	horaInicio, _ := strconv.Atoi(inicio[0:2])
	minutoInicio, _ := strconv.Atoi(inicio[3:5])
	t.inicio = tempoInt(horaInicio, minutoInicio)
	horaFim, _ := strconv.Atoi(fim[0:2])
	minutoFim, _ := strconv.Atoi(fim[3:5])
	t.fim = tempoInt(horaFim, minutoFim) - 1
	return t
}

// Devolve True se d1 sobrepoe d2. False caso contrario.
func (d1 *Data) Sobrepoe(d2 *Data) bool {
	return (d1.dia == d2.dia ||
		(d1.fim.val >= d2.inicio.val) ||
		(d1.inicio.val <= d2.fim.val))
}

// Representacao em string de uma data.
func (d *Data) String() string {
	return fmt.Sprintf("%d, %v", d.dia, d.tempo)
}

// Representacao em string de uma hora.
func (h *Hora) String() string {
	return fmt.Sprintf("%02d:%02d - %d", h.hora, h.minuto, h.val)
}

func (t Tempo) String() string {
	return fmt.Sprintf("%d-%d", t.inicio, t.fim)
}

func tempoInt(hora int, minuto int) int {
	return (hora-TEMPOINICIO)*(HORA/MININTERVALO) + (minuto / MININTERVALO)
}

// Devolve uma hora como um inteiro (8:00-8:30 = 0, 8:30-9:00 = 1, etc.,
// para TEMPOINICIO = 8 e MININTERVALO = 30)
func horaInt(h *Hora) int {
	return (h.hora-TEMPOINICIO)*(HORA/MININTERVALO) + (h.minuto / MININTERVALO)
}
