import React from 'react';
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { deleteRental } from '@/lib/features/rentals/rentalsSlice';
import { toast } from 'sonner';
import moment from 'moment';
import { useRouter } from 'next/navigation';

const formatDate = (date) => moment(date).format('DD.MM.YYYY');

const getStatusColor = (status) => {
  switch (status) {
    case 'active':
      return 'bg-green-500';
    case 'completed':
      return 'bg-blue-500';
    case 'cancelled':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'active':
      return 'Faol';
    case 'completed':
      return 'Tugatilgan';
    case 'cancelled':
      return 'Bekor qilingan';
    default:
      return 'Noma\'lum';
  }
};

export function RentalListItem({ rental, remainingItems, onViewDetails, products }) {
  const dispatch = useDispatch();
  const router = useRouter();

  const handleDelete = async () => {
    if (rental.status !== 'active') {
      toast.error('Faol bo\'lmagan ijarani o\'chirish mumkin emas');
      return;
    }

    if (window.confirm('Ijarani o\'chirishni xohlaysizmi?')) {
      try {
        await dispatch(deleteRental(rental._id));
        toast.success('Ijara muvaffaqiyatli o`chirildi');
        router.push('/ijara');
      } catch (error) {
        toast.error('Ijarani o`chirishda xatolik yuz berdi');
      }
    }
  };

  // Calculate total cost if not available from backend
  const calculateTotalCost = () => {
    if (rental.totalCost > 0) {
      return rental.totalCost;
    }

    // Calculate days between start and end date
    const startDate = new Date(rental.startDate);
    const endDate = new Date(rental.endDate);
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) || 1;

    // Calculate total cost for all borrowed products
    return rental.borrowedProducts.reduce((total, item) => {
      const product = typeof item.product === 'object' ? item.product : 
        products.find(p => p._id === item.product);
      
      if (!product) return total;
      
      return total + (product.dailyRate * days * item.quantity);
    }, 0);
  };

  return (
    <TableRow>
      <TableCell>{rental.customer.name}</TableCell>
      <TableCell>{rental.carNumber}</TableCell>
      <TableCell>{formatDate(rental.startDate)}</TableCell>
      <TableCell>{formatDate(rental.endDate)}</TableCell>
      <TableCell>{calculateTotalCost().toLocaleString('uz-UZ')} so'm</TableCell>
      <TableCell>
        <Badge className={getStatusColor(rental.status)}>{getStatusText(rental.status)}</Badge>
      </TableCell>
      <TableCell>{remainingItems.length}</TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="sm" className="mr-2" onClick={onViewDetails}>
          <Eye className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="mr-2" onClick={() => router.push(`/ijara/edit/${rental._id}`)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={handleDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
