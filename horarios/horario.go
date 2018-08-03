package horarios

import (
    "fmt"
)

type Horario struct {
    aulas map[string][]*Aula
    turnos []*Turno
}

// Inicializa o horario vazio e devolve o seu endereco.
func NovoHorario() *Horario {
    h := &Horario{}
    h.turnos = make([]*Turno, 0)
    h.aulas = make(map[string][]*Aula)
    for i := 0; i < DIASUTEIS; i++ {
        h.aulas[DiasPt[i]] = make([]*Aula, 0)
    }
    return h
}

// Acrescente o turno t ao horario h.
func (h *Horario) AddTurno(t *Turno) {
    h.turnos = append(h.turnos, t)
}

func (h *Horario) String() string {
    return fmt.Sprintf("lol")
}
