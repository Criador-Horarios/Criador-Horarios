import React, { ReactNode } from 'react';
import { Degree } from '../../utils/interfaces';
import styles from './DegreeList.module.scss';

class DegreeList extends React.PureComponent<{
  onSelectedDegree: Function
}, any> {
  allDegrees: Degree[] = []
  searchedDegree: string = "";
  state = {
    degrees: []
  }

  constructor(props: any) {
    super(props);

    this.onSearchedDegree = this.onSearchedDegree.bind(this);
    this.onSelectedDegree = this.onSelectedDegree.bind(this);
  }

  async componentDidMount() {
    await this.getDegrees()
  }

  async getDegrees(): Promise<void> {
    try {
      const degrees = await fetch('/api/fenix/v1/degrees').then(r => r.json())
      this.allDegrees = degrees.map((d: any) => new Degree(d))
      this.allDegrees.sort((a: Degree, b: Degree) => a.displayName().localeCompare(b.displayName()))
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

  onSelectedDegree(event: any): void {
    const selectedDegree = event.target.id;
    this.props.onSelectedDegree(selectedDegree);
  }

  render(): ReactNode {
    return (
      <div className={styles.DegreeList} data-testid="DegreeList">
      <input type="text" onChange={this.onSearchedDegree}></input>
      <ul>
        {this.state.degrees?.map((d: Degree) => {
          return <li className={"clickable"} id={d.id} key={d.id} onClick={this.onSelectedDegree}>{d.displayName()}</li> 
        })}
      </ul>
      </div>
    )
  }
}

export default DegreeList;
