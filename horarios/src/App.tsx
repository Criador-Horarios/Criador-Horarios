import React, { ReactNode } from 'react';
import API from './utils/api';
import './App.scss';
import Schedule from './components/Schedule/Schedule';
import { Course, CourseUpdates, CourseUpdateType, Degree, Update } from './utils/domain';
import { makeStyles } from '@material-ui/core/styles';
import Chip from '@material-ui/core/Chip';
import Autocomplete, { createFilterOptions } from '@material-ui/lab/Autocomplete';
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField';

class App extends React.PureComponent {

  state = {
    selectedDegree: '',
    selectedCourses: new CourseUpdates,
    courses: [] as Course[]
  }
  storedState: string = ''
  degrees: Degree[] = []

  constructor(props: any) {
    super(props)
    this.onSelectedDegree = this.onSelectedDegree.bind(this)
    this.onSelectedCourse = this.onSelectedCourse.bind(this)
    this.getShortLink = this.getShortLink.bind(this)
  }

  async componentDidMount() {
    this.degrees = await API.getDegrees()
    this.forceUpdate()
  }

  async onSelectedDegree(degree: Degree | null): Promise<void> {
    if (degree !== null) {
      const courses = await API.getCourses(degree.id) 
      this.setState({
        courses
      })
    } else {
      this.setState({
        courses: []
      })
    }
  }

  getCoursesDifference(prevCourses: Course[], courses: Course[]): Course | undefined {
    let unique1 = prevCourses.filter((c: Course) => !courses.some((other: Course) => c.equals(other)))
    let unique2 = courses.filter((c: Course) => !prevCourses.some((other: Course) => c.equals(other)))

    if (unique1.length === 1) { 
      // Remove
      return unique1[0]
    }
    if (unique2.length === 1) { 
      // Add
      return unique2[0]
    }
  }

  onSelectedCourse(selectedCourses: Course[]): void {
    // If cleared, set state to no courses
    if (selectedCourses.length === 0) {
      let currCourses = new CourseUpdates()
      currCourses.courses = []
      currCourses.lastUpdate = { course: undefined, type: CourseUpdateType.Clear}
      this.setState({
        selectedCourses: {...currCourses}
      })
      return  
    }
    // FIXME: When a degree is unselected and selected again, the course is seen as new!
    let changedCourse = this.getCoursesDifference(this.state.selectedCourses.courses, selectedCourses)
    if (changedCourse === undefined) {
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

  async getShortLink(): Promise<void> {
    const shortLink = await API.getShortUrl(this.storedState)
    console.log(shortLink)

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
    const maxSelectedCourses = 15

    return (
      <div className="App">
        <header className="App-header">
        </header>
        <div className={"main"}>
          <div className={"topbar"}>
            <Autocomplete
              className="autocomplete"
              selectOnFocus
              clearOnBlur
              handleHomeEndKeys
              onChange={(_, value) => this.onSelectedDegree(value)}
              options={this.degrees}
              getOptionLabel={(option) => option.displayName()}
              renderInput={(params) => <TextField {...params} label="Escolha um Curso" variant="outlined" />}
            />
            <Autocomplete
              className="autocomplete"
              multiple
              selectOnFocus
              clearOnBlur
              disableCloseOnSelect
              handleHomeEndKeys
              limitTags={maxTags}
              onChange={(_, courses: Course[]) => this.onSelectedCourse(courses)}
              filterOptions={courseFilterOptions}
              options={this.state.courses}
              getOptionDisabled={(options) => (this.state.selectedCourses.courses.length === maxSelectedCourses ? true : false)}
              disabled={this.state.courses.length === 0}
              getOptionLabel={(option) => option.displayName()}
              renderInput={(params) => <TextField  {...params} label="Escolha as UCs" variant="outlined" />}
              renderTags={(tagValue, getTagProps) => {
                return tagValue.map((option, index) => (
                  <Chip {...getTagProps({ index })} label={option.acronym} />
                ));
              }}
            />
            <Button variant="contained" onClick={this.getShortLink}>
              Link
            </Button>
          </div>
          <div className={"schedules"}>
            <Schedule selectedCourses={this.state.selectedCourses}/>
          </div>
        </div>
      </div>
    )
  }
}

export default App;
