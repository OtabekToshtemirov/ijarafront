import { createSlice, createAsyncThunk} from "@reduxjs/toolkit";

export const fetchCustomers = createAsyncThunk('customers/fetchCustomers', async () => {
    const response = await fetch('http://localhost:5000/api/customers');
    if (!response.ok) {
        throw new Error('Failed to fetch customers');
    }
    const data = await response.json();
    return data;
});


const customerSlice = createSlice({
    name: 'customer',
    initialState: {
        customers: [],
        status: 'idle',
        error: null,
    },
    reducers: {
        addCustomer(state, action) {
            state.customers.push(action.payload);
        },
        editCustomer(state, action) {
            const customer = state.customers.find(customer => customer.id === action.payload.id);
            if (customer) {
                customer.name = action.payload.name;
                customer.phone = action.payload.phone;
                customer.balance = action.payload.balance;
            }
        },
        removeCustomer(state, action) {
            state.customers = state.customers.filter(customer => customer.id !== action.payload);
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCustomers.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchCustomers.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.customers = action.payload;
            })
            .addCase(fetchCustomers.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
            });
    },
});

export const { addCustomer, editCustomer, removeCustomer } = customerSlice.actions;
export default customerSlice.reducer;
