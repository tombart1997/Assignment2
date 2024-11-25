import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Papa from 'papaparse';

// Async thunk to fetch and parse CSV data
export const getSeoulBikeData = createAsyncThunk(
  'seoulBikeData/fetchData',
  async () => {
    const response = await fetch('data/SeoulBikeData.csv');
    const responseText = await response.text();
    console.log('Loaded file length:', responseText.length);
    const responseJson = Papa.parse(responseText, { header: true, dynamicTyping: true });

    // Filter out invalid rows (optional)
    const filteredData = responseJson.data.filter((row) =>
      Object.values(row).every((value) => value !== null && value !== undefined)
    );

    // Add index for identification
    return filteredData.map((item, i) => ({ ...item, index: i }));
  }
);

export const dataSetSlice = createSlice({
  name: 'dataSet',
  initialState: {
    data: [],
    selectedPoints: [],
    numericalAttributes: [], // Dynamically set after loading data
    xAttr: null, // Default x-axis attribute
    yAttr: null, // Default y-axis attribute
  },
  reducers: {
    updateSelectedItem: (state, action) => {
      // Update the selected points if the selection has changed
      if (JSON.stringify(state.selectedPoints) !== JSON.stringify(action.payload)) {
        state.selectedPoints = action.payload;
      }
    },
    updateAxisAttributes: (state, action) => {
      console.log("updateAxistAttributes X:", action.payload.xAttr, " Y: ", action.payload.yAttr);
      // Update x and y axis attributes
      state.xAttr = action.payload.xAttr;
      state.yAttr = action.payload.yAttr;
    },
    resetState: (state) => {
      // Reset state to initial settings
      state.selectedPoints = [];
      state.xAttr = state.numericalAttributes[0] || null;
      state.yAttr = state.numericalAttributes[1] || null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(getSeoulBikeData.fulfilled, (state, action) => {
      state.data = action.payload;

      // Detect numerical attributes dynamically from the first row of data
      if (action.payload.length > 0) {
        const firstRow = action.payload[0];
        const numericalKeys = Object.keys(firstRow).filter(
          (key) => typeof firstRow[key] === 'number'
        );

        // Update numerical attributes and set default axes
        state.numericalAttributes = numericalKeys;

        if (numericalKeys.length > 0) {
          state.xAttr = numericalKeys[0]; // Default to the first numerical key for xAttr
          state.yAttr = numericalKeys[1] || numericalKeys[0]; // Default to the second or fallback to the first
        }
      }
    });
  },
});

// Export actions
export const { updateSelectedItem, updateAxisAttributes, resetState } =
  dataSetSlice.actions;

// Export reducer
export default dataSetSlice.reducer;
