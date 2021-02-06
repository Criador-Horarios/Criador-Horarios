import React, { ReactNode } from 'react';
import logo from './logo.svg';
import './App.scss';
import DegreeList from './components/DegreeList/DegreeList';
import CourseList from './components/CourseList/CourseList';
import Schedule from './components/Schedule/Schedule';
import { Course, CourseUpdates } from './utils/domain';

class App extends React.PureComponent {

  state = {
    selectedDegree: "",
    selectedCourses: new CourseUpdates
  }

  constructor(props: any) {
    super(props);
    this.onSelectedDegree = this.onSelectedDegree.bind(this);
    this.onSelectedCourse = this.onSelectedCourse.bind(this);
  }

  onSelectedDegree(degree: string): void {
    this.setState({
      selectedDegree: degree
    })
  }

  onSelectedCourse(courses: CourseUpdates): void {
    this.setState({
      selectedCourses: {...courses}
    })
  }
  
  render(): ReactNode {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit <code>src/App.tsx</code> and save to reload.
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
        <DegreeList onSelectedDegree={this.onSelectedDegree}/>
        <CourseList selectedDegree={this.state.selectedDegree} onSelectedCourses={this.onSelectedCourse}/>
        <Schedule selectedCourses={this.state.selectedCourses}/>
      </div>
    );
  }
}

export default App;
