package schedules

import (
	"fmt"
	"strconv"
)

// WEEKDAYS number of days in a week.
const WEEKDAYS = 7

// WORKDAYS number of days that can have lessons.
const WORKDAYS = 6

// DaysEN array with the name of the weekdays starting at monday (english).
var DaysEN = [...]string{"Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"}

// DaysPT array with the name of the weekdays starting at monday (portuguese).
var DaysPT = [...]string{"Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"}

// BLOCKINTERVAL the interval in minutes between each block.
const BLOCKINTERVAL = 30

// HOUR minutes whithin an hour.
const HOUR = 60

// Date represents a date. A Date has a weekday and a period of hours.
type Date struct {
	dayStr string
	dayInt int
	start  *Hour
	end    *Hour
}

// Hour represents an hour (HH:MM).
type Hour struct {
	hour, minute int
}

// NewDate initializes a date with a string similar to "Seg, 11:00 — 12:30" and returns its address.
func NewDate(dateStr string) *Date {
	date := &Date{}
	date.dayInt = DayStrToInt(dateStr[0:3])
	date.dayStr = DayIntToStr(date.dayInt)
	date.start = NewHour(dateStr[5:10])
	date.end = NewHour(dateStr[15:20])
	return date
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

// NewHour initializes an Hour from a "HH:MM" string and returns its address.
func NewHour(s string) *Hour {
	h := &Hour{}
	h.hour, _ = strconv.Atoi(s[0:2])
	h.minute, _ = strconv.Atoi(s[3:5])
	return h
}

// String representation of a Date.
func (d *Date) String() string {
	return fmt.Sprintf("%s, %v - %v", d.dayStr, d.start, d.end)
}

// String representation of an Hour.
func (h *Hour) String() string {
	return fmt.Sprintf("%02d:%02d", h.hour, h.minute)
}
