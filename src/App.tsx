import React, { ReactNode } from 'react';
import API from './utils/api';
import Cookies from 'universal-cookie'

import { Course, CourseUpdates, CourseUpdateType, Degree, Shift } from './utils/domain';
import Comparables from './utils/comparables';
import Schedule from './components/Schedule/Schedule';
import ChosenSchedule from './components/ChosenSchedule/ChosenSchedule';
import './App.scss';

import Chip from '@material-ui/core/Chip';
import Autocomplete, { createFilterOptions } from '@material-ui/lab/Autocomplete';
import IconButton from '@material-ui/core/IconButton'
import Tooltip from '@material-ui/core/Tooltip'
import Toolbar from '@material-ui/core/Toolbar'
import Alert from '@material-ui/lab/Alert'
import AppBar from '@material-ui/core/AppBar'
import TextField from '@material-ui/core/TextField';
import Icon from '@material-ui/core/Icon'
import Card from '@material-ui/core/Card'
import CardContent from '@material-ui/core/CardContent'

class App extends React.PureComponent {

  // TODO: Allow english or other languages
  // TODO: Add filters for L, T and PB  
  // TODO: Add good colors
  // TODO: Save state to cookies
  state = {
    selectedCourses: new CourseUpdates(),
    courses: [] as Course[],
    selectedShifts: [] as Shift[]
  }
  selectedDegree: Degree | null = null
  cookies: Cookies = new Cookies()
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
    const state = window.location.pathname
    await this.buildState(state.slice(1))
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
  }

  // TODO: store on cookies
  onSelectedShift(shifts: Shift[]): void {
    this.setState({
      selectedShifts: [...shifts]
    })
    this.cookies.set('shifts', shifts)
  }

  async getShortLink(): Promise<void> {
    // FIXME: tinyurl messes up \n
    // const shortLink = await API.getShortUrl(this.storedState)
    if (!this.cookies.get('shifts')) {
      alert('Nothing to share')
      return
    }

    const state: string = this.cookies.get('shifts')
    const shortLink: string = `http://${window.location.host}/${encodeURIComponent(JSON.stringify(state, null, 0))}`

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

  async buildState(stateString: string): Promise<void> {
    const title = document.title
    if (window.history.replaceState) {
      window.history.replaceState({}, title, '/')
    } else {
      window.history.pushState({}, title, '/')
    }

    try {
      // TODO: rebuild colors chosen for the courses
      let shifts: Shift[]
      if (stateString !== '') { // build from URL
        shifts = JSON.parse(decodeURIComponent(stateString))
        this.cookies.set('shifts', shifts)
      } else { // build from cookies
        shifts = this.cookies.get('shifts') ?? []
      }
      this.setState({
        selectedShifts: [...shifts]
      })
    } catch (_) {
      // ignored, bad URL
    }
  }
  
  render(): ReactNode {
    const courseFilterOptions = createFilterOptions({
      stringify: (option: Course) => option.searchableName()
    })

    const maxTags = 14
    const maxSelectedCourses = -1

    return (
      <div className="App">
        <header className="App-header">
        </header>
        <div className="main">
          <div className="topbar">
            <AppBar
              color="transparent"
              position="static"
            >
              <Toolbar>
                <Autocomplete
                  color="inherit"
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
                  color="inherit"
                  size="small"
                  className="autocomplete"
                  multiple
                  selectOnFocus
                  clearOnBlur
                  disableCloseOnSelect
                  handleHomeEndKeys={false}
                  limitTags={maxTags}
                  onChange={(_, courses: Course[]) => this.onSelectedCourse(courses)}
                 filterOptions={courseFilterOptions} options={this.state.courses}
                  noOptionsText="Sem opções, escolha um curso primeiro"
                  getOptionDisabled={(_) => this.state.courses.length === maxSelectedCourses ? true : false}
                  getOptionLabel={(option) => option.displayName()}
                  renderInput={(params) => <TextField  {...params} label="Escolha as UCs" variant="outlined" />}
                  renderTags={(tagValue, getTagProps) => {
                    return tagValue.map((option, index) => (
                      <Chip {...getTagProps({ index })} size="small" label={option.acronym} />
                    ));
                  }}
                />
                <Tooltip title="Obter link de partilha">
                  <IconButton color="inherit" onClick={this.getShortLink} component="span">
                    <Icon>link</Icon>
                  </IconButton>
                </Tooltip>
              </Toolbar>
            </AppBar>
          </div>
          {/* <div className="alerts">
            <Alert id='success-copy-link' severity="success">O link foi copiado para o seu clipboard.</Alert>
            <Alert id='error-copy-link' severity="error">Não conseguimos gerar um link.</Alert>
          </div> */}
          <div className="body">
            <div className="bg-image" />
            <div className="schedules">
              <Card>
                <CardContent>
                  <Schedule ref={this.initialSchedule} selectedCourses={this.state.selectedCourses} onSelectedShift={this.onSelectedShift}/>
                  <Tooltip title="Carregue neste horário para escolher os turnos">
                    <Icon color="action">help</Icon>
                  </Tooltip>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <ChosenSchedule selectedShifts={this.state.selectedShifts} onRemovedShift={(shiftName: string) => {
                    if (this.initialSchedule) this.initialSchedule.current.onSelectedShift(shiftName)
                  }}/>
                  <Tooltip title="Carregue neste horário para remover turnos">
                    <Icon color="action">help</Icon>
                  </Tooltip>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default App;
