package schedules

import (
	"fmt"
	"regexp"
	"strings"

	"github.com/PuerkitoBio/goquery"
)

// CurricularUnit represents a Curricular Unit(CU).
type CurricularUnit struct {
	Name   string `json:"name"`
	url    string
	Shifts map[string][]*Shift `json:"shifts"`
}

// NewCU initializes a CU, returning its address. Utilizes goquery
// to scrape the CU page's relevant information.
func NewCU(url string) *CurricularUnit {
	regURL, compileErr := regexp.Compile(".*-semestre")
	absURL := regURL.FindString(url)
	doc, docErr := goquery.NewDocument(absURL + "/turnos")
	if compileErr != nil || docErr != nil || absURL == "" {
		fmt.Println("Invalid link or unexpected error.")
		return nil
	}

	cu := &CurricularUnit{url: absURL}
	cu.Name = doc.Find(".site-header").Find("a").Text()
	cu.Shifts = make(map[string][]*Shift)

	// Iterate over each line of the table
	regShifts, _ := regexp.Compile("\\d+([A-Z]*)\\d+")
	doc.Find("tbody").Find("tr").Each(func(lin int, tr *goquery.Selection) {
		var shiftName string
		var shiftType string
		var shift *Shift
		// Iterate over each column
		tr.Find("td").Each(func(col int, td *goquery.Selection) {
			switch col {
			// Name
			case 0:
				shiftName = td.Text()
				shiftType = (regShifts.FindStringSubmatch(shiftName))[1]
				shift = findOrCreateShiftCU(cu, shiftName, shiftType)
				cu.AddShift(shift)
			// Date
			case 2:
				shift.AddLesson(NewLesson(shift, td.Text()))
			// Classes
			case 4:
				if len(shift.Classes) == 0 {
					shift.Classes = strings.Fields(td.Text())
				}
			}
		})
	})

	return cu
}

// AddShift adds a shift to the CU if it is not registered yet.
func (cu *CurricularUnit) AddShift(s *Shift) {
	// Check if the type of shift is in the map.
	if _, in := cu.Shifts[s.GetType()]; in {
		if !repeatedShift(cu.Shifts[s.GetType()], s) {
			cu.Shifts[s.GetType()] = append(cu.Shifts[s.GetType()], s)
		}
	} else {
		cu.Shifts[s.GetType()] = []*Shift{s}
	}
}

// String representation of a CU.
func (cu *CurricularUnit) String() string {
	str := fmt.Sprintf("%s: %s\n", cu.Name, cu.url)
	for shiftType, turnos := range cu.Shifts {
		str += fmt.Sprintf("%s:\n", shiftType)
		for _, shift := range turnos {
			str += fmt.Sprintf("%v\n", shift)
		}
	}
	return str
}

// repeatedShift returns whether the turn is already in the shifts slice.
func repeatedShift(shifts []*Shift, shift *Shift) bool {
	for _, s := range shifts {
		if s.Equals(shift) {
			return true
		}
	}
	return false
}

// findOrCreateShiftCU returns a pointer to the shift with name "name" inside
// of the CU. If it doesn't exist, it creates and returns a new one.
func findOrCreateShiftCU(cu *CurricularUnit, name string, sType string) *Shift {
	// Find type in map
	if _, in := cu.Shifts[sType]; in {
		typeSlice := cu.Shifts[sType]
		// Find shift in the slice
		for _, s := range typeSlice {
			if s.GetName() == name {
				return s
			}
		}
	}
	// Return a new shift if nothing was found
	return NewShift(cu, name, sType)
}
