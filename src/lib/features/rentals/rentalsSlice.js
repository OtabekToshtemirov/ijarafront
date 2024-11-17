import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunk for fetching rentals
export const fetchRentals = createAsyncThunk('rentals/fetchRentals', async () => {
    const response = await fetch('http://localhost:5000/api/rentals');
    if (!response.ok) {
        throw new Error('Failed to fetch rentals');
    }
    const data = await response.json();
    return data;
});

// Async thunk for adding a rental
export const addRentalAsync = createAsyncThunk('rentals/addRental', async (newRental) => {
    const response = await fetch('http://localhost:5000/api/rentals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRental),
    });
    if (!response.ok) {
        throw new Error('Failed to add rental');
    }
    const data = await response.json();
    return data;
});

// Async thunk for editing a rental
export const editRentalAsync = createAsyncThunk('rentals/editRental', async ({ id, updatedRental }) => {
    const response = await fetch(`http://localhost:5000/api/rentals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRental),
    });
    if (!response.ok) {
        throw new Error('Failed to update rental');
    }
    const data = await response.json();
    return data;
});

// Async thunk for deleting a rental
export const removeRentalAsync = createAsyncThunk('rentals/removeRental', async (id) => {
    const response = await fetch(`http://localhost:5000/api/rentals/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Failed to delete rental');
    }
    return id;
});

// Slice definition
const rentalsSlice = createSlice({
    name: 'rentals',
    initialState: {
        rentals: [],
        status: 'idle', // idle, loading, succeeded, failed
        error: null,
    },
    reducers: {
        // Local add action (optional if using async thunks)
        addRental(state, action) {
            state.rentals.push(action.payload);
        },
        // Local edit action
        editRental(state, action) {
            const rentalIndex = state.rentals.findIndex((rental) => rental.id === action.payload.id);
            if (rentalIndex !== -1) {
                state.rentals[rentalIndex] = action.payload;
            }
        },
        // Local remove action
        removeRental(state, action) {
            state.rentals = state.rentals.filter((rental) => rental.id !== action.payload);
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch rentals
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
            // Add rental
            .addCase(addRentalAsync.fulfilled, (state, action) => {
                state.rentals.push(action.payload);
            })
            // Edit rental
            .addCase(editRentalAsync.fulfilled, (state, action) => {
                const rentalIndex = state.rentals.findIndex((rental) => rental.id === action.payload.id);
                if (rentalIndex !== -1) {
                    state.rentals[rentalIndex] = action.payload;
                }
            })
            // Remove rental
            .addCase(removeRentalAsync.fulfilled, (state, action) => {
                state.rentals = state.rentals.filter((rental) => rental.id !== action.payload);
            });
    },
});

// Export actions
export const { addRental, editRental, removeRental } = rentalsSlice.actions;

// Export reducer
export default rentalsSlice.reducer;
