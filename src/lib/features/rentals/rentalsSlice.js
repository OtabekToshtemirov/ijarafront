import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

// Async thunks
export const fetchRentals = createAsyncThunk(
    'rentals/fetchRentals',
    async () => {
        try {
            const response = await axios.get(`${BASE_URL}/rentals`);
            return response.data;
        } catch (error) {
            console.error('Error fetching rentals:', error);
            throw error;
        }
    }
);

export const fetchActiveRentals = createAsyncThunk(
    'rentals/fetchActiveRentals',
    async () => {
        const response = await axios.get(`${BASE_URL}/rentals/active`);
        return response.data;
    }
);

export const fetchCompleteRentals = createAsyncThunk(
    'rentals/fetchCompleteRentals',
    async () => {
        const response = await axios.get(`${BASE_URL}/rentals/complete`);
        return response.data;
    }
);

export const fetchCanceledRentals = createAsyncThunk(
    'rentals/fetchCanceledRentals',
    async () => {
        const response = await axios.get(`${BASE_URL}/rentals/canceled`);
        return response.data;
    }
);

export const fetchRentalById = createAsyncThunk(
    'rentals/fetchRentalById',
    async (id) => {
        const response = await axios.get(`${BASE_URL}/rentals/${id}`);
        return response.data;
    }
);

export const createRental = createAsyncThunk(
    'rentals/createRental',
    async (rentalData) => {
        try {
            console.log('Sending rental data:', rentalData); // Debug log
            const response = await axios.post(`${BASE_URL}/rentals`, rentalData);
            console.log('Server response:', response.data); // Debug log
            return response.data;
        } catch (error) {
            console.error('Full error object:', error); // Debug log
            console.error('Error response:', error.response); // Debug log
            console.error('Error message:', error.message); // Debug log
            
            // Check if it's a network error
            if (!error.response) {
                throw new Error('Server bilan bog\'lanishda xatolik yuz berdi. Server ishga tushganligini tekshiring.');
            }
            
            // Handle different types of errors
            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            } else if (error.response?.data?.error) {
                throw new Error(error.response.data.error);
            } else if (error.message) {
                throw new Error(error.message);
            } else {
                throw new Error('Ijarani yaratishda xatolik yuz berdi');
            }
        }
    }
);

export const updateRental = createAsyncThunk(
    'rentals/updateRental',
    async ({ id, data }) => {
        try {
            const response = await axios.put(`${BASE_URL}/rentals/${id}`, data);
            return response.data;
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
            return response.data;
        } catch (error) {
            throw new Error(
                error.response?.data?.message || 
                error.message || 
                'Mahsulotni qaytarishda xatolik yuz berdi'
            );
        }
    }
);

export const returnProduct = createAsyncThunk(
    'rentals/returnProduct',
    async (returnData, { rejectWithValue }) => {
        try {
            const { rentalId, productId, quantity, returnDate, discountDays } = returnData;
            const response = await axios.post(`${BASE_URL}/rentals/${rentalId}/return`, {
                productId,
                quantity,
                returnDate,
                discountDays
            });
            return response.data;
        } catch (error) {
            console.error('Return error:', error);
            return rejectWithValue(
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
        try {
            const response = await axios.get(`${BASE_URL}/rentals/customer/${customerId}`);
            return response.data;
        } catch (error) {
            throw new Error(
                error.response?.data?.message || 
                error.message || 
                'Mijozning ijaralarini yuklashda xatolik'
            );
        }
    }
);

export const fetchRentalsByProductId = createAsyncThunk(
    'rentals/fetchRentalsByProductId',
    async (productId) => {
        const response = await axios.get(`${BASE_URL}/rentals/product/${productId}`);
        return response.data;
    }
);

export const fetchRentalsByCarId = createAsyncThunk(
    'rentals/fetchRentalsByCarId',
    async (carId) => {
        const response = await axios.get(`${BASE_URL}/rentals/car/${carId}`);
        return response.data;
    }
);

export const createPayment = createAsyncThunk(
    'rentals/createPayment',
    async (paymentData) => {
        try {
            console.log('Sending payment data:', paymentData);
            const response = await axios.post(`${BASE_URL}/payments`, paymentData);
            console.log('Payment response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Payment error:', error);
            if (!error.response) {
                throw new Error('Server bilan bog\'lanishda xatolik yuz berdi');
            }
            throw new Error(
                error.response?.data?.message || 
                error.message || 
                'To\'lovni saqlashda xatolik yuz berdi'
            );
        }
    }
);

const formatRentalData = (rental) => ({
    ...rental,
    borrowedProducts: (rental.borrowedProducts || []).map(bp => ({
        ...bp,
        product: bp.product || {}
    })),
    returnedProducts: (rental.returnedProducts || []).map(rp => ({
        ...rp,
        product: rp.product || {}
    }))
});

const initialState = {
    rentals: [],
    status: 'idle',
    error: null,
    currentRental: null,
    currentRentalStatus: 'idle',
    currentRentalError: null,
    customerRentals: [],
    customerRentalsStatus: 'idle',
    customerRentalsError: null,
    addStatus: 'idle',
    addError: null,
    updateStatus: 'idle',
    updateError: null,
    returnStatus: 'idle',
    returnError: null,
    paymentStatus: 'idle',
    paymentError: null
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
        },
        clearPaymentStatus: (state) => {
            state.paymentStatus = 'idle';
            state.paymentError = null;
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
                state.rentals = action.payload;
                state.error = null;
            })
            .addCase(fetchRentals.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
            })

            // Fetch rental by id
            .addCase(fetchRentalById.pending, (state) => {
                state.currentRentalStatus = 'loading';
            })
            .addCase(fetchRentalById.fulfilled, (state, action) => {
                state.currentRentalStatus = 'succeeded';
                state.currentRental = formatRentalData(action.payload);
            })
            .addCase(fetchRentalById.rejected, (state, action) => {
                state.currentRentalStatus = 'failed';
                state.currentRentalError = action.error.message;
            })

            // Create rental
            .addCase(createRental.pending, (state) => {
                state.addStatus = 'loading';
                state.addError = null;
            })
            .addCase(createRental.fulfilled, (state, action) => {
                state.addStatus = 'succeeded';
                state.rentals.push(formatRentalData(action.payload));
                state.addError = null;
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
                    state.rentals[index] = formatRentalData(action.payload);
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
                    state.rentals[index] = formatRentalData({
                        ...action.payload,
                        borrowedProducts: action.payload.borrowedProducts || [],
                        returnedProducts: action.payload.returnedProducts || []
                    });
                    // Update current rental if it matches
                    if (state.currentRental && state.currentRental._id === action.payload._id) {
                        state.currentRental = formatRentalData({
                            ...action.payload,
                            borrowedProducts: action.payload.borrowedProducts || [],
                            returnedProducts: action.payload.returnedProducts || []
                        });
                    }
                }
            })
            .addCase(returnProducts.rejected, (state, action) => {
                state.returnStatus = 'failed';
                state.returnError = action.error.message;
            })

            // Return product
            .addCase(returnProduct.pending, (state) => {
                state.returnStatus = 'loading';
            })
            .addCase(returnProduct.fulfilled, (state, action) => {
                state.returnStatus = 'succeeded';
                const index = state.rentals.findIndex(rental => rental._id === action.payload._id);
                if (index !== -1) {
                    state.rentals[index] = action.payload;
                }
            })
            .addCase(returnProduct.rejected, (state, action) => {
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
                state.rentals = action.payload || [];
                state.status = 'succeeded';
            })

            // Fetch complete rentals
            .addCase(fetchCompleteRentals.fulfilled, (state, action) => {
                state.rentals = action.payload || [];
                state.status = 'succeeded';
            })

            // Fetch canceled rentals
            .addCase(fetchCanceledRentals.fulfilled, (state, action) => {
                state.rentals = action.payload || [];
                state.status = 'succeeded';
            })

            // Fetch rentals by customer
            .addCase(fetchRentalsByCustomerId.pending, (state) => {
                state.customerRentalsStatus = 'loading';
                state.customerRentalsError = null;
            })
            .addCase(fetchRentalsByCustomerId.fulfilled, (state, action) => {
                state.customerRentalsStatus = 'succeeded';
                state.customerRentals = action.payload;
                state.customerRentalsError = null;
            })
            .addCase(fetchRentalsByCustomerId.rejected, (state, action) => {
                state.customerRentalsStatus = 'failed';
                state.customerRentalsError = action.error.message;
            })

            // Fetch rentals by product
            .addCase(fetchRentalsByProductId.fulfilled, (state, action) => {
                state.rentals = action.payload || [];
                state.status = 'succeeded';
            })

            // Fetch rentals by car
            .addCase(fetchRentalsByCarId.fulfilled, (state, action) => {
                state.rentals = action.payload || [];
                state.status = 'succeeded';
            })

            // Create payment
            .addCase(createPayment.pending, (state) => {
                state.paymentStatus = 'loading';
                state.paymentError = null;
            })
            .addCase(createPayment.fulfilled, (state, action) => {
                state.paymentStatus = 'succeeded';
                state.paymentError = null;
                // Update the rental in state if needed
                if (action.payload.rental) {
                    const index = state.rentals.findIndex(r => r._id === action.payload.rental._id);
                    if (index !== -1) {
                        state.rentals[index] = action.payload.rental;
                    }
                }
            })
            .addCase(createPayment.rejected, (state, action) => {
                state.paymentStatus = 'failed';
                state.paymentError = action.error.message;
            });
    }
});

// Selectors
export const selectRentals = (state) => state.rentals.rentals;
export const selectRentalsStatus = (state) => state.rentals.status;
export const selectRentalsError = (state) => state.rentals.error;
export const selectReturnRentalStatus = (state) => state.rentals.returnStatus;
export const selectCurrentRental = (state) => state.rentals.currentRental;
export const selectCurrentRentalStatus = (state) => state.rentals.currentRentalStatus;
export const selectAddRentalStatus = (state) => state.rentals.addStatus;
export const selectAddRentalError = (state) => state.rentals.addError;
export const selectCustomerRentals = (state) => state.rentals.customerRentals;
export const selectCustomerRentalsStatus = (state) => state.rentals.customerRentalsStatus;
export const selectCustomerRentalsError = (state) => state.rentals.customerRentalsError;
export const selectPaymentStatus = (state) => state.rentals.paymentStatus;
export const selectPaymentError = (state) => state.rentals.paymentError;

export const { clearRentalSummary, clearAddStatus, clearUpdateStatus, clearReturnStatus, clearPaymentStatus } = rentalsSlice.actions;

export default rentalsSlice.reducer;