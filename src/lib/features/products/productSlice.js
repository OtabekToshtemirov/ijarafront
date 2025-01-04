import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const fetchProducts = createAsyncThunk(
    'products/fetchProducts',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_URL}/products`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Mahsulotlarni yuklashda xatolik yuz berdi');
        }
    }
);

export const addProduct = createAsyncThunk(
    'products/addProduct',
    async (product, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_URL}/products`, product);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Mahsulot qo\'shishda xatolik yuz berdi');
        }
    }
);

export const updateProduct = createAsyncThunk(
    'products/updateProduct',
    async (product, { rejectWithValue }) => {
        try {
            const response = await axios.put(`${API_URL}/products/${product._id}`, product);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Mahsulotni yangilashda xatolik yuz berdi');
        }
    }
);

export const deleteProduct = createAsyncThunk(
    'products/deleteProduct',
    async (productId, { rejectWithValue }) => {
        try {
            await axios.delete(`${API_URL}/products/${productId}`);
            return productId;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Mahsulotni o\'chirishda xatolik yuz berdi');
        }
    }
);

const productSlice = createSlice({
    name: 'products',
    initialState: {
        products: [],
        status: 'idle',
        error: null,
    },
    reducers: {
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Products
            .addCase(fetchProducts.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchProducts.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.products = action.payload;
                state.error = null;
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            // Add Product
            .addCase(addProduct.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(addProduct.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.products.push(action.payload);
                state.error = null;
            })
            .addCase(addProduct.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            // Update Product
            .addCase(updateProduct.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(updateProduct.fulfilled, (state, action) => {
                state.status = 'succeeded';
                const index = state.products.findIndex(product => product._id === action.payload._id);
                if (index !== -1) {
                    state.products[index] = action.payload;
                }
                state.error = null;
            })
            .addCase(updateProduct.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            // Delete Product
            .addCase(deleteProduct.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(deleteProduct.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.products = state.products.filter(product => product._id !== action.payload);
                state.error = null;
            })
            .addCase(deleteProduct.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            });
    },
});

export const { clearError } = productSlice.actions;
export default productSlice.reducer;
