package horarios

import (
	"fmt"
)

type Aula struct {
	turno *Turno
	Data  *Data
}

// Inicializa a aula com os dados argumentos, devolve o seu endereco.
func NovaAula(t *Turno, d *Data) *Aula {
	return &Aula{turno: t, Data: d}
}

// Devolve True se a1 sobrepoe a2. False caso contrario.
func (a *Aula) Sobrepoe(a2 *Aula) bool {
	return a.Data.Sobrepoe(a2.Data)
}

// Representacao em string de uma aula.
func (a *Aula) String() string {
	return fmt.Sprintf("%v", a.Data)
}
