import './VisContainer.css';
import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import VisD3 from './Vis-d3';
import { updateSelectedItem } from '../../redux/DataSetSlice'; // Import your reducer action

function VisContainer() {
    const visData = useSelector((state) => state.dataSet.data); // Full dataset
    const dispatch = useDispatch();
    const previousSelection = useSelector((state) => state.dataSet.selectedPoints); // Get previous selection

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

        const handleOnEvent1 = (selectedData) => {
            // Compare previous selection to avoid unnecessary updates
            if (JSON.stringify(previousSelection) !== JSON.stringify(selectedData)) {
                dispatch(updateSelectedItem(selectedData));
            }
        };

        const controllerMethods = {
            handleOnEvent1,
        };
        //visD3.renderDensityPlot(visData);
    }, [visData, dispatch]);

    return <div ref={divContainerRef} className="visDivContainer"></div>;
}

export default VisContainer;
