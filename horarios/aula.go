package horarios

import (
    "fmt"
)

type Aula struct {
    turno *Turno
    data *Data
}

func NovaAula (t *Turno, d *Data) *Aula {
    return &Aula{turno: t, data: d}
}

func (a *Aula) String() string {
    return fmt.Sprintf("%v", a.data)
}
