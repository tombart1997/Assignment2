import './ScatterplotContainer.css';
import { useEffect, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import VisD3 from './Vis-d3';
import { updateSelectedItem } from '../../redux/DataSetSlice';

function ScatterplotContainer() {
    const visData = useSelector((state) => state.dataSet.data);
    const previousSelection = useSelector((state) => state.dataSet.selectedPoints);
    const xAttr = useSelector((state) => state.dataSet.xAttr);
    const yAttr = useSelector((state) => state.dataSet.yAttr);
    const dispatch = useDispatch();

    const scatterContainerRef = useRef(null);
    const visD3Ref = useRef(null);

    const getCharSize = useMemo(() => {
        if (!scatterContainerRef.current) return { width: 900, height: 400 };
        return {
            width: scatterContainerRef.current.offsetWidth || 900,
            height: scatterContainerRef.current.offsetHeight || 400,
        };
    }, [scatterContainerRef.current]);

    const controllerMethods = useMemo(() => ({
        handleOnEvent1: (selectedData) => {
            if (JSON.stringify(previousSelection) !== JSON.stringify(selectedData)) {
                dispatch(updateSelectedItem(selectedData));
            }
        },
        handleOnEvent2: (payload) => {
            console.log('Event triggered:', payload);
        },
    }), [previousSelection, dispatch]);

    useEffect(() => {
        console.log('ScatterplotContainer mounted.');
        const visD3 = new VisD3(scatterContainerRef.current);
        visD3Ref.current = visD3;

        visD3.setAxisAttributes(xAttr, yAttr);
        visD3.create({ size: getCharSize }, visData);

        return () => {
            console.log('ScatterplotContainer unmounted.');
            visD3.clear();
        };
    }, []);

    useEffect(() => {
        const visD3 = visD3Ref.current;
        if (visD3) {
            console.log('Updating scatterplot with new data or attributes.');
            visD3.setAxisAttributes(xAttr, yAttr);
            visD3.renderScatterPlot(visData, controllerMethods);
        }
    }, [visData, xAttr, yAttr, controllerMethods]);

    return <div ref={scatterContainerRef} className="scatterContainer"></div>;
}

export default ScatterplotContainer;
