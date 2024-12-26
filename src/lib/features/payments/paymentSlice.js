import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

export const fetchPayments = createAsyncThunk(
    "payments/fetchPayments",
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get("http://localhost:5000/api/payments");
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const addPayment = createAsyncThunk(
    "payments/addPayment",
    async (payment, { rejectWithValue }) => {
        try {
            const response = await axios.post("http://localhost:5000/api/payments", payment);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const editPayment = createAsyncThunk(
    "payments/editPayment",
    async ({ _id, updatedPayment }, { rejectWithValue }) => {
        try {
            const response = await axios.put(`http://localhost:5000/api/payments/${_id}`, updatedPayment);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const fetchPaymentsByCustomerId = createAsyncThunk(
    "payments/fetchPaymentsByCustomerId",
    async (customerId, { rejectWithValue }) => {
        try {
            const response = await axios.get(`http://localhost:5000/api/payments/customer/${customerId}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const removePayment = createAsyncThunk(
    "payments/removePayment",
    async (id, { rejectWithValue }) => {
        try {
            await axios.delete(`http://localhost:5000/api/payments/${id}`);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

const paymentSlice = createSlice({
    name: "payment",
    initialState: {
        payments: [],
        status: "idle",
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch payments
            .addCase(fetchPayments.pending, (state) => {
                state.status = "loading";
            })
            .addCase(fetchPayments.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.payments = action.payload;
                state.error = null;
            })
            .addCase(fetchPayments.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload;
            })
            // Add payment
            .addCase(addPayment.pending, (state) => {
                state.status = "loading";
            })
            .addCase(addPayment.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.payments.push(action.payload);
                state.error = null;
            })
            .addCase(addPayment.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload;
            })
            // Edit payment
            .addCase(editPayment.pending, (state) => {
                state.status = "loading";
            })
            .addCase(editPayment.fulfilled, (state, action) => {
                state.status = "succeeded";
                const index = state.payments.findIndex(payment => payment._id === action.payload._id);
                if (index !== -1) {
                    state.payments[index] = action.payload;
                }
                state.error = null;
            })
            .addCase(editPayment.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload;
            })
            // Fetch payments by customer ID
            .addCase(fetchPaymentsByCustomerId.pending, (state) => {
                state.status = "loading";
            })
            .addCase(fetchPaymentsByCustomerId.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.payments = action.payload;
                state.error = null;
            })
            .addCase(fetchPaymentsByCustomerId.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload;
            })
            // Remove payment
            .addCase(removePayment.pending, (state) => {
                state.status = "loading";
            })
            .addCase(removePayment.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.payments = state.payments.filter(payment => payment._id !== action.payload);
                state.error = null;
            })
            .addCase(removePayment.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload;
            });
    },
});

export default paymentSlice.reducer;