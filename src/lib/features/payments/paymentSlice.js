import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

export const fetchPayments = createAsyncThunk(
    'payments/fetchPayments', 
    async () => {
        const response = await axios.get(`${BASE_URL}/payments`);
        return response.data;
    }
);

export const fetchPaymentsByCustomerId = createAsyncThunk(
    'payments/fetchPaymentsByCustomerId',
    async (customerId) => {
        const response = await axios.get(`${BASE_URL}/payments/customer/${customerId}`);
        return response.data;
    }
);

export const createPayment = createAsyncThunk(
    'payments/createPayment',
    async (paymentData) => {
        try {
            const response = await axios.post(`${BASE_URL}/payments`, paymentData);
            return response.data;
        } catch (error) {
            if (!error.response) {
                throw new Error('Server bilan bog\'lanishda xatolik');
            }
            throw new Error(
                error.response?.data?.message || 
                error.message || 
                'To\'lovni qo\'shishda xatolik'
            );
        }
    }
);

const paymentSlice = createSlice({
    name: 'payments',
    initialState: {
        payments: [],
        status: 'idle',
        error: null,
        addStatus: 'idle',
        addError: null,
    },
    reducers: {
        clearAddStatus: (state) => {
            state.addStatus = 'idle';
            state.addError = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Handle fetchPayments
            .addCase(fetchPayments.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchPayments.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.payments = action.payload;
            })
            .addCase(fetchPayments.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
            })
            
            // Handle fetchPaymentsByCustomerId
            .addCase(fetchPaymentsByCustomerId.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchPaymentsByCustomerId.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.payments = action.payload;
            })
            .addCase(fetchPaymentsByCustomerId.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
            })
            
            // Handle createPayment
            .addCase(createPayment.pending, (state) => {
                state.addStatus = 'loading';
                state.addError = null;
            })
            .addCase(createPayment.fulfilled, (state, action) => {
                state.addStatus = 'succeeded';
                state.payments.push(action.payload);
                state.addError = null;
            })
            .addCase(createPayment.rejected, (state, action) => {
                state.addStatus = 'failed';
                state.addError = action.error.message;
            });
    },
});

export const { clearAddStatus } = paymentSlice.actions;

// Selectors
export const selectPayments = (state) => state.payments.payments;
export const selectPaymentsStatus = (state) => state.payments.status;
export const selectPaymentsError = (state) => state.payments.error;
export const selectAddPaymentStatus = (state) => state.payments.addStatus;
export const selectAddPaymentError = (state) => state.payments.addError;

export default paymentSlice.reducer;