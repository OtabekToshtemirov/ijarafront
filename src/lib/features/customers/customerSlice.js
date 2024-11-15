import { createSlice} from "@reduxjs/toolkit";

const customerSlice = createSlice({
    name: 'customer',
    initialState: {
        customers: []
    },
    reducers: {
        addCustomer(state, action) {
            state.customers.push(action.payload);
        },
        editCustomer(state, action) {
            const customer = state.customers.find(customer => customer.id === action.payload.id);
            if (customer) {
                customer.name = action.payload.name;
                customer.email = action.payload.email;
                customer.phone = action.payload.phone;
            }
        },
        removeCustomer(state, action) {
            state.customers = state.customers.filter(customer => customer.id !== action.payload);
        }
    }
} );

export const { addCustomer, editCustomer, removeCustomer } = customerSlice.actions;