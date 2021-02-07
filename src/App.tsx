import React, { ReactNode } from 'react';
import API from './utils/api';
import './App.scss';
import Schedule from './components/Schedule/Schedule';
import { Course, CourseUpdates, CourseUpdateType, Degree, Shift } from './utils/domain';
import Chip from '@material-ui/core/Chip';
import Autocomplete, { createFilterOptions } from '@material-ui/lab/Autocomplete';
import IconButton from '@material-ui/core/IconButton'
import Tooltip from '@material-ui/core/Tooltip'
import Toolbar from '@material-ui/core/Toolbar'
import Alert from '@material-ui/lab/Alert'
import AppBar from '@material-ui/core/AppBar'
import TextField from '@material-ui/core/TextField';
import Icon from '@material-ui/core/Icon'
import ChosenSchedule from './components/ChosenSchedule/ChosenSchedule';
import Comparables from './utils/comparables';

class App extends React.PureComponent {

  // TODO: Allow english or other languages
  // TODO: Add filters for L, T and PB  
  state = {
    selectedCourses: new CourseUpdates(),
    courses: [] as Course[],
    selectedShifts: [] as Shift[]
  }
  selectedDegree: Degree | null = null
  storedState: string = ''
  degrees: Degree[] = []
  initialSchedule: React.RefObject<any> = React.createRef();

  constructor(props: any) {
    super(props)
    this.onSelectedDegree = this.onSelectedDegree.bind(this)
    this.onSelectedCourse = this.onSelectedCourse.bind(this)
    this.onSelectedShift = this.onSelectedShift.bind(this)
    this.getShortLink = this.getShortLink.bind(this)
  }

  async componentDidMount() {
    this.degrees = await API.getDegrees()
    this.forceUpdate()
  }

  async onSelectedDegree(degree: Degree | null): Promise<void> {
    this.selectedDegree = degree
    if (degree !== null) {
      const degreeCourses = await API.getCourses(degree.id) 
      const selected = this.state.selectedCourses.courses
      const courses = Comparables.toUnique(degreeCourses.concat(selected)) as Course[]
      courses.sort(Course.compare)
      this.setState({
        courses
      })
    } else {
      this.setState({
        courses: this.state.selectedCourses.courses
      })
    }
  }

  getCoursesDifference(prevCourses: Course[], courses: Course[]): Course | undefined {
    let unique1 = prevCourses.filter((c: Course) => !Comparables.includes(courses, c))
    let unique2 = courses.filter((c: Course) => !Comparables.includes(prevCourses, c))

    // Remove
    if (unique1.length === 1) { 
      return unique1[0]
    }
    // Add
    if (unique2.length === 1) { 
      return unique2[0]
    }
  }

  onSelectedCourse(selectedCourses: Course[]): void {
    // When all courses are cleared, set state to no courses
    if (selectedCourses.length === 0) {
      this.setState(() => {
        const currCourses = new CourseUpdates()
        currCourses.courses = []
        currCourses.lastUpdate = { course: undefined, type: CourseUpdateType.Clear}
        if (this.selectedDegree !== null) {
          return { selectedCourses: { ...currCourses } }
        } else {
          return { selectedCourses: { ...currCourses }, courses: []}
        }
      })
      return
    }

    let changedCourse = this.getCoursesDifference(this.state.selectedCourses.courses, selectedCourses)
    if (!changedCourse) {
      return
    }
    let currCourses = this.state.selectedCourses
    // FIXME: what?
    Object.setPrototypeOf(currCourses, CourseUpdates.prototype)

    currCourses.toggleCourse(changedCourse)
    this.setState({
      selectedCourses: {...currCourses}
    })

    this.storedState = btoa(encodeURIComponent(JSON.stringify(this.state.selectedCourses, null, 0)))
    // const title = document.title
    // if (window.history.replaceState) {
    //   window.history.replaceState(this.storedState, title, '/' + this.storedState)
    // } else {
    //   window.history.pushState(this.storedState, title, '/' + this.storedState)
    // }
  }

  onSelectedShift(shifts: Shift[]): void {
    this.setState({
      selectedShifts: [...shifts]
    })
  }

  async getShortLink(): Promise<void> {
    const shortLink = await API.getShortUrl(this.storedState)

    const el = document.createElement('textarea')
    el.value = shortLink
    el.setAttribute('readonly', '')
    el.style.display = 'hidden'
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')

    document.body.removeChild(el)
    alert("Copied the text: " + shortLink)
  }
  
  render(): ReactNode {
    const courseFilterOptions = createFilterOptions({
      stringify: (option: Course) => option.searchableName()
    })

    const maxTags = 4
    const maxSelectedCourses = -1

    return (
      <div className="App">
        <header className="App-header">
        </header>
        <div className={"main"}>
          <div className={"topbar"}>
            <AppBar
              color={"transparent"}
              position={"static"}
            >
              <Toolbar>
                <Autocomplete
                  size="small"
                  className="autocomplete course-selector"
                  selectOnFocus
                  clearOnBlur
                  handleHomeEndKeys={false}
                  onChange={(_, value) => this.onSelectedDegree(value)}
                  noOptionsText="Sem opções"
                  options={this.degrees}
                  getOptionLabel={(option) => option.displayName()}
                  renderInput={(params) => <TextField {...params} label="Escolha um curso" variant="outlined" />}
                />
                <Autocomplete
                  className="autocomplete"
                  size="small"
                  multiple
                  selectOnFocus
                  clearOnBlur
                  disableCloseOnSelect
                  handleHomeEndKeys={false}
                  limitTags={maxTags}
                  onChange={(_, courses: Course[]) => this.onSelectedCourse(courses)}
                  filterOptions={courseFilterOptions}
                  options={this.state.courses}
                  noOptionsText="Sem opções, escolha um curso primeiro"
                  getOptionDisabled={(_) => this.state.courses.length === maxSelectedCourses ? true : false}
                  getOptionLabel={(option) => option.displayName()}
                  renderInput={(params) => <TextField  {...params} label="Escolha as UCs" variant="outlined" />}
                  renderTags={(tagValue, getTagProps) => {
                    return tagValue.map((option, index) => (
                      <Chip {...getTagProps({ index })} label={option.acronym} />
                    ));
                  }}
                />
                <Tooltip title="Obter link de partilha">
                  <IconButton onClick={this.getShortLink} color="primary" component="span" disabled={true}>
                    <Icon>link</Icon>
                  </IconButton>
                </Tooltip>
              </Toolbar>
            </AppBar>
          </div>
          <div className="alerts">
            <Alert id='success-copy-link' severity="success">O link foi copiado para o seu clipboard.</Alert>
            <Alert id='error-copy-link' severity="error">Não conseguimos gerar um link.</Alert>
          </div>
          <div className={"schedules"}>
            <Schedule ref={this.initialSchedule} selectedCourses={this.state.selectedCourses} onSelectedShift={this.onSelectedShift}/>
            <ChosenSchedule selectedShifts={this.state.selectedShifts} onRemovedShift={(shiftName: string) => {
              if (this.initialSchedule) this.initialSchedule.current.onSelectedShift(shiftName)
            }}/>
          </div>
        </div>
      </div>
    )
  }
}

export default App;
