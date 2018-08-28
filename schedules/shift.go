package schedules

import (
	"fmt"
)

// Shift represents a shift.
type Shift struct {
	cu      *CurricularUnit
	Name    string
	Type    string
	Classes []string
	Lessons []*Lesson
}

// NewShift initializes a Shift and returns its adress.
func NewShift(cu *CurricularUnit, name string, sType string) *Shift {
	s := &Shift{cu: cu, Name: name, Type: sType}
	s.Classes = make([]string, 0)
	s.Lessons = make([]*Lesson, 0)
	return s
}

// Equals returns whether s is equal to s2, using the name as criteria.
func (s *Shift) Equals(s2 *Shift) bool {
	return s.Name == s2.Name
}

// GetName returns the name of the shift.
func (s *Shift) GetName() string {
	return s.Name
}

// GetType returns the type of shift.
func (s *Shift) GetType() string {
	return s.Type
}

// AddLesson appends a class to the shift.
func (s *Shift) AddLesson(lesson *Lesson) {
	s.Lessons = append(s.Lessons, lesson)
}

// GetLessons returns the lessons of the shift.
func (s *Shift) GetLessons() []*Lesson {
	return s.Lessons
}

// String representation of a Shift.
func (s *Shift) String() string {
	return fmt.Sprintf("%s: %v %v", s.Name, s.Classes, s.Lessons)
}
