import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateAxisAttributes } from '../../redux/DataSetSlice';

export default function ControlBar() {
  // Extract relevant state from Redux
  const { numericalAttributes, xAttr, yAttr } = useSelector((state) => state.dataSet);
  const dispatch = useDispatch();

  // Handlers for axis changes
  const handleXAxisChange = (event) => {
    dispatch(updateAxisAttributes({ xAttr: event.target.value, yAttr }));
  };

  const handleYAxisChange = (event) => {
    dispatch(updateAxisAttributes({ xAttr, yAttr: event.target.value }));
  };

  return (
    <div>
      <div className="control-bar">
        <label htmlFor="x-axis-select">
          X-Axis:
          <select
            id="x-axis-select"
            value={xAttr || ''}
            onChange={handleXAxisChange}
          >
            {numericalAttributes.map((item, i) => (
              <option key={i} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="y-axis-select">
          Y-Axis:
          <select
            id="y-axis-select"
            value={yAttr || ''}
            onChange={handleYAxisChange}
          >
            {numericalAttributes.map((item, i) => (
              <option key={i} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
