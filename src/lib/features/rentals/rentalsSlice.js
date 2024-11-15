import  { createSlice } from '@reduxjs/toolkit';

// function for fetching all rentals
export const fetchRentals = async () => {
    const response = await fetch('http://localhost:5000/api/rentals');
    const data = await response.json();
    return data;
}


const rentalsSlice = createSlice({
    name: 'rental',
    initialState: {
        rentals: []
    },
    reducers: {
        addRental(state, action) {
            state.rentals.push(action.payload);
        },
        editRental(state, action) {
            const rental = state.rentals.find(rental => rental.id === action.payload.id);
            if (rental) {
                rental.customerId = action.payload.customerId;
                rental.productId = action.payload.productId;
                rental.rentalDate = action.payload.rentalDate;
                rental.returnDate = action.payload.returnDate;
            }
        },
        removeRental(state, action) {
            state.rentals = state.rentals.filter(rental => rental.id !== action.payload);
        }
    }
} );


export const { addRental, editRental, removeRental } = rentalsSlice.actions;
