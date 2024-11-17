'use client';

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchRentals } from '@/lib/features/rentals/rentalsSlice';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function RentalsPage() {
    const dispatch = useDispatch();
    const [searchTerm, setSearchTerm] = useState('');

    const rentals = useSelector((state) => state.rentals.rentals);
    const status = useSelector((state) => state.rentals.status);
    const error = useSelector((state) => state.rentals.error);

    useEffect(() => {
        if (status === 'idle') {
            dispatch(fetchRentals());
        }
    }, [dispatch, status]);

   const filteredRentals = rentals.filter((rental) => {
    const searchTermLower = searchTerm.toLowerCase();
    return rental.customer.name.toLowerCase().includes(searchTermLower) ||
           rental.item.toLowerCase().includes(searchTermLower);
});
    if (status === 'loading') return <div>Loading...</div>;
    if (status === 'failed') return <div>Error: {error}</div>;

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-4xl font-bold mb-8">Rentals</h1>

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search rentals"
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        aria-label="Search rentals"
                    />
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">Filter</Button>
                    <Link href="/ijara/add-rental" className="btn-primary">
                        Add Rental
                    </Link>
                </div>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead>Daily Cost</TableHead>
                            <TableHead>Start Date</TableHead>
                            <TableHead>End Date</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredRentals.map((rental) => (
                            <TableRow key={rental.id}>
                                <TableCell>{rental.customer}</TableCell>
                                <TableCell>${rental.dailyRate}</TableCell>
                                <TableCell>{rental.startDate}</TableCell>
                                <TableCell>{rental.endDate}</TableCell>
                                <TableCell>
                                    <Badge variant={rental.status === 'Active' ? 'default' : 'secondary'}>
                                        {rental.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            {filteredRentals.length === 0 && <p className="text-center mt-4">No rentals found.</p>}
        </div>
    );
}
