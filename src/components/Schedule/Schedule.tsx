import React from 'react';
import API from '../../utils/api';
import { CourseUpdates, CourseUpdateType, Shift, Update, Lesson } from '../../utils/domain';
import styles from './Schedule.module.scss';
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import Comparables from '../../utils/comparables';

class Schedule extends React.PureComponent <{
  selectedCourses: CourseUpdates,
  onSelectedShift: Function
}, any>{
  calendarComponentRef:React.RefObject<any> = React.createRef();
  state = {
    events: [] as Lesson[]
  }
  shifts: Shift[] = []
  selectedShifts: Shift[] = []

  async componentDidUpdate(prevProps: any): Promise<void> {
    if (prevProps.selectedCourses === this.props.selectedCourses || !this.props.selectedCourses.lastUpdate) {
      return
    }

    this.setState({
      events: await this.updateShifts(this.props.selectedCourses.lastUpdate)
    })    
  }

  async updateShifts(update: Update): Promise<Lesson[]> {
    // Verify if cleared
    if (update.course === undefined || update.type === CourseUpdateType.Clear) {
      return []
    }

    let events: Lesson[] = []
    // If a new course added, add to the list and fetch its schedule
    if (update.type === CourseUpdateType.Add) {
      try {
        let currShifts: Shift[] = await API.getCourseSchedules(update.course)
        // When double clicking a course very fast, it stays and lets a duplicate remain -> verify if removed and return current
        if (!Comparables.includes(this.props.selectedCourses.courses, update.course) || 
          (this.props.selectedCourses.lastUpdate?.course === update.course && 
            this.props.selectedCourses.lastUpdate?.type === CourseUpdateType.Remove) ) return this.state.events

        this.shifts = this.shifts.concat(currShifts)
        // Get events from current shifts
        events = this.state.events.concat(currShifts.map((s: Shift) => s.lessons).flat())
      } catch (err) {
        console.log(err)
      }
    } else {
      // If a course is removed, remove its shifts and the events
      let courseAcronym = update.course.acronym
      this.shifts = this.shifts.filter( (s: Shift) => {
        return !s.name.includes(courseAcronym)
      })

      events = this.state.events.filter( (e: Lesson) => {
        return !e.title.includes(courseAcronym)
      })
    }
    
    return events
  }

  onSelectedShift(shiftName: string): void {
    let shiftsFound = this.shifts.filter( (s) => {
      return s.name === shiftName
    })
    if (shiftsFound.length === 1) {
      let chosenShift = shiftsFound[0]

      // Verify if of the same type and course to replace, but not the same
      let replacingIndex = Comparables.indexOfFunc(this.selectedShifts, chosenShift, Shift.isSameCourseAndType)

      // Verify if shift is already selected and unselect
      let index = Comparables.indexOf(this.selectedShifts, chosenShift)
      if (index === -1) {
        this.selectedShifts.push(chosenShift)
        if (replacingIndex !== -1) {
          this.selectedShifts.splice(replacingIndex, 1)  
        }
      } else {
        this.selectedShifts.splice(index, 1)
      }

      this.props.onSelectedShift(this.selectedShifts)
    }
  }

  render() {
    return (
      <div className={styles.Schedule}>
        <FullCalendar
          plugins={[ timeGridPlugin ]}
          initialView="timeGridWeek"
          allDaySlot={false}
          weekends={false}
          headerToolbar={false}
          nowIndicator={false}
          dayHeaderFormat={{
            month: undefined,
            year: undefined,
            day: undefined,
            weekday: 'long'
          }}
          slotMinTime={"08:00:00"}
          slotMaxTime={"20:00:00"}
          slotLabelFormat={{
            hour: '2-digit',
            minute: '2-digit',
            omitZeroMinute: false,
            meridiem: undefined,
            hour12: false
          }}
          slotEventOverlap={false}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            omitZeroMinute: false,
            meridiem: undefined,
            hour12: false
          }}
          expandRows={false}
          height={"auto"}
          contentHeight={"auto"}
          events={this.state.events}
          eventClick={(info) => this.onSelectedShift(info.event.id)}
          ref={this.calendarComponentRef}
          locale="pt"
        />
      </div>
    );
  }

  getFirstSunday(date: any): Date {
    let today = new Date(date);
    return new Date(today.setDate(today.getDate() - (today.getDay()||7)));
  }
}

export default Schedule;
