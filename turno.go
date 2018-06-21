package main

type Turno struct {
    Nome string
    Tipo string
    Turmas []string
}

func (t1 *Turno) Equals(t2 *Turno) bool {
    return t1.Nome == t2.Nome
}
