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
    val int
}

type Data struct {
    diaStr string
    dia int
    inicio *Hora
    fim *Hora
}

// Inicializa a data, devolve o seu endereco.
func NovaData(dataStr string) *Data {
    data := &Data{}
    data.dia = DiaStrParaInt(dataStr[0:3])
    data.diaStr = DiaParaStr(data.dia)
    data.inicio = NovaHora(dataStr[5:10])
    data.fim = NovaHora(dataStr[15:20])
    return data
}

// Devolve a representacao em int de um dia em string.
func DiaStrParaInt(s string) int {
    for i := 0; i < DIASSEMANA ; i++ {
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

// Devolve True se d1 sobrepoe d2. False caso contrario.
func (d1 *Data) Sobrepoe(d2 *Data) bool {
    return (d1.dia == d2.dia ||
           (d1.fim.val > d2.inicio.val) ||
           (d1.inicio.val < d2.fim.val))
}

// Representacao em string de uma data.
func (d *Data) String() string {
    return fmt.Sprintf("%s, %v-%v", d.diaStr, d.inicio, d.fim)
}

// Representacao em string de uma hora.
func (h *Hora) String() string {
    return fmt.Sprintf("%02d:%02d", h.hora, h.minuto)
}

// Devolve uma hora como um inteiro (8:00 = 0, 8:30 = 1, 9:00 = 2, etc.,
// para TEMPOINICIO = 8 e MININTERVALO = 30)
func horaInt(h *Hora) int {
    return (h.hora - TEMPOINICIO)*(HORA/MININTERVALO) + (h.minuto/MININTERVALO)
}
