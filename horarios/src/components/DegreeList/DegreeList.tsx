import React, { ReactNode } from 'react';
import API from '../../utils/api';
import { Degree } from '../../utils/domain';
import styles from './DegreeList.module.scss';

class DegreeList extends React.PureComponent<{
  onSelectedDegree: Function
}, any> {
  allDegrees: Degree[] = []
  state = {
    degrees: []
  }

  constructor(props: any) {
    super(props);
    this.onSearchedDegree = this.onSearchedDegree.bind(this);
    this.onSelectedDegree = this.onSelectedDegree.bind(this);
  }

  async componentDidMount() {
    try {
      this.allDegrees = await API.getDegrees();
      this.setState({
        degrees: [...this.allDegrees]
      })
    } catch (err) {
      console.log(err)
    }
  }

  onSearchedDegree(event: any): void {
    const searchedDegree = event.target.value.toLowerCase();

    let degrees = this.allDegrees
      .filter((d: Degree) => d.displayName().toLowerCase().includes(searchedDegree))
    
    this.setState({
      degrees
    })
  }

  onSelectedDegree(d: Degree, element: HTMLElement): void {
    console.log(d);
    // FIXME: Get better way of checking if selected
    if (element.classList.contains("selected")) {
      element.classList.remove("selected")
      this.props.onSelectedDegree(undefined);
    } else { 
      element.classList.add("selected")
      this.props.onSelectedDegree(d.id);
    }
  }

  render(): ReactNode {
    return (
      <div className={styles.DegreeList} data-testid="DegreeList">
      <input type="text" onChange={this.onSearchedDegree}></input>
      <ul>
        {this.state.degrees?.map((d: Degree) => {
          return <li className={"clickable"} key={d.id} onClick={(e) => this.onSelectedDegree(d, e.target as HTMLElement)}>{d.displayName()}</li> 
        })}
      </ul>
      </div>
    )
  }
}

export default DegreeList;
