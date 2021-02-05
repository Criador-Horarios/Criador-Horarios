import React, { ReactNode } from 'react';
import logo from './logo.svg';
import './App.scss';
import DegreeList from './components/DegreeList/DegreeList';

class App extends React.PureComponent {
  
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
        <DegreeList onSelectedDegree={console.log}/>
      </div>
    );
  }
}

export default App;
