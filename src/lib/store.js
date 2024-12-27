import { configureStore } from '@reduxjs/toolkit'
import productSlice from './features/products/productSlice'
import customerSlice from './features/customers/customerSlice'
import rentalsSlice from './features/rentals/rentalsSlice'
import paymentSlice from "@/lib/features/payments/paymentSlice";
import statisticsSlice from "@/lib/features/statistics/statisticsSlice";
import carsSlice from './features/cars/carsSlice'
import expensesSlice from './features/expenses/expensesSlice'

export const makeStore = () => {
    return configureStore({
        reducer: {
            products: productSlice,
            customers: customerSlice,
            rentals: rentalsSlice,
            payments: paymentSlice,
            statistics: statisticsSlice,
            cars: carsSlice,
            expenses: expensesSlice
        }
    })
}