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

// Inicializa o turno com os dados argumentos, devolve o seu endereco.
func NovoTurno(uc *UnidadeCurricular, nome string, tipo string) *Turno {
    t := &Turno{uc: uc, nome: nome, tipo: tipo}
    t.turmas = make([]string, 0)
    t.aulas = make([]*Aula, 0)
    return t
}

// Devolve se t1 e igual a t2, utiliza o nome como criterio de comparacao.
func (t1 *Turno) Equals(t2 *Turno) bool {
    return t1.nome == t2.nome
}

// Devolve o nome do turno.
func (t *Turno) GetNome() string {
    return t.nome
}

// Acrescenta a aula ao turno t.
func (t *Turno) AddAula(aula *Aula) {
    t.aulas = append(t.aulas, aula)
}

// Devolve as aulas do turno.
func (t *Turno) GetAulas() []*Aula {
    return t.aulas
}

// Representacao em string de um turno.
func (t *Turno) String() string {
    return fmt.Sprintf("%s: %v %v", t.nome, t.turmas, t.aulas)
}
