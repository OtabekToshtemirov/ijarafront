import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../config/api';

const BASE_URL = '/api/expenses';

// Async thunks
export const createExpense = createAsyncThunk(
    'expenses/createExpense',
    async (expenseData) => {
        const response = await api.post(BASE_URL, expenseData);
        return response.data;
    }
);

export const fetchExpenses = createAsyncThunk(
    'expenses/fetchExpenses',
    async (filters = {}) => {
        try {
            const params = {
                page: parseInt(filters.page) || 1,
                limit: 10,
            };
            
            if (filters.category && filters.category !== 'all') {
                params.category = filters.category;
            }
            
            if (filters.paymentMethod && filters.paymentMethod !== 'all') {
                params.paymentMethod = filters.paymentMethod;
            }
            
            if (filters.startDate) {
                params.startDate = filters.startDate;
            }
            
            if (filters.endDate) {
                params.endDate = filters.endDate;
            }

            console.log('Fetching expenses with params:', params);
            const response = await api.get(BASE_URL, { params });
            console.log('API Response:', response.data);

            // If response is an array, convert it to paginated format
            if (Array.isArray(response.data)) {
                const expenses = response.data;
                const total = expenses.length;
                const totalAmount = expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
                const totalPages = Math.max(1, Math.ceil(total / params.limit));
                const start = (params.page - 1) * params.limit;
                const end = start + params.limit;

                return {
                    expenses: expenses.slice(start, end),
                    total,
                    totalAmount,
                    currentPage: params.page,
                    totalPages
                };
            }

            // If response is already paginated
            return {
                expenses: response.data.data || response.data.expenses || [],
                total: response.data.total || 0,
                totalAmount: response.data.totalAmount || 0,
                currentPage: params.page,
                totalPages: response.data.totalPages || 1
            };
        } catch (error) {
            console.error('Error fetching expenses:', error);
            throw error;
        }
    }
);

export const fetchExpenseStats = createAsyncThunk(
    'expenses/fetchExpenseStats',
    async (params = {}) => {
        const response = await api.get(`${BASE_URL}/stats`, { params });
        return response.data;
    }
);

export const updateExpense = createAsyncThunk(
    'expenses/updateExpense',
    async ({ id, data }) => {
        const response = await api.put(`${BASE_URL}/${id}`, data);
        return response.data;
    }
);

export const getExpenseById = createAsyncThunk(
    'expenses/getExpenseById',
    async (id) => {
        const response = await api.get(`${BASE_URL}/${id}`);
        return response.data;
    }
);

export const deleteExpense = createAsyncThunk(
    'expenses/deleteExpense',
    async (id) => {
        await api.delete(`${BASE_URL}/${id}`);
        return id;
    }
);

const initialState = {
    items: [],
    stats: null,
    loading: false,
    error: null,
    total: 0,
    totalAmount: 0,
    currentPage: 1,
    totalPages: 1
};

const expensesSlice = createSlice({
    name: 'expenses',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Create expense
            .addCase(createExpense.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createExpense.fulfilled, (state, action) => {
                state.loading = false;
                state.items.unshift(action.payload);
                state.error = null;
                state.total += 1;
                state.totalAmount += parseFloat(action.payload.amount) || 0;
            })
            .addCase(createExpense.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            // Fetch expenses
            .addCase(fetchExpenses.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchExpenses.fulfilled, (state, action) => {
                console.log('Expenses loaded:', action.payload);
                state.loading = false;
                state.items = action.payload.expenses;
                state.total = action.payload.total;
                state.totalAmount = action.payload.totalAmount;
                state.currentPage = action.payload.currentPage;
                state.totalPages = action.payload.totalPages;
                state.error = null;
            })
            .addCase(fetchExpenses.rejected, (state, action) => {
                console.error('Error in expenses slice:', action.error);
                state.loading = false;
                state.error = action.error.message;
            })
            // Update expense
            .addCase(updateExpense.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateExpense.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.items.findIndex(item => item._id === action.payload._id);
                if (index !== -1) {
                    state.items[index] = action.payload;
                }
                state.error = null;
            })
            .addCase(updateExpense.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            // Delete expense
            .addCase(deleteExpense.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteExpense.fulfilled, (state, action) => {
                state.loading = false;
                state.items = state.items.filter(item => item._id !== action.payload);
                state.error = null;
            })
            .addCase(deleteExpense.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            // Fetch stats
            .addCase(fetchExpenseStats.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchExpenseStats.fulfilled, (state, action) => {
                state.loading = false;
                state.stats = action.payload;
                state.error = null;
            })
            .addCase(fetchExpenseStats.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            });
    },
});

export default expensesSlice.reducer;
