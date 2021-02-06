import React from 'react';
import API from '../../utils/api';
import { Course, CourseUpdates, CourseUpdateType, Shift, Update } from '../../utils/domain';
import styles from './Schedule.module.scss';
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'

class Schedule extends React.PureComponent <{
  selectedCourses: CourseUpdates
}, any>{
  calendarComponentRef:React.RefObject<any> = React.createRef();
  state = {
    shifts: [] as Shift[],
    events: []
  }
  hasGoneToStart = false

  async componentDidUpdate(prevProps: any): Promise<void> {
    if (prevProps.selectedCourses === this.props.selectedCourses || !this.props.selectedCourses.lastUpdate) return

    let shifts: Shift[] = this.state.shifts;
    let update: Update = this.props.selectedCourses.lastUpdate 
    // If a new course added, add to the list and fetch its schedule
    if (update.type === CourseUpdateType.Add) {
      try {
        await Promise.all([update.course].map(async (course: Course) => {
          let currShifts = await API.getCourseSchedules(course.id);
          shifts = shifts.concat(currShifts)
        }));
      } catch (err) {
        console.log(err)
      }
    // If a course is removed, remove its shifts
    } else {
      let courseAcronym = update.course.acronym
      shifts = shifts.filter( (s: Shift) => {
        return !s.name.startsWith(courseAcronym)
      })
    }

    // FIXME: verify if shifts correspond to select courses, as it bugs out and keeps unselected ones

    if (shifts.length === 0) {
      this.setState({ shifts })
    } else {
      // Check if in the right day for the shifts
      if (!this.hasGoneToStart) {
        let firstSunday = this.getFirstSunday(shifts[0].start)
        let calendarApi = this.calendarComponentRef.current.getApi()
        calendarApi.gotoDate(firstSunday)
        this.hasGoneToStart = true
      }

      // Get events from current shifts
      // FIXME: Maybe convert when getting the shifts?
      let events = shifts.map( (s: Shift) => s.toEvent())

      this.setState({ 
        shifts,
        events
      })
    }
  }

  render() {
    return (
      <div className={styles.Schedule}>
        <ul>
          {this.props.selectedCourses?.courses.map((d: Course) => {
            // FIXME: Check if selected to add class selected
            return <li className={"clickable"} key={d.id} onClick={() => console.log(d)}>{d.name}</li> 
          })}
        </ul>
        <ul>
          {this.state.shifts?.map((s: Shift) => {
            // FIXME: Check if selected to add class selected
            return <li className={"clickable"} key={s.name} onClick={() => console.log(s)}>{s.displayName()}</li> 
          })}
        </ul>
        <div className={styles.ScheduleGrid}>
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
            slotMinTime={"07:00:00"}
            slotMaxTime={"21:00:00"}
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
            ref={this.calendarComponentRef}
            // TODO: Add listen to clicks on shifts to add to own schedule
          />
        </div>
      </div>
    );
  }

  getFirstSunday(date: any): Date {
    let today = new Date(date);
    return new Date(today.setDate(today.getDate() - (today.getDay()||7)));
  }
}

export default Schedule;
