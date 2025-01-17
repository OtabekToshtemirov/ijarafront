import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/cars';

// Async Thunks
export const fetchCars = createAsyncThunk(
    'cars/fetchCars',
    async () => {
        const response = await axios.get(BASE_URL);
        return response.data.data || [];
    }
);

export const fetchCarById = createAsyncThunk(
    'cars/fetchCarById',
    async (id) => {
        const response = await axios.get(`${BASE_URL}/${id}`);
        return response.data.data;
    }
);

export const createCar = createAsyncThunk(
    'cars/createCar',
    async (carData) => {
        const response = await axios.post(BASE_URL, carData);
        return response.data.data;
    }
);

export const updateCar = createAsyncThunk(
    'cars/updateCar',
    async ({ id, data }) => {
        const response = await axios.put(`${BASE_URL}/${id}`, data);
        return response.data.data;
    }
);

export const deleteCar = createAsyncThunk(
    'cars/deleteCar',
    async (id) => {
        await axios.delete(`${BASE_URL}/${id}`);
        return id;
    }
);

export const fetchTopRentedCars = createAsyncThunk(
    'cars/fetchTopRentedCars',
    async (limit = 10) => {
        const response = await axios.get(`${BASE_URL}/top?limit=${limit}`);
        return response.data.data;
    }
);

const initialState = {
    cars: [],
    currentCar: null,
    status: 'idle',
    error: null,
    addStatus: 'idle',
    addError: null,
    updateStatus: 'idle',
    updateError: null,
    topRentedCars: []
};

const carsSlice = createSlice({
    name: 'cars',
    initialState,
    reducers: {
        clearAddStatus(state) {
            state.addStatus = 'idle';
            state.addError = null;
        },
        clearUpdateStatus(state) {
            state.updateStatus = 'idle';
            state.updateError = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch all cars
            .addCase(fetchCars.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchCars.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.cars = action.payload;
                state.error = null;
            })
            .addCase(fetchCars.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
            })
            // Fetch car by id
            .addCase(fetchCarById.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchCarById.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.currentCar = action.payload;
            })
            .addCase(fetchCarById.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
            })
            // Create car
            .addCase(createCar.pending, (state) => {
                state.addStatus = 'loading';
                state.addError = null;
            })
            .addCase(createCar.fulfilled, (state, action) => {
                state.addStatus = 'succeeded';
                state.cars.push(action.payload);
                state.addError = null;
            })
            .addCase(createCar.rejected, (state, action) => {
                state.addStatus = 'failed';
                state.addError = action.error.message;
            })
            // Update car
            .addCase(updateCar.pending, (state) => {
                state.updateStatus = 'loading';
                state.updateError = null;
            })
            .addCase(updateCar.fulfilled, (state, action) => {
                state.updateStatus = 'succeeded';
                const index = state.cars.findIndex(car => car._id === action.payload._id);
                if (index !== -1) {
                    state.cars[index] = action.payload;
                }
                state.updateError = null;
            })
            .addCase(updateCar.rejected, (state, action) => {
                state.updateStatus = 'failed';
                state.updateError = action.error.message;
            })
            // Delete car
            .addCase(deleteCar.fulfilled, (state, action) => {
                state.cars = state.cars.filter(car => car._id !== action.payload);
            })
            // Fetch top rented cars
            .addCase(fetchTopRentedCars.fulfilled, (state, action) => {
                state.topRentedCars = action.payload;
            });
    }
});

export const { clearAddStatus, clearUpdateStatus } = carsSlice.actions;

export default carsSlice.reducer;
