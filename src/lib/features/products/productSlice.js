import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const fetchProducts = createAsyncThunk(
    'products/fetchProducts',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_URL}/products`, {
                params: {
                    populate: 'parts.product' // Qismlarni populate qilish
                }
            });
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
            // Kerakli maydonlarni ajratib olish
            const productData = {
                name: product.name,
                description: product.description,
                category: product.category,
                type: product.type,
                quantity: Number(product.quantity) || 1,
                dailyRate: Number(product.dailyRate) || 0,
                isAvailable: Boolean(product.isAvailable),
                availability: Boolean(product.availability),
                parts: product.type === 'combo' ? product.parts.map(part => ({
                    product: part.product?._id || part.product || part.productId,
                    quantity: Number(part.quantity) || 1,
                    dailyRate: Number(part.dailyRate) || 0
                })) : []
            };

            const response = await axios.put(`${API_URL}/products/${product._id}`, productData);
            
            if (response.data.success) {
                return response.data.data;
            } else {
                throw new Error(response.data.message || 'Mahsulotni yangilashda xatolik');
            }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message || 'Mahsulotni yangilashda xatolik yuz berdi');
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

export const updateProductAvailability = createAsyncThunk(
    'products/updateProductAvailability',
    async ({ productId, isAvailable }, { rejectWithValue }) => {
        try {
            const response = await axios.patch(`${API_URL}/products/${productId}`, { isAvailable });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Mahsulot mavjudligini yangilashda xatolik yuz berdi');
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
            })
            // Update Product Availability
            .addCase(updateProductAvailability.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(updateProductAvailability.fulfilled, (state, action) => {
                state.status = 'succeeded';
                const index = state.products.findIndex(product => product._id === action.payload._id);
                if (index !== -1) {
                    state.products[index].isAvailable = action.payload.isAvailable;
                }
                state.error = null;
            })
            .addCase(updateProductAvailability.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            });
    },
});

// Memoizatsiya qilingan selector
export const selectPartProducts = createSelector(
    [(state) => state.products.products],
    (products) => products.filter(product => product.type !== 'combo')
);

export const { clearError } = productSlice.actions;
export default productSlice.reducer;
