import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../config/api';
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/expenses';

// Async thunks
export const createExpense = createAsyncThunk(
    'expenses/createExpense',
    async (expenseData) => {
        const response = await axios.post(BASE_URL, expenseData);
        return { expense: response.data.data };
    }
);

export const fetchExpenses = createAsyncThunk(
    'expenses/fetchExpenses',
    async (filters = {}) => {
        const response = await axios.get(BASE_URL, { params: filters });
        return response.data;
    }
);

export const fetchExpenseStats = createAsyncThunk(
    'expenses/fetchExpenseStats',
    async (params = {}) => {
        const response = await axios.get(`${BASE_URL}/stats`, { params });
        return response.data;
    }
);

export const updateExpense = createAsyncThunk(
    'expenses/updateExpense',
    async ({ id, data }) => {
        const response = await axios.put(`${BASE_URL}/${id}`, data);
        return response.data;
    }
);

export const getExpenseById = createAsyncThunk(
    'expenses/getExpenseById',
    async (id) => {
        const response = await axios.get(`${BASE_URL}/${id}`);
        return response.data;
    }
);

export const deleteExpense = createAsyncThunk(
    'expenses/deleteExpense',
    async (id) => {
        await axios.delete(`${BASE_URL}/${id}`);
        return id;
    }
);

const expensesSlice = createSlice({
    name: 'expenses',
    initialState: {
        items: [],
        stats: null,
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Create expense
            .addCase(createExpense.pending, (state) => {
                state.loading = true;
            })
            .addCase(createExpense.fulfilled, (state, action) => {
                state.loading = false;
                state.items.unshift(action.payload.expense);
            })
            .addCase(createExpense.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            // Fetch expenses
            .addCase(fetchExpenses.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchExpenses.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchExpenses.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            // Fetch stats
            .addCase(fetchExpenseStats.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchExpenseStats.fulfilled, (state, action) => {
                state.loading = false;
                state.stats = action.payload;
            })
            .addCase(fetchExpenseStats.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            // Update expense
            .addCase(updateExpense.fulfilled, (state, action) => {
                const index = state.items.findIndex(item => item._id === action.payload.expense._id);
                if (index !== -1) {
                    state.items[index] = action.payload.expense;
                }
            })
            // Delete expense
            .addCase(deleteExpense.fulfilled, (state, action) => {
                state.items = state.items.filter(item => item._id !== action.payload);
            });
    },
});

export default expensesSlice.reducer;
