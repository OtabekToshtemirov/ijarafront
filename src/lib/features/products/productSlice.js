import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchProducts = createAsyncThunk('products/fetchProducts', async () => {
    const response = await fetch('http://localhost:5000/api/products');
    const data = await response.json();
    return data;
});

const productSlice = createSlice({
    name: 'products',
    initialState: {
        products: [],
        status: 'idle',
        error: null,
    },
    reducers: {
        addProduct(state, action) {
            state.products.push(action.payload);
        },
        editProduct(state, action) {
            const product = state.products.find(product => product.id === action.payload.id);
            if (product) {
                product.name = action.payload.name;
                product.price = action.payload.price;
            }
        },
        removeProduct(state, action) {
            state.products = state.products.filter(product => product.id !== action.payload);
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchProducts.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchProducts.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.products = action.payload;
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
            });
    }
});

export const { addProduct, editProduct, removeProduct } = productSlice.actions;
export default productSlice.reducer;