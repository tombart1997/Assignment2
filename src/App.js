import './App.css';
import { useEffect} from 'react';
import { useDispatch } from 'react-redux';
import { getSeoulBikeData } from './redux/DataSetSlice';
// here import other dependencies
import ScatterplotContainer from './templates/d3react/ScatterplotContainer';
import ControlBar from './components/controlbar/ControlBar';


// a component is a piece of code which render a part of the user interface
function App() {
  const dispatch = useDispatch();
  useEffect(()=>{
    console.log("App useEffect");
  })

  // called once the component did mount
  useEffect(()=>{
    // initialize the data from file
    dispatch(getSeoulBikeData());
  },[])


  return (
    <div className="App">
      <div id="control-bar-container">
        <ControlBar />
      </div>
      {console.log("App rendering")}
      <div id="view-container" className="row">
        {/* Arrange ScatterplotContainer and VisContainer side by side */}
        <div className="col2">
          <ScatterplotContainer />
        </div>
      </div>
    </div>
  );
  
  
}

export default App;
