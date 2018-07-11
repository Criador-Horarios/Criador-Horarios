package horarios

import (
    "fmt"
)

type Aula struct {
    turno *Turno
    data *Data
}

// Inicializa a aula com os dados argumentos, devolve o seu endereco.
func NovaAula (t *Turno, d *Data) *Aula {
    return &Aula{turno: t, data: d}
}

// Representacao em string de uma aula.
func (a *Aula) String() string {
    return fmt.Sprintf("%v", a.data)
}
