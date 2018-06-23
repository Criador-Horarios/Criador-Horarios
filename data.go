package main

import (
    "fmt"
    "strconv"
)

// Dias da semana
const DIASSEMANA = 7

var diasPt = [...]string{"Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"}
var diasEn = [...]string{"Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"}

// HH:MM
type Hora struct {
    hora, minuto int
}

type Data struct {
    diaStr string
    dia int
    inicio, fim *Hora
}

func NovaData(dataStr string) *Data {
    data := &Data{}
    data.dia = DiaStrParaInt(dataStr[0:3])
    data.diaStr = DiaParaStr(data.dia)
    data.inicio = NovaHora(dataStr[5:10])
    data.fim = NovaHora(dataStr[15:20])
    return data
}

func DiaStrParaInt(s string) int {
    for i := 0; i < DIASSEMANA ; i++ {
        if diasPt[i] == s || diasEn[i] == s {
            return i
        }
    }
    return DIASSEMANA
}

func DiaParaStr(d int) string {
    return diasPt[d]
}

func NovaHora(s string) *Hora {
    h := &Hora{}
    h.hora, _ = strconv.Atoi(s[0:2])
    h.minuto, _ = strconv.Atoi(s[3:5])
    return h
}

func (d *Data) String() string {
    return fmt.Sprintf("%s, %v - %v", d.diaStr, d.inicio, d.fim)
}

func (h *Hora) String() string {
    return fmt.Sprintf("%02d:%02d", h.hora, h.minuto)
}

// Devolve uma hora como um inteiro (8:00 = 0, 8:30 = 1, 9:00 = 2, etc.)
func horaInt(h *Hora) int {
    return (h.hora - 8)*2 + (h.minuto/30)
}
