import { notFound } from 'next/navigation'
import RentalDetails from './rental-details'
import { fetchRentalById } from '@/lib/features/rentals/rentalsSlice'
import { fetchProducts } from '@/lib/features/products/productSlice'

export default async function RentalDetailsPage({ params }) {
    const [rental, products] = await Promise.all([
        fetchRentalById(params.id),
        fetchProducts(),
    ])

    if (!rental) {
        return notFound()
    }

    return <RentalDetails initialRental={rental} initialProducts={products} />
}