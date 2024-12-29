import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

// Async thunks
export const fetchExpenses = createAsyncThunk(
    'expenses/fetchExpenses',
    async () => {
        const response = await axios.get(`${BASE_URL}/expenses`);
        return response.data;
    }
);

export const createExpense = createAsyncThunk(
    'expenses/createExpense',
    async (expenseData) => {
        try {
            const response = await axios.post(`${BASE_URL}/expenses`, expenseData);
            return response.data;
        } catch (error) {
            throw new Error(
                error.response?.data?.message || 
                error.message || 
                'Xarajatni qo\'shishda xatolik'
            );
        }
    }
);

export const updateExpense = createAsyncThunk(
    'expenses/updateExpense',
    async ({ id, expenseData }) => {
        try {
            const response = await axios.put(`${BASE_URL}/expenses/${id}`, expenseData);
            return response.data;
        } catch (error) {
            throw new Error(
                error.response?.data?.message || 
                error.message || 
                'Xarajatni yangilashda xatolik'
            );
        }
    }
);

export const deleteExpense = createAsyncThunk(
    'expenses/deleteExpense',
    async (id) => {
        try {
            await axios.delete(`${BASE_URL}/expenses/${id}`);
            return id;
        } catch (error) {
            throw new Error(
                error.response?.data?.message || 
                error.message || 
                'Xarajatni o\'chirishda xatolik'
            );
        }
    }
);

// Initial state
const initialState = {
    expenses: [],
    status: 'idle',
    error: null,
    addStatus: 'idle',
    addError: null,
    updateStatus: 'idle',
    updateError: null,
    deleteStatus: 'idle',
    deleteError: null,
};

// Slice
const expenseSlice = createSlice({
    name: 'expenses',
    initialState,
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
        },
    },
    extraReducers: (builder) => {
        builder
            // Handle fetchExpenses
            .addCase(fetchExpenses.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchExpenses.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.expenses = action.payload;
            })
            .addCase(fetchExpenses.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
            })

            // Handle createExpense
            .addCase(createExpense.pending, (state) => {
                state.addStatus = 'loading';
                state.addError = null;
            })
            .addCase(createExpense.fulfilled, (state, action) => {
                state.addStatus = 'succeeded';
                state.expenses.push(action.payload);
            })
            .addCase(createExpense.rejected, (state, action) => {
                state.addStatus = 'failed';
                state.addError = action.error.message;
            })

            // Handle updateExpense
            .addCase(updateExpense.pending, (state) => {
                state.updateStatus = 'loading';
                state.updateError = null;
            })
            .addCase(updateExpense.fulfilled, (state, action) => {
                state.updateStatus = 'succeeded';
                const index = state.expenses.findIndex(expense => expense._id === action.payload._id);
                if (index !== -1) {
                    state.expenses[index] = action.payload;
                }
            })
            .addCase(updateExpense.rejected, (state, action) => {
                state.updateStatus = 'failed';
                state.updateError = action.error.message;
            })

            // Handle deleteExpense
            .addCase(deleteExpense.pending, (state) => {
                state.deleteStatus = 'loading';
                state.deleteError = null;
            })
            .addCase(deleteExpense.fulfilled, (state, action) => {
                state.deleteStatus = 'succeeded';
                state.expenses = state.expenses.filter(expense => expense._id !== action.payload);
            })
            .addCase(deleteExpense.rejected, (state, action) => {
                state.deleteStatus = 'failed';
                state.deleteError = action.error.message;
            });
    },
});

// Actions
export const { clearAddStatus, clearUpdateStatus, clearDeleteStatus } = expenseSlice.actions;

// Selectors
export const selectExpenses = (state) => state.expenses.expenses;
export const selectExpenseStatus = (state) => state.expenses.status;
export const selectExpenseError = (state) => state.expenses.error;
export const selectAddExpenseStatus = (state) => state.expenses.addStatus;
export const selectAddExpenseError = (state) => state.expenses.addError;
export const selectUpdateExpenseStatus = (state) => state.expenses.updateStatus;
export const selectUpdateExpenseError = (state) => state.expenses.updateError;
export const selectDeleteExpenseStatus = (state) => state.expenses.deleteStatus;
export const selectDeleteExpenseError = (state) => state.expenses.deleteError;

export default expenseSlice.reducer;
