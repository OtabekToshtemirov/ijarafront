import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunks
export const fetchRentals = createAsyncThunk(
    'rentals/fetchRentals',
    async () => {
        const response = await axios.get('http://localhost:3000/api/rentals');
        return response.data;
    }
);

export const fetchRentalById = createAsyncThunk(
    'rentals/fetchRentalById',
    async (id) => {
        const response = await axios.get(`http://localhost:3000/api/rentals/${id}`);
        return response.data;
    }
);

export const updateRental = createAsyncThunk(
    'rentals/updateRental',
    async ({ id, data }) => {
        const response = await axios.put(`http://localhost:3000/api/rentals/${id}`, data);
        return response.data;
    }
);

export const deleteRental = createAsyncThunk(
    'rentals/deleteRental',
    async (id) => {
        await axios.delete(`http://localhost:3000/api/rentals/${id}`);
        return id;
    }
);

const rentalSlice = createSlice({
    name: 'rentals',
    initialState: {
        rentals: [],
        currentRental: null,
        status: 'idle',
        error: null
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch all rentals
            .addCase(fetchRentals.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchRentals.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.rentals = action.payload;
            })
            .addCase(fetchRentals.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
            })
            // Fetch single rental
            .addCase(fetchRentalById.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchRentalById.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.currentRental = action.payload;
            })
            .addCase(fetchRentalById.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
            })
            // Update rental
            .addCase(updateRental.fulfilled, (state, action) => {
                const index = state.rentals.findIndex(rental => rental._id === action.payload._id);
                if (index !== -1) {
                    state.rentals[index] = action.payload;
                }
            })
            // Delete rental
            .addCase(deleteRental.fulfilled, (state, action) => {
                state.rentals = state.rentals.filter(rental => rental._id !== action.payload);
            });
    }
});

export default rentalSlice.reducer;
