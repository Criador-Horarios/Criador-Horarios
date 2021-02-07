import React, { ReactNode } from 'react';
import API from './utils/api';
import Cookies from 'universal-cookie'

import {
  Course,
  CourseUpdates,
  CourseUpdateType,
  Degree,
  Shift,
  Lesson
} from './utils/domain';
import Comparables from './utils/comparables';
import Schedule from './components/Schedule/Schedule';
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
  state = {
    availableCourses: [] as Course[],
    selectedCourses: new CourseUpdates(),
    availableShifts: [] as Shift[],
    selectedShifts: [] as Shift[],
  }
  degrees: Degree[] = []
  selectedDegree: Degree | null = null
  cookies: Cookies = new Cookies()

  constructor(props: any) {
    super(props)
    this.onSelectedDegree = this.onSelectedDegree.bind(this)
    this.onSelectedCourse = this.onSelectedCourse.bind(this)
    this.onSelectedShift = this.onSelectedShift.bind(this)
    this.clearSelectedShifts = this.clearSelectedShifts.bind(this)
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
      const availableCourses = Comparables.toUnique(degreeCourses.concat(selected)) as Course[]
      availableCourses.sort(Course.compare)
      this.setState({
        availableCourses
      })
    } else {
      this.setState({
        availableCourses: this.state.selectedCourses.courses
      })
    }
  }

  getCoursesDifference(prevCourses: Course[], courses: Course[]): Course | undefined {
    const prevSet: any = Comparables.toUnique(prevCourses)
    const newSet: any = Comparables.toUnique(courses)

    if (prevSet.length === newSet.length) {
      // Nothing changed
      return undefined
    } else if (prevSet.length === newSet.length + 1) {
      // Removed element, find missing in courses
      return prevCourses.find((c: Course) => !Comparables.includes(courses, c))
    } else if (prevSet.length === newSet.length - 1) {
      // Added element, return first last on courses
      return courses[courses.length - 1]
    }
  }

  //FIXME: Available courses not updating when a course from another degree is removed 
  async onSelectedCourse(selectedCourses: Course[]): Promise<void> {
    if (selectedCourses.length === 0) {
      this.setState(() => {
        const currCourses = new CourseUpdates()
        currCourses.lastUpdate = { course: undefined, type: CourseUpdateType.Clear}
        const update: any = { selectedCourses: { ...currCourses}, availableShifts: [] }
        if (this.selectedDegree === null) {
          update.availableCourses = []
        }
        return update
      })
      return
    }

    let changedCourse = this.getCoursesDifference(this.state.selectedCourses.courses, selectedCourses)
    if (!changedCourse) {
      return
    }

    const currCourses = this.state.selectedCourses
    Object.setPrototypeOf(currCourses, CourseUpdates.prototype) // FIXME: what??
    currCourses.toggleCourse(changedCourse!)

    let availableShifts: Shift[]
    if (this.state.selectedCourses.lastUpdate?.type === CourseUpdateType.Add) {
      const schedule = await API.getCourseSchedules(this.state.selectedCourses.lastUpdate.course!)
      availableShifts = this.state.availableShifts.concat(schedule)
    } else if (this.state.selectedCourses.lastUpdate?.type === CourseUpdateType.Remove) {
      availableShifts = this.state.availableShifts
        .filter((shift: Shift) => shift.courseName !== this.state.selectedCourses.lastUpdate?.course?.name)
    } else {
      availableShifts = []
    }
    this.setState({
      selectedCourses: { ...currCourses },
      availableShifts
    })
  }

  getAllLessons(): Lesson[] {
    return this.state.availableShifts.map((shift: Shift) => shift.lessons).flat()
  }

  getSelectedLessons(): Lesson[] {
    return this.state.selectedShifts.map((shift: Shift) => shift.lessons).flat()
  }

  onSelectedShift(shiftName: string, arr: Shift[]): void {
    const chosenShift = arr.find((s: Shift) => s.name === shiftName)

    if (chosenShift) {
      // Verify if of the same type and course to replace, but not the same
      const replacingIndex = Comparables.indexOfBy(this.state.selectedShifts, chosenShift, Shift.isSameCourseAndType)
      const selectedShifts = this.state.selectedShifts
      
      // Verify if shift is already selected and unselect
      let idx = Comparables.indexOf(selectedShifts, chosenShift)
      if (idx === -1) {
        selectedShifts.push(chosenShift)
        if (replacingIndex !== -1) {
          selectedShifts.splice(replacingIndex, 1)  
        }
      } else {
        selectedShifts.splice(idx, 1)
      }

      this.setState({
        selectedShifts: [...selectedShifts]
      })
      this.cookies.set('shifts', selectedShifts)
    }
  }

  clearSelectedShifts(): void {
    this.setState({
      selectedShifts: []
    })
    this.cookies.set('shifts', [])
  }

  async getShortLink(): Promise<void> {
    // FIXME: tinyurl messes up \n
    // const shortLink = await API.getShortUrl(this.storedState)
    if (!this.cookies.get('shifts')) {
      alert('Nothing to share')
      return
    }

    const state: string = this.cookies.get('shifts')
    // FIXME: get full path
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
    // if (window.history.replaceState) {
    //   window.history.replaceState({}, title, '/')
    // } else {
    //   window.history.pushState({}, title, '/')
    // }

    try {
      // TODO: rebuild colors and domain chosen for the courses
      let shifts: Shift[]
      if (stateString !== '') { // build from URL
        shifts = JSON.parse(decodeURIComponent(stateString))
        this.cookies.set('shifts', shifts)
      } else { // build from cookies
        shifts = this.cookies.get('shifts') ?? []
      }

      // Set prototypes for each object received
      shifts.forEach((s) => {
        Object.setPrototypeOf(s, Shift.prototype)
        s.lessons.forEach((l) => Object.setPrototypeOf(l, Lesson.prototype))
      })
      
      this.setState({
        selectedShifts: [...shifts]
      })
    } catch (err) {
      console.error(err)
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
                  filterOptions={courseFilterOptions} options={this.state.availableCourses}
                  noOptionsText="Sem opções, escolha um curso primeiro"
                  // getOptionDisabled={(_) => this.state.courses.length === maxSelectedCourses ? true : false}
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
                <Tooltip title="Limpar horário">
                  <IconButton color="inherit" onClick={this.clearSelectedShifts} component="span">
                    <Icon>delete</Icon>
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
                  <Schedule onSelectedEvent={(id: string) => this.onSelectedShift(id, this.state.availableShifts)}
                    events={this.getAllLessons()}
                  />
                  <Tooltip title="Aqui aparecem todos os turnos, carregue neles para os escolher">
                    <Icon color="action">help</Icon>
                  </Tooltip>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Schedule onSelectedEvent={(id: string) => this.onSelectedShift(id, this.state.selectedShifts)}
                    events={this.getSelectedLessons()}
                  />
                  <Tooltip title="O seu horário aparece aqui, carregue nele para remover turnos">
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
