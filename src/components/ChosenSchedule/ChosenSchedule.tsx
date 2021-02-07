import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid'
import React from 'react';
import { Lesson, Shift } from '../../utils/domain';
import styles from './ChosenSchedule.module.scss';

class ChosenSchedule extends React.PureComponent <{
  selectedShifts: Shift[]
  onRemovedShift: Function
}, any> {
  calendarComponentRef:React.RefObject<any> = React.createRef();
  state = {
    events: [] as Lesson[]
  }

  componentDidUpdate(prevProps: any) {
    if (prevProps.selectedShifts === this.props.selectedShifts) return
    // FIXME: Always replacing? hmmmm
    let currLessons = this.props.selectedShifts.map((s: Shift) => s.lessons).flat()
    this.setState({
      events: currLessons
    })  
  }

  onSelectedShift(shiftName: string): void {
    this.props.onRemovedShift(shiftName)
  }

  render() {
    return (
      <div className={styles.ChosenSchedule}>
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
}

export default ChosenSchedule;
