package schedules

import (
	"fmt"
)

// WEEKDAYS number of days in a week.
const WEEKDAYS = 7

// WORKDAYS number of days that can have lessons.
const WORKDAYS = 6

// DaysEN array with the name of the weekdays starting at monday (english).
var DaysEN = [...]string{"Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"}

// DaysPT array with the name of the weekdays starting at monday (portuguese).
var DaysPT = [...]string{"Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"}

// Lesson represents a lesson. Has its shift, weekday in string/int, and starting and ending time.
type Lesson struct {
	shift  *Shift
	dayStr string
	DayInt int    `json:"day"`
	Start  string `json:"start"`
	End    string `json:"end"`
}

// NewLesson initializes a Lesson and returns its address.
func NewLesson(s *Shift, dateStr string) *Lesson {
	l := &Lesson{shift: s}
	l.DayInt = DayStrToInt(dateStr[0:3])
	l.dayStr = DayIntToStr(l.DayInt)
	l.Start = dateStr[5:10]
	l.End = dateStr[15:20]
	return l
}

// DayStrToInt returns the numerical representation of a weekday (Seg -> 0, Ter -> 1, etc.).
func DayStrToInt(s string) int {
	for i := 0; i < WEEKDAYS; i++ {
		if DaysPT[i] == s || DaysEN[i] == s {
			return i
		}
	}
	return WEEKDAYS
}

// DayIntToStr returns the corresponding string to a numerical day (0 -> Seg, 1 -> Ter, etc.).
func DayIntToStr(d int) string {
	return DaysPT[d]
}

// Representacao em string de uma aula.
// String representation of a Lesson.
func (l *Lesson) String() string {
	return fmt.Sprintf("%s, %s - %s", l.dayStr, l.Start, l.End)
}
