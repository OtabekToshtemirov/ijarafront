import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Initial state
const initialState = {
    customers: [],
    status: 'idle',
    error: null,
};

// Async thunk for fetching customers
export const fetchCustomers = createAsyncThunk(
    'customers/fetchCustomers',
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetch('http://localhost:5000/api/customers');
            if (!response.ok) throw new Error('Failed to fetch customers');
            return await response.json();
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Async thunk for adding a customer
export const addCustomerAsync = createAsyncThunk(
    'customers/addCustomer',
    async (customer, { rejectWithValue }) => {
        try {
            const response = await fetch('http://localhost:5000/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(customer),
            });
            if (!response.ok) throw new Error('Failed to add customer');
            return await response.json();
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Async thunk for updating a customer
export const updateCustomerAsync = createAsyncThunk(
    'customers/updateCustomer',
    async (customer, { rejectWithValue }) => {
        try {
            const response = await fetch(`http://localhost:5000/api/customers/${customer._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(customer),
            });
            if (!response.ok) throw new Error('Failed to update customer');
            return await response.json();
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Async thunk for deleting a customer
export const deleteCustomerAsync = createAsyncThunk(
    'customers/deleteCustomer',
    async (customerId, { rejectWithValue }) => {
        try {
            const response = await fetch(`http://localhost:5000/api/customers/${customerId}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete customer');
            return customerId;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Customer slice
const customerSlice = createSlice({
    name: 'customers',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch Customers
            .addCase(fetchCustomers.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchCustomers.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.customers = action.payload;
            })
            .addCase(fetchCustomers.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            // Add Customer
            .addCase(addCustomerAsync.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(addCustomerAsync.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.customers.push(action.payload);
            })
            .addCase(addCustomerAsync.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            // Update Customer
            .addCase(updateCustomerAsync.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(updateCustomerAsync.fulfilled, (state, action) => {
                state.status = 'succeeded';
                const index = state.customers.findIndex(customer => customer._id === action.payload._id);
                if (index !== -1) {
                    state.customers[index] = action.payload;
                }
            })
            .addCase(updateCustomerAsync.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            // Delete Customer
            .addCase(deleteCustomerAsync.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(deleteCustomerAsync.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.customers = state.customers.filter(customer => customer._id !== action.payload);
            })
            .addCase(deleteCustomerAsync.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            });
    },
});

export default customerSlice.reducer;