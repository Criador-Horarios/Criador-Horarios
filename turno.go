package main

type Turno struct {
    Nome string
    Tipo string
    Aulas []*Aula
}

func (t1 *Turno) Equals(t2 *Turno) bool {
    return t1.Nome == t2.Nome
}

func (t *Turno) addAula(
