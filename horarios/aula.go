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

// Devolve True se a1 sobrepoe a2. False caso contrario.
func (a1 *Aula) Sobrepoe(a2 *Aula) bool {
    return a1.data.Sobrepoe(a2.data)
}

// Representacao em string de uma aula.
func (a *Aula) String() string {
    return fmt.Sprintf("%v", a.data)
}
