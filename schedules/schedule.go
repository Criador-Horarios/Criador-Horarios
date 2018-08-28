package schedules

import (
	"fmt"
)

// Schedule represents a schedule. Has shifts and their respective lessons.
type Schedule struct {
	lessons map[string][]*Lesson
	shifts  []*Shift
}

// NewSchedule initializes a schedule and returns its address.
func NewSchedule() *Schedule {
	sc := &Schedule{}
	sc.shifts = make([]*Shift, 0)
	sc.lessons = make(map[string][]*Lesson)
	for d := 0; d < WORKDAYS; d++ {
		sc.lessons[DaysPT[d]] = make([]*Lesson, 0)
	}
	return sc
}

// AddShift appends a shift to the schedule.
func (sc *Schedule) AddShift(s *Shift) {
	sc.shifts = append(sc.shifts, s)
}

// String representation of a schedule.
func (sc *Schedule) String() string {
	return fmt.Sprintf("lol")
}
