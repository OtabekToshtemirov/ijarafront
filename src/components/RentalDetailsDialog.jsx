import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "@/lib/features/products/productSlice";
import { addReturnedProduct } from "@/lib/features/rentals/rentalsSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import moment from 'moment';

export const RentalDetailsDialog = ({ rental, onOpenChange }) => {
  const dispatch = useDispatch();
  const products = useSelector(state => state.products.products);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [returnQuantity, setReturnQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [currentReturn, setCurrentReturn] = useState(null);
  const [productSummary, setProductSummary] = useState(null);
  const [returnHistory, setReturnHistory] = useState([]);

  useEffect(() => {
    if (products.length === 0) {
      dispatch(fetchProducts());
    }
  }, [dispatch, products]);

  if (!rental) return null;

  // Calculate rental duration
  const startDate = moment(rental.startDate);
  const endDate = moment(rental.endDate);
  const rentalDuration = Math.max(1, endDate.diff(startDate, 'days') + 1);

  // Calculate remaining quantities for each product
  const getRemainingQuantity = (product) => {
    const borrowed = rental.borrowedProducts.find(
      p => p.product._id === product._id || p.product === product._id
    );
    if (!borrowed) return 0;

    const returned = rental.returnedProducts
      .filter(p => (p.product._id || p.product) === (borrowed.product._id || borrowed.product))
      .reduce((sum, p) => sum + p.quantity, 0);

    return borrowed.quantity - returned;
  };

  const handleReturn = async (product) => {
    if (!product) return;

    const remaining = getRemainingQuantity(product);
    if (remaining === 0) {
      toast.error("Bu mahsulot to'liq qaytarilgan");
      return;
    }

    setSelectedProduct(product);
    setReturnQuantity(1);
    setCurrentReturn(null);
    setProductSummary(null);
    setReturnHistory([]);
  };

  const handleSubmitReturn = async () => {
    if (!selectedProduct || !returnQuantity) return;

    const remaining = getRemainingQuantity(selectedProduct);
    if (returnQuantity > remaining) {
      toast.error(`Qaytarish miqdori ${remaining} dan oshmasligi kerak`);
      return;
    }

    setLoading(true);
    try {
      const result = await dispatch(addReturnedProduct({
        rentalId: rental._id,
        product: selectedProduct._id,
        quantity: parseInt(returnQuantity),
        returnDate: new Date(),
        cost: parseInt(returnQuantity) * selectedProduct.dailyRate * rentalDuration 
      })).unwrap();

      setCurrentReturn(result.currentReturn);
      setProductSummary(result.productSummary);
      setReturnHistory(result.returnHistory);
      
      toast.success('Mahsulot muvaffaqiyatli qaytarildi', {
        description: `Ijara narxi: ${result.currentReturn.cost.toLocaleString()} so'm`
      });

      setSelectedProduct(null);
      setReturnQuantity(1);
    } catch (error) {
      toast.error(error?.message || 'Mahsulotni qaytarishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!rental} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ijara ma'lumotlari</DialogTitle>
          <DialogDescription>
            Ijara va mahsulotlar haqida batafsil ma'lumot
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Customer Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">Mijoz ma'lumotlari</h3>
              <p>Ismi: {rental.customer?.name}</p>
              <p>Telefon: {rental.customer?.phone}</p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Ijara ma'lumotlari</h3>
              <p>Mashina raqami: {rental.carNumber || 'Kiritilmagan'}</p>
              <p>Davomiyligi: {rentalDuration} kun</p>
              <p>Umumiy narx: {rental.totalCost?.toLocaleString()} so'm</p>
              <Badge className={
                rental.status === 'active' ? 'bg-green-500' :
                rental.status === 'completed' ? 'bg-blue-500' : 'bg-red-500'
              }>
                {rental.status === 'active' ? 'Faol' :
                 rental.status === 'completed' ? 'Tugatilgan' : 'Bekor qilingan'}
              </Badge>
            </div>
          </div>

          {/* Products Table */}
          <div>
            <h3 className="font-medium mb-2">Mahsulotlar</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mahsulot</TableHead>
                  <TableHead>Miqdori</TableHead>
                  <TableHead>Qaytarilgan</TableHead>
                  <TableHead>Qolgan</TableHead>
                  <TableHead>Kunlik narx</TableHead>
                  <TableHead>Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rental.borrowedProducts.map((item) => {
                  const product = typeof item.product === 'object' ? item.product : 
                    products.find(p => p._id === item.product);
                  if (!product) return null;

                  const returned = rental.returnedProducts
                    .filter(p => (p.product._id || p.product) === (product._id))
                    .reduce((sum, p) => sum + p.quantity, 0);
                  const remaining = item.quantity - returned;

                  return (
                    <TableRow key={product._id}>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{returned}</TableCell>
                      <TableCell>{remaining}</TableCell>
                      <TableCell>{product.dailyRate?.toLocaleString()} so'm</TableCell>
                      <TableCell>
                        {rental.status === 'active' && remaining > 0 && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleReturn(product)}
                          >
                            Qaytarish
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Return Form */}
          {selectedProduct && (
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-medium">Mahsulotni qaytarish</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Mahsulot</Label>
                  <p className="mt-1">{selectedProduct.name}</p>
                </div>
                <div>
                  <Label>Qaytarish miqdori</Label>
                  <Input
                    type="number"
                    min="1"
                    max={getRemainingQuantity(selectedProduct)}
                    value={returnQuantity}
                    onChange={(e) => setReturnQuantity(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedProduct(null);
                    setCurrentReturn(null);
                    setProductSummary(null);
                    setReturnHistory([]);
                  }}
                >
                  Bekor qilish
                </Button>
                <Button
                  onClick={handleSubmitReturn}
                  disabled={loading}
                >
                  {loading ? 'Yuklanmoqda...' : 'Qaytarish'}
                </Button>
              </div>
            </div>
          )}

          {/* Current Return Summary */}
          {currentReturn && (
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Joriy qaytarish ma'lumotlari</h3>
              <div className="grid grid-cols-2 gap-2">
                <p>Miqdori: {currentReturn.quantity}</p>
                <p>Kunlar soni: {currentReturn.rentalDays}</p>
                <p>Qaytarish sanasi: {moment(currentReturn.returnDate).format('DD.MM.YYYY')}</p>
                <p className="col-span-2 font-medium">
                  Ijara narxi: {currentReturn.cost?.toLocaleString()} so'm
                </p>
              </div>
            </div>
          )}

          {/* Product Return Summary */}
          {productSummary && (
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Mahsulot qaytarish xulosasi</h3>
              <div className="grid grid-cols-2 gap-2">
                <p>Mahsulot: {productSummary.productName}</p>
                <p>Kunlik narx: {productSummary.dailyRate?.toLocaleString()} so'm</p>
                <p>Jami qaytarilgan: {productSummary.totalReturned}</p>
                <p>Qolgan: {productSummary.remainingQuantity}</p>
                <p className="col-span-2 font-medium">
                  Jami ijara narxi: {productSummary.totalCost?.toLocaleString()} so'm
                </p>
              </div>
            </div>
          )}

          {/* Return History */}
          {returnHistory.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Qaytarish tarixi</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Miqdori</TableHead>
                    <TableHead>Qaytarish sanasi</TableHead>
                    <TableHead>Kunlar soni</TableHead>
                    <TableHead>Ijara narxi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {returnHistory.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{moment(item.returnDate).format('DD.MM.YYYY')}</TableCell>
                      <TableCell>{item.rentalDays}</TableCell>
                      <TableCell>{item.cost?.toLocaleString()} so'm</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
