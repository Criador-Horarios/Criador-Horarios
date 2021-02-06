import { Console } from 'console';
import React from 'react';
import API from '../../utils/api';
import { Course, CourseUpdates, CourseUpdateType } from '../../utils/domain';
import styles from './CourseList.module.scss';


class CourseList extends React.PureComponent<{
  selectedDegree?: string
  onSelectedCourses: Function
}, any> {
  allCourses: Course[] = []
  state = {
    courses: [] as Course[],
    selectedCourses: new CourseUpdates(),
  }

  constructor(props: any)  {
    super(props)
    this.onSearchedCourse = this.onSearchedCourse.bind(this);
  }

  async componentDidMount() {
    if (this.props.selectedDegree) {
      await this.getCourses(this.props.selectedDegree)
    }
  }

  async componentDidUpdate(prevProps: any) {
    if (!this.props.selectedDegree) {
      if (this.state.courses.length > 0) {
        this.setState({
          courses: []
        })
      }
      return
    }

    // Check if props have changed
    if (prevProps !== this.props) {
      await this.getCourses(this.props.selectedDegree)
    }
  }

  async getCourses(degree: string) {
    try {
      let courses = await API.getCourses(degree)
      // FIXME: Filter hardcoded
      courses = courses.filter( c => {
        return c.semester === 2
      })
      courses.sort((a: Course, b: Course) => {
        let sem = a.semester < b.semester ? -1 : a.semester === b.semester ? 0 : 1
        return sem || a.name.localeCompare(b.name)
      })
      this.allCourses = courses
      this.setState({
        courses: [...this.allCourses]
      })
    } catch (err) {
      console.log(err)
    }
  }

  onSearchedCourse(event: any): void {
    const searchedCourse = event.target.value.toLowerCase();

    const courses = this.allCourses
      .filter((d: Course) => d.displayName().toLowerCase().includes(searchedCourse))
    
    this.setState({
      courses
    })
  }

  // FIXME: Adding and removing here?
  onSelectedCourse(course: Course, element: HTMLElement): void {
    const type = this.state.selectedCourses.toggleCourse(course)
    if (type == CourseUpdateType.Add) {
      element.classList.add("selected")
    } else {
      element.classList.remove("selected")
    }

    this.props.onSelectedCourses(this.state.selectedCourses)
  }

  render(): React.ReactNode {
    return (
      <div className={styles.CourseList}>
        <input type="text" onChange={this.onSearchedCourse}></input>
        <ul>
          {this.state.courses?.map((c: Course) => {
            // FIXME: Check if selected to add class selected
            return <li className={"clickable"} key={c.id} onClick={(e) => this.onSelectedCourse(c, e.target as HTMLElement)}>{c.name}</li> 
          })}
        </ul>
      </div>
    )
  }
}

export default CourseList;
