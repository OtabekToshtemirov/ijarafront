import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchPayments = createAsyncThunk('payments/fetchPayments', async () => {
    const response = await fetch('http://localhost:5000/api/payments');
    if (!response.ok) {
        throw new Error('Could not fetch payments');
    }
    const data = await response.json();
    return data;
});

export const fetchPaymentsByCustomerId = createAsyncThunk(
    'payments/fetchPaymentsByCustomerId',
    async (customerId) => {
        const response = await fetch(`http://localhost:5000/api/payments/customer/${customerId}`);
        if (!response.ok) {
            throw new Error('Could not fetch payments');
        }
        const data = await response.json();
        return data;
    }
);

export const createPayment = createAsyncThunk(
    'payments/createPayment',
    async (payment) => {
        const response = await fetch('http://localhost:5000/api/payments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payment),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message);
        }
        const data = await response.json();
        return data;
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
            .addCase(createPayment.pending, (state) => {
                state.addStatus = 'loading';
            })
            .addCase(createPayment.fulfilled, (state, action) => {
                state.addStatus = 'succeeded';
                state.payments.push(action.payload);
            })
            .addCase(createPayment.rejected, (state, action) => {
                state.addStatus = 'failed';
                state.addError = action.error.message;
            });
    },
});

// Selectors
export const selectPayments = (state) => state.payments.payments;
export const selectPaymentsStatus = (state) => state.payments.status;
export const selectPaymentsError = (state) => state.payments.error;
export const selectAddPaymentStatus = (state) => state.payments.addStatus;
export const selectAddPaymentError = (state) => state.payments.addError;

export const { clearAddStatus } = paymentSlice.actions;

export default paymentSlice.reducer;