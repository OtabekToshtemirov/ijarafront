import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/customers';

// Async thunk for fetching customers
export const fetchCustomers = createAsyncThunk(
    'customers/fetchCustomers',
    async () => {
        const response = await axios.get(BASE_URL);
        return response.data;
    }
);

// Async thunk for creating a customer
export const createCustomer = createAsyncThunk(
    'customers/createCustomer',
    async (customerData) => {
        const response = await axios.post(BASE_URL, customerData);
        return response.data;
    }
);

// Async thunk for deleting a customer
export const deleteCustomerAsync = createAsyncThunk(
    'customers/deleteCustomer',
    async (customerId) => {
        await axios.delete(`${BASE_URL}/${customerId}`);
        return customerId;
    }
);

// Async thunk for updating a customer
export const updateCustomerAsync = createAsyncThunk(
    'customers/updateCustomer',
    async (customerData) => {
        const response = await axios.put(`${BASE_URL}/${customerData._id}`, customerData);
        return response.data;
    }
);

const customerSlice = createSlice({
    name: 'customers',
    initialState: {
        customers: [],
        status: 'idle',
        error: null,
        addStatus: 'idle',
        addError: null,
        updateStatus: 'idle',
        updateError: null,
        deleteStatus: 'idle',
        deleteError: null
    },
    reducers: {
        clearAddStatus: (state) => {
            state.addStatus = 'idle';
            state.addError = null;
        },
        clearUpdateStatus: (state) => {
            state.updateStatus = 'idle';
            state.updateError = null;
        },
        clearDeleteStatus: (state) => {
            state.deleteStatus = 'idle';
            state.deleteError = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch customers cases
            .addCase(fetchCustomers.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchCustomers.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.customers = action.payload;
                state.error = null;
            })
            .addCase(fetchCustomers.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
            })

            // Create customer cases
            .addCase(createCustomer.pending, (state) => {
                state.addStatus = 'loading';
                state.addError = null;
            })
            .addCase(createCustomer.fulfilled, (state, action) => {
                state.addStatus = 'succeeded';
                state.customers.push(action.payload);
                state.addError = null;
            })
            .addCase(createCustomer.rejected, (state, action) => {
                state.addStatus = 'failed';
                state.addError = action.error.message;
            })

            // Update customer cases
            .addCase(updateCustomerAsync.pending, (state) => {
                state.updateStatus = 'loading';
            })
            .addCase(updateCustomerAsync.fulfilled, (state, action) => {
                state.updateStatus = 'succeeded';
                state.customers = state.customers.map(customer =>
                    customer._id === action.payload._id ? action.payload : customer
                );
            })
            .addCase(updateCustomerAsync.rejected, (state, action) => {
                state.updateStatus = 'failed';
                state.updateError = action.error.message;
            })

            // Delete customer cases
            .addCase(deleteCustomerAsync.pending, (state) => {
                state.deleteStatus = 'loading';
                state.deleteError = null;
            })
            .addCase(deleteCustomerAsync.fulfilled, (state, action) => {
                state.deleteStatus = 'succeeded';
                state.customers = state.customers.filter(
                    customer => customer._id !== action.payload
                );
                state.deleteError = null;
            })
            .addCase(deleteCustomerAsync.rejected, (state, action) => {
                state.deleteStatus = 'failed';
                state.deleteError = action.error.message;
            });
    }
});

export const { clearAddStatus, clearUpdateStatus, clearDeleteStatus } = customerSlice.actions;

export default customerSlice.reducer;