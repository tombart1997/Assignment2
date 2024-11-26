import './App.css';
import { useEffect} from 'react';
import { useDispatch } from 'react-redux';
import { getSeoulBikeData } from './redux/DataSetSlice';
// here import other dependencies
import PlotContainer from './components/plots/PlotContainer';
import ControlBar from './components/controlbar/ControlBar';



// a component is a piece of code which render a part of the user interface
function App() {
  const dispatch = useDispatch();
  useEffect(()=>{
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
      <div id="view-container" className="row">
      <div className="col2">
          <PlotContainer />
      </div>
      </div>

    </div>
  );
  
  
}

export default App;
