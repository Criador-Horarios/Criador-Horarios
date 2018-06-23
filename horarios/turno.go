package horarios

import (
    "fmt"
)

type Turno struct {
    uc *UnidadeCurricular
    nome string
    tipo string
    turmas []string
    aulas []*Aula
}

func NovoTurno(uc *UnidadeCurricular, nome string, tipo string) *Turno {
    t := &Turno{uc: uc, nome: nome, tipo: tipo}
    t.turmas = make([]string, 0)
    t.aulas = make([]*Aula, 0)
    return t
}

func (t1 *Turno) Equals(t2 *Turno) bool {
    return t1.nome == t2.nome
}

func (t *Turno) getNome() string {
    return t.nome
}

func (t *Turno) AddAula(aula *Aula) {
    t.aulas = append(t.aulas, aula)
}

func (t *Turno) String() string {
    return fmt.Sprintf("%s: %v %v", t.nome, t.turmas, t.aulas)
}
