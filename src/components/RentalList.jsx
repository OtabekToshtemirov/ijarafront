import React, { useState, useEffect } from 'react';
import { RentalListItem } from './RentalListItem';
import { RentalDetailsDialog } from './RentalDetailsDialog';
import {
  Table,
  TableBody,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { fetchRentals } from '@/lib/features/rentals/rentalsSlice';
import { selectRemainingItems } from '@/lib/features/rentals/rentalsSlice';
import { useDispatch, useSelector } from 'react-redux';

export default function RentalList({ onViewDetails }) {
  const dispatch = useDispatch();
  const { rentals, loading } = useSelector(state => state.rentals);
  const products = useSelector(state => state.products.products);
  const [selectedRental, setSelectedRental] = useState(null);

  useEffect(() => {
    dispatch(fetchRentals());
  }, [dispatch]);

  if (loading) {
    return <div className="flex justify-center py-8">Yuklanmoqda...</div>;
  }

  if (!rentals?.length) {
    return <div className="text-center py-8 text-muted-foreground">Ijaralar topilmadi</div>;
  }

  return (
    <>
      <Table>
        <TableCaption>Barcha ijaralar ro'yxati</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Mijoz</TableHead>
            <TableHead>Mashina raqami</TableHead>
            <TableHead>Boshlanish sanasi</TableHead>
            <TableHead>Tugash sanasi</TableHead>
            <TableHead>Umumiy narx</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Qolgan mahsulotlar</TableHead>
            <TableHead className="text-right">Amallar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rentals.map((rental) => (
            <RentalListItem 
              key={rental._id} 
              rental={rental}
              products={products}
              remainingItems={selectRemainingItems(rental)}
              onViewDetails={() => setSelectedRental(rental)}
            />
          ))}
        </TableBody>
      </Table>

      {selectedRental && (
        <RentalDetailsDialog
          rental={selectedRental}
          open={!!selectedRental}
          onOpenChange={(open) => !open && setSelectedRental(null)}
        />
      )}
    </>
  );
}
