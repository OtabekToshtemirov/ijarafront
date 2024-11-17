import { configureStore } from '@reduxjs/toolkit'
import productSlice from './features/products/productSlice'
import customerSlice from './features/customers/customerSlice'
import rentalSlice from './features/rentals/rentalsSlice'
import paymentSlice from "@/lib/features/payments/paymentSlice";

export const makeStore = () => {
    return configureStore({
        reducer: {
            products: productSlice,
            customers: customerSlice,
            rentals: rentalSlice,
            payments: paymentSlice,
        }
    })
}