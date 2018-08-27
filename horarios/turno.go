package horarios

import (
	"fmt"
)

type Turno struct {
	uc     *UnidadeCurricular
	Nome   string
	Tipo   string
	Turmas []string
	Aulas  []*Aula
}

// Inicializa o turno com os dados argumentos, devolve o seu endereco.
func NovoTurno(uc *UnidadeCurricular, nome string, tipo string) *Turno {
	t := &Turno{uc: uc, Nome: nome, Tipo: tipo}
	t.Turmas = make([]string, 0)
	t.Aulas = make([]*Aula, 0)
	return t
}

// Devolve se t1 e igual a t2, utiliza o nome como criterio de comparacao.
func (t *Turno) Equals(t2 *Turno) bool {
	return t.Nome == t2.Nome
}

// Devolve o nome do turno.
func (t *Turno) GetNome() string {
	return t.Nome
}

// Devolve o tipo do turno.
func (t *Turno) GetTipo() string {
	return t.Tipo
}

// Acrescenta a aula ao turno t.
func (t *Turno) AddAula(aula *Aula) {
	t.Aulas = append(t.Aulas, aula)
}

// Devolve as aulas do turno.
func (t *Turno) GetAulas() []*Aula {
	return t.Aulas
}

// Representacao em string de um turno.
func (t *Turno) String() string {
	return fmt.Sprintf("%s: %v %v", t.Nome, t.Turmas, t.Aulas)
}
