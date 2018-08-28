package schedules

import (
	"fmt"
)

// Lesson represents a lesson.
type Lesson struct {
	shift *Shift
	Date  *Date
}

// NewLesson initializes a Lesson and returns its address.
func NewLesson(s *Shift, d *Date) *Lesson {
	return &Lesson{shift: s, Date: d}
}

// Representacao em string de uma aula.
// String representation of a Lesson.
func (l *Lesson) String() string {
	return fmt.Sprintf("%v", l.Date)
}
