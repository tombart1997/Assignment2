import './ScatterplotContainer.css';
import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import VisD3 from './Vis-d3';
import { updateSelectedItem } from '../../redux/DataSetSlice'; // Import your reducer action

function ScatterplotContainer() {
    const visData = useSelector((state) => state.dataSet.data); // Return data directly
    const previousSelection = useSelector((state) => state.dataSet.selectedPoints); // Get previous selection

    const dispatch = useDispatch();

    // every time the component re-render
    useEffect(()=>{
        console.log("VisContainer useEffect (called each time matrix re-renders)");
    }); // if no dependencies, useEffect is called at each re-render

    const scatterContainerRef=useRef(null);
    const visD3Ref = useRef(null)

    const getCharSize = function(){
        // fixed size
        // return {width:900, height:900};
        // getting size from parent item
        let width = 900;  // Default width
        let height = 400; // Default height
        if(scatterContainerRef.current!==undefined){
            width=scatterContainerRef.current.offsetWidth || width;
            // width = '100%';
            height=scatterContainerRef.current.offsetHeight ||height;
            // height = '100%';
        }
        return {width:width,height:height};
    }

    // did mount called once the component did mount
    useEffect(()=>{
        console.log("VisContainer useEffect [] called once the component did mount");
        console.log(visData);
        const visD3 = new VisD3(scatterContainerRef.current);
        visD3.create({size:getCharSize()}, visData);
        visD3Ref.current = visD3;
        return ()=>{
            // did unmout, the return function is called once the component did unmount (removed for the screen)
            console.log("VisContainer useEffect [] return function, called when the component did unmount...");
            const visD3 = visD3Ref.current;
            visD3.clear()
        }
    },[]);// if empty array, useEffect is called after the component did mount (has been created)

    // did update, called each time dependencies change, dispatch remain stable over component cycles
    useEffect(()=>{
        console.log("VisContainer useEffect with dependency [visData,dispatch], called each time visData changes...");
        const visD3 = visD3Ref.current;

        const handleOnEvent1 = (selectedData) => {
            // Compare previous selection to avoid unnecessary updates
            if (JSON.stringify(previousSelection) !== JSON.stringify(selectedData)) {
                dispatch(updateSelectedItem(selectedData));
            }
        };
        const handleOnEvent2 = function(payload){
            // do something
            // call dispatch(reducerAction1(payload));
        }
        const controllerMethods={
            handleOnEvent1: handleOnEvent1,
            handleOnEvent2: handleOnEvent2,
        }
        visD3.renderScatterPlot(visData,controllerMethods);
    },[visData,dispatch, previousSelection]);// if dependencies, useEffect is called after each data update, in our case only visData changes.

    return(
        <div ref={scatterContainerRef} className="scatterContainer">

        </div>
    )

    
}



export default ScatterplotContainer;

