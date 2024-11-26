import './PlotContainer.css';
import { useEffect, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PlotD3 from './PlotD3';
import { updateSelectedItem } from '../../redux/DataSetSlice';

function PlotContainer() {
    const visData = useSelector((state) => state.dataSet.data);
    const previousSelection = useSelector((state) => state.dataSet.selectedPoints);
    const xAttr = useSelector((state) => state.dataSet.xAttr);
    const yAttr = useSelector((state) => state.dataSet.yAttr);
    const dispatch = useDispatch();

    const scatterContainerRef = useRef(null);
    const visD3Ref = useRef(null);

    // Calculate chart size
    const getCharSize = useMemo(() => {
        return {
            width: scatterContainerRef.current?.offsetWidth || 900,
            height: scatterContainerRef.current?.offsetHeight || 400,
        };
    }, []); // Removed `scatterContainerRef.current` as it doesn't trigger re-renders.

    // Define controller methods
    const controllerMethods = useMemo(() => ({
        handleOnEvent1: (selectedData) => {
            if (JSON.stringify(previousSelection) !== JSON.stringify(selectedData)) {
                dispatch(updateSelectedItem(selectedData));
            }
        },
        handleOnEvent2: (payload) => {
        },
    }), [previousSelection, dispatch]); // Added `previousSelection` and `dispatch` as dependencies.

    // Initialize VisD3 instance on mount and cleanup on unmount
    useEffect(() => {
        const visD3 = new PlotD3(scatterContainerRef.current);
        visD3Ref.current = visD3;

        visD3.setAxisAttributes(xAttr, yAttr);
        visD3.create({ size: getCharSize }, visData);

        return () => {
            visD3.clear();
        };
    }, [getCharSize, visData, xAttr, yAttr]); // Added all dependencies used within the effect.

    // Update VisD3 instance when visData or attributes change
    useEffect(() => {
        const visD3 = visD3Ref.current;
        if (visD3) {
            visD3.setAxisAttributes(xAttr, yAttr);
            visD3.renderScatterPlot(visData, controllerMethods);
        }
    }, [visData, xAttr, yAttr, controllerMethods]); // Added `controllerMethods` as it is memoized and may change.

    return <div ref={scatterContainerRef} className="plotContainer"></div>;
}

export default PlotContainer;
