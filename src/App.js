import './App.css';
import { useEffect} from 'react';
import { useDispatch } from 'react-redux';
import { getSeoulBikeData } from './redux/DataSetSlice';
// here import other dependencies
import VisContainer from './templates/d3react/VisContainer';
import ScatterplotContainer from './templates/d3react/ScatterplotContainer';



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
        {console.log("App rendering")}
        <div id="view-container" className="row">
          {/*<ScatterplotContainer/>*/}
          <ScatterplotContainer />

          {/* <YourVisContainer/> */}
          <VisContainer />

        </div>
    </div>
  );
}

export default App;
