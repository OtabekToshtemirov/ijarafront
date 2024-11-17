// Redux logic (separate file: e.g., paymentSlice.js)
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

// Async actions for payments
export const fetchPayments = createAsyncThunk(
    "payments/fetchPayments",
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetch("http://localhost:5000/api/payments");
            if (!response.ok) throw new Error("Failed to fetch payments");
            return await response.json();
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const addPayment = createAsyncThunk(
    "payments/addPayment",
    async (payment, { rejectWithValue }) => {
        try {
            const response = await fetch("http://localhost:5000/api/payments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payment),
            });
            if (!response.ok) throw new Error("Failed to add payment");
            return await response.json();
        } catch (error) {
            return rejectWithValue(error.message);
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
            .addCase(fetchPayments.pending, (state) => {
                state.status = "loading";
            })
            .addCase(fetchPayments.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.payments = action.payload;
            })
            .addCase(fetchPayments.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload;
            })
            .addCase(addPayment.fulfilled, (state, action) => {
                state.payments.push(action.payload);
            });
    },
});

export default paymentSlice.reducer;
