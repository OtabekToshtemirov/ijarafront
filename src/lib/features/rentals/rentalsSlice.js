import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

// Async thunks
export const fetchRentals = createAsyncThunk(
    'rentals/fetchRentals',
    async () => {
        const response = await axios.get(`${BASE_URL}/rentals`);
        console.log(response.data);
        return response.data || [];
    }
);

export const fetchActiveRentals = createAsyncThunk(
    'rentals/fetchActiveRentals',
    async () => {
        const response = await axios.get(`${BASE_URL}/rentals/active`);
        return response.data.data;
    }
);

export const fetchCompleteRentals = createAsyncThunk(
    'rentals/fetchCompleteRentals',
    async () => {
        const response = await axios.get(`${BASE_URL}/rentals/complete`);
        return response.data.data;
    }
);

export const fetchCanceledRentals = createAsyncThunk(
    'rentals/fetchCanceledRentals',
    async () => {
        const response = await axios.get(`${BASE_URL}/rentals/canceled`);
        return response.data.data;
    }
);

export const fetchRentalById = createAsyncThunk(
    'rentals/fetchRentalById',
    async (id) => {
        const response = await axios.get(`${BASE_URL}/rentals/${id}`);
        return response.data.data;
    }
);

export const createRental = createAsyncThunk(
    'rentals/createRental',
    async (rentalData) => {
        try {
            const response = await axios.post(`${BASE_URL}/rentals`, rentalData);
            return response.data.data;
        } catch (error) {
            throw new Error(
                error.response?.data?.message || 
                error.message || 
                'Ijarani yaratishda xatolik yuz berdi'
            );
        }
    }
);

export const updateRental = createAsyncThunk(
    'rentals/updateRental',
    async ({ id, data }) => {
        try {
            const response = await axios.put(`${BASE_URL}/rentals/${id}`, data);
            return response.data.data;
        } catch (error) {
            throw new Error(
                error.response?.data?.message || 
                error.message || 
                'Ijarani yangilashda xatolik yuz berdi'
            );
        }
    }
);

export const returnProducts = createAsyncThunk(
    'rentals/returnProducts',
    async (returnData) => {
        try {
            const response = await axios.post(`${BASE_URL}/rentals/return`, returnData);
            return response.data.data;
        } catch (error) {
            throw new Error(
                error.response?.data?.message || 
                error.message || 
                'Mahsulotni qaytarishda xatolik yuz berdi'
            );
        }
    }
);

export const deleteRental = createAsyncThunk(
    'rentals/deleteRental',
    async (id) => {
        try {
            await axios.delete(`${BASE_URL}/rentals/${id}`);
            return id;
        } catch (error) {
            throw new Error(
                error.response?.data?.message || 
                error.message || 
                'Ijarani o\'chirishda xatolik yuz berdi'
            );
        }
    }
);

export const fetchRentalsByCustomerId = createAsyncThunk(
    'rentals/fetchRentalsByCustomerId',
    async (customerId) => {
        const response = await axios.get(`${BASE_URL}/rentals/customer/${customerId}`);
        return response.data.data;
    }
);

export const fetchRentalsByProductId = createAsyncThunk(
    'rentals/fetchRentalsByProductId',
    async (productId) => {
        const response = await axios.get(`${BASE_URL}/rentals/product/${productId}`);
        return response.data.data;
    }
);

export const fetchRentalsByCarId = createAsyncThunk(
    'rentals/fetchRentalsByCarId',
    async (carId) => {
        const response = await axios.get(`${BASE_URL}/rentals/car/${carId}`);
        return response.data.data;
    }
);

const initialState = {
    rentals: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
    currentRental: null,
    currentRentalStatus: 'idle',
    currentRentalError: null,
    addStatus: 'idle',
    addError: null,
    updateStatus: 'idle',
    updateError: null,
    returnStatus: 'idle',
    returnError: null
};

const rentalsSlice = createSlice({
    name: 'rentals',
    initialState,
    reducers: {
        clearRentalSummary: (state) => {
            state.currentRental = null;
            state.currentRentalStatus = 'idle';
            state.currentRentalError = null;
        },
        clearAddStatus: (state) => {
            state.addStatus = 'idle';
            state.addError = null;
        },
        clearUpdateStatus: (state) => {
            state.updateStatus = 'idle';
            state.updateError = null;
        },
        clearReturnStatus: (state) => {
            state.returnStatus = 'idle';
            state.returnError = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch all rentals
            .addCase(fetchRentals.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchRentals.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.rentals = Array.isArray(action.payload) ? action.payload : [];
                state.error = null;
            })
            .addCase(fetchRentals.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
                state.rentals = [];
            })

            // Fetch rental by id
            .addCase(fetchRentalById.pending, (state) => {
                state.currentRentalStatus = 'loading';
            })
            .addCase(fetchRentalById.fulfilled, (state, action) => {
                state.currentRentalStatus = 'succeeded';
                state.currentRental = action.payload;
            })
            .addCase(fetchRentalById.rejected, (state, action) => {
                state.currentRentalStatus = 'failed';
                state.currentRentalError = action.error.message;
            })

            // Create rental
            .addCase(createRental.pending, (state) => {
                state.addStatus = 'loading';
            })
            .addCase(createRental.fulfilled, (state, action) => {
                state.addStatus = 'succeeded';
                state.rentals.push(action.payload);
            })
            .addCase(createRental.rejected, (state, action) => {
                state.addStatus = 'failed';
                state.addError = action.error.message;
            })

            // Update rental
            .addCase(updateRental.pending, (state) => {
                state.updateStatus = 'loading';
            })
            .addCase(updateRental.fulfilled, (state, action) => {
                state.updateStatus = 'succeeded';
                const index = state.rentals.findIndex(rental => rental._id === action.payload._id);
                if (index !== -1) {
                    state.rentals[index] = action.payload;
                }
            })
            .addCase(updateRental.rejected, (state, action) => {
                state.updateStatus = 'failed';
                state.updateError = action.error.message;
            })

            // Return products
            .addCase(returnProducts.pending, (state) => {
                state.returnStatus = 'loading';
            })
            .addCase(returnProducts.fulfilled, (state, action) => {
                state.returnStatus = 'succeeded';
                const index = state.rentals.findIndex(rental => rental._id === action.payload._id);
                if (index !== -1) {
                    // Update the rental with both borrowed and returned products
                    state.rentals[index] = {
                        ...action.payload,
                        borrowedProducts: action.payload.borrowedProducts || [],
                        returnedProducts: action.payload.returnedProducts || []
                    };
                    // Update current rental if it matches
                    if (state.currentRental && state.currentRental._id === action.payload._id) {
                        state.currentRental = {
                            ...action.payload,
                            borrowedProducts: action.payload.borrowedProducts || [],
                            returnedProducts: action.payload.returnedProducts || []
                        };
                    }
                }
            })
            .addCase(returnProducts.rejected, (state, action) => {
                state.returnStatus = 'failed';
                state.returnError = action.error.message;
            })

            // Delete rental
            .addCase(deleteRental.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(deleteRental.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.rentals = state.rentals.filter(rental => rental._id !== action.payload);
            })
            .addCase(deleteRental.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
            })

            // Fetch active rentals
            .addCase(fetchActiveRentals.fulfilled, (state, action) => {
                state.rentals = action.payload;
                state.status = 'succeeded';
            })

            // Fetch complete rentals
            .addCase(fetchCompleteRentals.fulfilled, (state, action) => {
                state.rentals = action.payload;
                state.status = 'succeeded';
            })

            // Fetch canceled rentals
            .addCase(fetchCanceledRentals.fulfilled, (state, action) => {
                state.rentals = action.payload;
                state.status = 'succeeded';
            })

            // Fetch rentals by customer
            .addCase(fetchRentalsByCustomerId.fulfilled, (state, action) => {
                state.rentals = action.payload;
                state.status = 'succeeded';
            })

            // Fetch rentals by product
            .addCase(fetchRentalsByProductId.fulfilled, (state, action) => {
                state.rentals = action.payload;
                state.status = 'succeeded';
            })

            // Fetch rentals by car
            .addCase(fetchRentalsByCarId.fulfilled, (state, action) => {
                state.rentals = action.payload;
                state.status = 'succeeded';
            });
    }
});

// Selectors
export const selectAllRentals = (state) => state.rentals.rentals;
export const selectRentalStatus = (state) => state.rentals.status;
export const selectRentalError = (state) => state.rentals.error;
export const selectCurrentRentalSummary = (state) => state.rentals.currentRental;
export const selectCurrentRentalStatus = (state) => state.rentals.currentRentalStatus;
export const selectCurrentRentalError = (state) => state.rentals.currentRentalError;
export const selectAddRentalStatus = (state) => state.rentals.addStatus;
export const selectAddRentalError = (state) => state.rentals.addError;
export const selectUpdateRentalStatus = (state) => state.rentals.updateStatus;
export const selectUpdateRentalError = (state) => state.rentals.updateError;
export const selectReturnRentalStatus = (state) => state.rentals.returnStatus;
export const selectReturnRentalError = (state) => state.rentals.returnError;

export const { clearRentalSummary, clearAddStatus, clearUpdateStatus, clearReturnStatus } = rentalsSlice.actions;

export default rentalsSlice.reducer;