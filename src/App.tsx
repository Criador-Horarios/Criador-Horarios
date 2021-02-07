import React, { ReactNode } from 'react';
import API from './utils/api';
import Cookies from 'universal-cookie'

import {
  campiList,
  Course,
  CourseUpdates,
  CourseUpdateType,
  Degree,
  Shift,
  shiftTypes,
  Lesson
} from './utils/domain';
import Comparables from './utils/comparables';
import Schedule from './components/Schedule/Schedule';
import './App.scss';

import Avatar from '@material-ui/core/Avatar';
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
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import FilterList from '@material-ui/icons/FilterList'
import BottomNavigation from '@material-ui/core/BottomNavigation';
import BottomNavigationAction from '@material-ui/core/BottomNavigationAction';

class App extends React.PureComponent {
  state = {
    availableCourses: [] as Course[],
    selectedCourses: new CourseUpdates(),
    availableShifts: [] as Shift[],
    shownShifts: [] as Shift[],
    selectedShifts: [] as Shift[],
    selectedCampus: campiList as String[],
    selectedShiftType: shiftTypes as String[]
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
    this.changeCampus = this.changeCampus.bind(this)
  }

  async componentDidMount() {
    this.degrees = await API.getDegrees()
    const queryParam = /\?s=(.*)$/
    await this.buildState(window.location.href.match(queryParam)?.[1])
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
        const update: any = { selectedCourses: { ...currCourses}, availableShifts: [], shownShifts: [] }
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

    let shownShifts = this.filterShifts({
      selectedCampus: this.state.selectedCampus,
      selectedShiftType: this.state.selectedShiftType,
      availableShifts: availableShifts
    })

    this.setState({
      selectedCourses: { ...currCourses },
      availableShifts,
      shownShifts
    })
  }

  getAllLessons(): Lesson[] {
    return this.state.shownShifts.map((shift: Shift) => shift.lessons).flat()
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
    this.cookies.remove('shifts')
  }

  changeCampus(campi: String[]): void {
    let shownShifts = this.filterShifts({
      selectedCampus: campi,
      selectedShiftType: this.state.selectedShiftType,
      availableShifts: this.state.availableShifts
    })

    this.setState({
      selectedCampus: campi,
      shownShifts
    })
  }

  changeShiftType(types: String[]): void {
    let shownShifts = this.filterShifts({
      selectedCampus: this.state.selectedCampus,
      selectedShiftType: types,
      availableShifts: this.state.availableShifts
    })

    this.setState({
      selectedShiftType: types,
      shownShifts
    })
  }

  filterShifts(state: {selectedCampus: String[], selectedShiftType: String[], availableShifts: Shift[]}): Shift[] {
    return state.availableShifts.filter( (s) => {
      let campi = state.selectedCampus.includes(s.campus)
      let type = state.selectedShiftType.includes(s.type)
      return campi && type
    })
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
    const shortLink: string = `${window.location.href}/?s=${encodeURIComponent(JSON.stringify(state, null, 0))}`
      .replaceAll('//', '/')
      .replace(':/', '://')

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

  async buildState(param: string | undefined): Promise<void> {
    try {
      // TODO: rebuild colors and domain chosen for the courses
      let shifts: Shift[] = []
      if (param) { // build from URL
        shifts = JSON.parse(decodeURIComponent(param))
        this.cookies.set('shifts', shifts)
        const title = document.title
        // redirect if sucess
        if (window.history.replaceState) {
          window.history.replaceState({}, title, window.location.pathname)
        } else {
          window.history.pushState({}, title, window.location.pathname)
        }
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
                  className="selector course-selector"
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
                  className="selector"
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
                <IconButton color="inherit" disabled onClick={this.clearSelectedShifts} component="span">
                  <FilterList />
                </IconButton>
                <Tooltip title="Limpar horário">
                  <IconButton color="inherit" onClick={this.clearSelectedShifts} component="span">
                    <Icon>delete</Icon>
                  </IconButton>
                </Tooltip>
                <Tooltip title="Obter link de partilha">
                  <IconButton color="inherit" onClick={this.getShortLink} component="span" disabled={false}>
                    <Icon>link</Icon>
                  </IconButton>
                </Tooltip>
              </Toolbar>
              <Toolbar>
                <FormControl fullWidth={false} className="selector">
                  <InputLabel>Campi</InputLabel>
                  <Select
                    labelId="campus"
                    id="campus-selector"
                    multiple
                    autoWidth={true}
                    value={this.state.selectedCampus}
                    onChange={(event) => this.changeCampus(event.target.value as String[])}
                    input={<Input id="select-campus" />}
                    renderValue={(selected) => (
                      <div>
                        {(selected as string[]).map((value) => (
                          <Chip key={value} label={value[0]} />
                        ))}
                      </div>
                    )}
                  >
                    {campiList.map((name) => (
                      <MenuItem key={name} value={name}>
                        {name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth={false} className="selector">
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    labelId="shiftType"
                    id="shift-type-selector"
                    multiple
                    autoWidth={true}
                    value={this.state.selectedShiftType}
                    onChange={(event) => this.changeShiftType(event.target.value as String[])}
                    input={<Input id="select-shift-type" />}
                    renderValue={(selected) => (
                      <div>
                        {(selected as string[]).map((value) => (
                          <Chip key={value} label={value[0]} />
                        ))}
                      </div>
                    )}
                  >
                    {shiftTypes.map((name) => (
                      <MenuItem key={name} value={name}>
                        {name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
                  <Tooltip title="Aqui aparecem todos os turnos, carrega neles para os escolher">
                    <Icon color="action">help</Icon>
                  </Tooltip>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Schedule onSelectedEvent={(id: string) => this.onSelectedShift(id, this.state.selectedShifts)}
                    events={this.getSelectedLessons()}
                  />
                  <Tooltip title="O teu horário aparece aqui, carrega nele para remover turnos">
                    <Icon color="action">help</Icon>
                  </Tooltip>
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="footer">
            <Toolbar>
              <Avatar alt="Joao David" src={`${process.env.PUBLIC_URL}/favicon.ico`} />
            </Toolbar>
          </div>
        </div>
      </div>
    )
  }
}

export default App;
