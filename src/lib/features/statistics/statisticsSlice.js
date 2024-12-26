import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../config/api';

const BASE_URL = 'http://localhost:5000/api';
// Async thunks for fetching statistics
export const fetchDailyRevenue = createAsyncThunk(
    'statistics/fetchDailyRevenue',
    async (date = null) => {
        const response = await api.get(`${BASE_URL}/statistics/revenue/daily${date ? `?date=${date}` : ''}`);
        return response.data;
    }
);

export const fetchWeeklyRevenue = createAsyncThunk(
    'statistics/fetchWeeklyRevenue',
    async () => {
        const response = await api.get(`${BASE_URL}/statistics/revenue/weekly`);
        return response.data;
    }
);

export const fetchMonthlyRevenue = createAsyncThunk(
    'statistics/fetchMonthlyRevenue',
    async () => {
        const response = await api.get(`${BASE_URL}/statistics/revenue/monthly`);
        return response.data;
    }
);

export const fetchYearlyRevenue = createAsyncThunk(
    'statistics/fetchYearlyRevenue',
    async () => {
        const response = await api.get(`${BASE_URL}/statistics/revenue/yearly`);
        return response.data;
    }
);

export const fetchTopCustomers = createAsyncThunk(
    'statistics/fetchTopCustomers',
    async () => {
        const response = await api.get(`${BASE_URL}/statistics/customers/top`);
        return response.data;
    }
);

export const fetchMostRentedCars = createAsyncThunk(
    'statistics/fetchMostRentedCars',
    async () => {
        const response = await api.get(`${BASE_URL}/statistics/cars/most-rented`);
        return response.data;
    }
);

const initialState = {
    dailyRevenue: { loading: false, data: null, error: null },
    weeklyRevenue: { loading: false, data: null, error: null },
    monthlyRevenue: { loading: false, data: null, error: null },
    yearlyRevenue: { loading: false, data: null, error: null },
    topCustomers: { loading: false, data: null, error: null },
    mostRentedCars: { loading: false, data: null, error: null }
};

const statisticsSlice = createSlice({
    name: 'statistics',
    initialState,
    reducers: {
        clearStatistics: (state) => {
            return initialState;
        }
    },
    extraReducers: (builder) => {
        // Daily Revenue
        builder
            .addCase(fetchDailyRevenue.pending, (state) => {
                state.dailyRevenue.loading = true;
                state.dailyRevenue.error = null;
            })
            .addCase(fetchDailyRevenue.fulfilled, (state, action) => {
                state.dailyRevenue.loading = false;
                state.dailyRevenue.data = action.payload.data;
            })
            .addCase(fetchDailyRevenue.rejected, (state, action) => {
                state.dailyRevenue.loading = false;
                state.dailyRevenue.error = action.error.message;
            })

            // Weekly Revenue
            .addCase(fetchWeeklyRevenue.pending, (state) => {
                state.weeklyRevenue.loading = true;
                state.weeklyRevenue.error = null;
            })
            .addCase(fetchWeeklyRevenue.fulfilled, (state, action) => {
                state.weeklyRevenue.loading = false;
                state.weeklyRevenue.data = action.payload.data;
            })
            .addCase(fetchWeeklyRevenue.rejected, (state, action) => {
                state.weeklyRevenue.loading = false;
                state.weeklyRevenue.error = action.error.message;
            })

            // Monthly Revenue
            .addCase(fetchMonthlyRevenue.pending, (state) => {
                state.monthlyRevenue.loading = true;
                state.monthlyRevenue.error = null;
            })
            .addCase(fetchMonthlyRevenue.fulfilled, (state, action) => {
                state.monthlyRevenue.loading = false;
                state.monthlyRevenue.data = action.payload.data;
            })
            .addCase(fetchMonthlyRevenue.rejected, (state, action) => {
                state.monthlyRevenue.loading = false;
                state.monthlyRevenue.error = action.error.message;
            })

            // Yearly Revenue
            .addCase(fetchYearlyRevenue.pending, (state) => {
                state.yearlyRevenue.loading = true;
                state.yearlyRevenue.error = null;
            })
            .addCase(fetchYearlyRevenue.fulfilled, (state, action) => {
                state.yearlyRevenue.loading = false;
                state.yearlyRevenue.data = action.payload.data;
            })
            .addCase(fetchYearlyRevenue.rejected, (state, action) => {
                state.yearlyRevenue.loading = false;
                state.yearlyRevenue.error = action.error.message;
            })

            // Top Customers
            .addCase(fetchTopCustomers.pending, (state) => {
                state.topCustomers.loading = true;
                state.topCustomers.error = null;
            })
            .addCase(fetchTopCustomers.fulfilled, (state, action) => {
                state.topCustomers.loading = false;
                state.topCustomers.data = action.payload.data;
            })
            .addCase(fetchTopCustomers.rejected, (state, action) => {
                state.topCustomers.loading = false;
                state.topCustomers.error = action.error.message;
            })

            // Most Rented Cars
            .addCase(fetchMostRentedCars.pending, (state) => {
                state.mostRentedCars.loading = true;
                state.mostRentedCars.error = null;
            })
            .addCase(fetchMostRentedCars.fulfilled, (state, action) => {
                state.mostRentedCars.loading = false;
                state.mostRentedCars.data = action.payload.data;
            })
            .addCase(fetchMostRentedCars.rejected, (state, action) => {
                state.mostRentedCars.loading = false;
                state.mostRentedCars.error = action.error.message;
            });
    }
});

export const { clearStatistics } = statisticsSlice.actions;
export default statisticsSlice.reducer;