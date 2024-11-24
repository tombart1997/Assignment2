import './VisContainer.css';
import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import VisD3 from './Vis-d3';

function VisContainer() {
    const visData = useSelector((state) => state.dataSet.data); // Full dataset
    const dispatch = useDispatch();

    const divContainerRef = useRef(null);
    const visD3Ref = useRef(null);

    const getCharSize = function () {
        let width, height;
        if (divContainerRef.current) {
            width = divContainerRef.current.offsetWidth;
            height = divContainerRef.current.offsetHeight;
        }
        return { width, height };
    };

    useEffect(() => {
        const visD3 = new VisD3(divContainerRef.current);
        visD3.create({ size: getCharSize() });
        visD3Ref.current = visD3;

        return () => {
            const visD3 = visD3Ref.current;
            visD3.clear(); // Cleanup
        };
    }, []);

    useEffect(() => {
        const visD3 = visD3Ref.current;

        const handleOnEvent1 = function (selectedData) {
            console.log("Heatmap 1D/2D Selection:", selectedData);
            // Dispatch selected data if needed
            // dispatch(reducerAction(selectedData));
        };

        const controllerMethods = {
            handleOnEvent1,
        };
        visD3.renderDensityPlot(visData)
        //visD3.renderHeatmap(visData, controllerMethods); // Call heatmap rendering
    }, [visData, dispatch]);

    return <div ref={divContainerRef} className="visDivContainer"></div>;
}

export default VisContainer;
