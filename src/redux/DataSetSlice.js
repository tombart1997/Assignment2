import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import Papa from "papaparse"

// get the data in asyncThunk
export const getSeoulBikeData = createAsyncThunk('seoulBikeData/fetchData', async () => {
    const response = await fetch('data/SeoulBikeData.csv');
    const responseText = await response.text();
    console.log("loaded file length:" + responseText.length);
    const responseJson = Papa.parse(responseText,{header:true, dynamicTyping:true});
    console.log("Parsed Data in getSeoulBikeData:", responseJson.data);
    return responseJson.data.map((item,i)=>{return {...item,index:i}});
    // when a result is returned, extraReducer below is triggered with the case setSeoulBikeData.fulfilled
})

export const dataSetSlice = createSlice({
  name: 'dataSet',
  initialState: {
    data: [],
    selectedPoints: [], 
  },
  reducers: {
      // add reducer if needed
      updateSelectedItem: (state, action) => {
        // Only update state if the payload is different from the current state
        if (JSON.stringify(state.selectedPoints) !== JSON.stringify(action.payload)) {
            state.selectedPoints = action.payload;
        }
    },
    

  },
  extraReducers: builder => {
    builder.addCase(getSeoulBikeData.fulfilled, (state, action) => {
      // Add any fetched house to the array
      state.data = action.payload; // Ensure fallback to an empty array
    })
  }
})

// Action creators are generated for each case reducer function
export const { updateSelectedItem } = dataSetSlice.actions

export default dataSetSlice.reducer