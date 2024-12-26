'use client';

import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchCustomers } from "@/lib/features/customers/customerSlice";
import { 
    fetchRentalsByCustomerId, 
    addReturnedProduct, 
    clearReturnStatus,
    selectReturnStatus 
} from "@/lib/features/rentals/rentalsSlice";
import { fetchPaymentsByCustomerId } from "@/lib/features/payments/paymentSlice";
import { toast } from "sonner";

export default function CustomerDetailsPage() {
    const dispatch = useDispatch();
    const router = useRouter();
    const { id } = useParams();
    
    const customer = useSelector((state) => state.customers.customers.find(c => c._id === id));
    const rentals = useSelector((state) => state.rentals.rentals);
    const payments = useSelector((state) => state.payments.payments);
    const status = useSelector((state) => state.customers.status);
    const returnStatus = useSelector(selectReturnStatus);

    const [expandedRental, setExpandedRental] = useState(null);
    const [returnProduct, setReturnProduct] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            if (status === 'idle') {
                await dispatch(fetchCustomers());
            }
            if (id) {
                await Promise.all([
                    dispatch(fetchRentalsByCustomerId(id)),
                    dispatch(fetchPaymentsByCustomerId(id))
                ]);
            }
        };
        loadData();
    }, [dispatch, id, status]);

    useEffect(() => {
        // Clear return status when component unmounts
        return () => {
            dispatch(clearReturnStatus());
        };
    }, [dispatch]);

    const handleExpandRental = (rentalId) => {
        setExpandedRental(expandedRental === rentalId ? null : rentalId);
    };

    const handleReturnProduct = async (rental, borrowedProduct) => {
        try {
            if (!returnProduct?.quantity || returnProduct.quantity > borrowedProduct.quantity) {
                toast.error("Qaytarish miqdori noto'g'ri");
                return;
            }

            const result = await dispatch(addReturnedProduct({
                rentalId: rental._id,
                product: borrowedProduct.product._id,
                quantity: returnProduct.quantity,
                returnDate: new Date()
            }));

            if (result.meta.requestStatus === 'fulfilled') {
                toast.success(`Mahsulot muvaffaqiyatli qaytarildi. Narxi: ${result.payload.returnedCost.toLocaleString()} so'm`);
                setReturnProduct(null);
            }
        } catch (error) {
            toast.error('Xatolik yuz berdi');
        }
    };

    if (status === 'loading' || !customer) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10">
            <div className="mb-6">
                <Button variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Orqaga
                </Button>
            </div>
            <div className="grid gap-6">
                {/* Customer Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Mijoz ma'lumotlari</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium">Ism:</p>
                                <p className="text-lg">{customer.name}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">Telefon:</p>
                                <p className="text-lg">{customer.phone}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">Manzil:</p>
                                <p className="text-lg">{customer.address}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">Balans:</p>
                                <p className="text-lg">{customer.balance?.toLocaleString()} so'm</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Rentals */}
                <Card>
                    <CardHeader>
                        <CardTitle>Ijaralar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {rentals.map((rental) => (
                                <Card key={rental._id} className="border">
                                    <CardContent className="pt-6">
                                        <div className="flex justify-between items-center cursor-pointer" 
                                             onClick={() => handleExpandRental(rental._id)}>
                                            <div className="grid grid-cols-4 gap-4 flex-1">
                                                <div>{new Date(rental.createdAt).toLocaleDateString()}</div>
                                                <div>{rental.totalCost?.toLocaleString()} so'm</div>
                                                <div>{rental.status}</div>
                                                <div>{rental.carNumber}</div>
                                            </div>
                                            <Button variant="ghost" size="sm">
                                                {expandedRental === rental._id ? 
                                                    <ChevronUp className="h-4 w-4" /> : 
                                                    <ChevronDown className="h-4 w-4" />}
                                            </Button>
                                        </div>

                                        {expandedRental === rental._id && (
                                            <div className="mt-4 space-y-6">
                                                {/* Borrowed Products */}
                                                <div>
                                                    <h3 className="font-medium mb-2">Olingan mahsulotlar</h3>
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Mahsulot</TableHead>
                                                                <TableHead>Soni</TableHead>
                                                                <TableHead>Boshlanish sanasi</TableHead>
                                                                <TableHead>Tugash sanasi</TableHead>
                                                                <TableHead>Amallar</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {rental.borrowedProducts.map((prod, index) => {
                                                                // Calculate remaining quantity
                                                                const returnedQuantity = rental.returnedProducts
                                                                    .filter(r => r.product._id === prod.product._id)
                                                                    .reduce((sum, r) => sum + r.quantity, 0);
                                                                const remainingQuantity = prod.quantity - returnedQuantity;

                                                                return (
                                                                    <TableRow key={index}>
                                                                        <TableCell>{prod.product.name}</TableCell>
                                                                        <TableCell>
                                                                            {prod.quantity} 
                                                                            {remainingQuantity !== prod.quantity && (
                                                                                <span className="text-sm text-muted-foreground ml-2">
                                                                                    (Qoldi: {remainingQuantity})
                                                                                </span>
                                                                            )}
                                                                        </TableCell>
                                                                        <TableCell>{new Date(prod.startDate).toLocaleDateString()}</TableCell>
                                                                        <TableCell>{prod.endDate ? new Date(prod.endDate).toLocaleDateString() : '-'}</TableCell>
                                                                        <TableCell>
                                                                            {remainingQuantity > 0 && rental.status === 'active' && (
                                                                                <div className="flex items-center gap-2">
                                                                                    <Input
                                                                                        type="number"
                                                                                        placeholder="Miqdor"
                                                                                        className="w-20"
                                                                                        min="1"
                                                                                        max={remainingQuantity}
                                                                                        value={returnProduct?.productId === prod.product._id ? returnProduct.quantity : ''}
                                                                                        onChange={(e) => setReturnProduct({
                                                                                            productId: prod.product._id,
                                                                                            quantity: parseInt(e.target.value)
                                                                                        })}
                                                                                    />
                                                                                    <Button
                                                                                        size="sm"
                                                                                        disabled={returnStatus.loading}
                                                                                        onClick={() => handleReturnProduct(rental, prod)}
                                                                                    >
                                                                                        {returnStatus.loading ? 
                                                                                            <Loader2 className="h-4 w-4 animate-spin" /> : 
                                                                                            'Qaytarish'
                                                                                        }
                                                                                    </Button>
                                                                                </div>
                                                                            )}
                                                                        </TableCell>
                                                                    </TableRow>
                                                                );
                                                            })}
                                                        </TableBody>
                                                    </Table>
                                                </div>

                                                {/* Returned Products */}
                                                {rental.returnedProducts?.length > 0 && (
                                                    <div>
                                                        <h3 className="font-medium mb-2">Qaytarilgan mahsulotlar</h3>
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead>Mahsulot</TableHead>
                                                                    <TableHead>Soni</TableHead>
                                                                    <TableHead>Qaytarish sanasi</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {rental.returnedProducts.map((prod, index) => (
                                                                    <TableRow key={index}>
                                                                        <TableCell>{prod.product.name}</TableCell>
                                                                        <TableCell>{prod.quantity}</TableCell>
                                                                        <TableCell>{new Date(prod.returnDate).toLocaleDateString()}</TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Payments */}
                <Card>
                    <CardHeader>
                        <CardTitle>To'lovlar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Sana</TableHead>
                                    <TableHead>Miqdor</TableHead>
                                    <TableHead>To'lov usuli</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.map((payment) => (
                                    <TableRow key={payment._id}>
                                        <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                                        <TableCell>{payment.amount.toLocaleString()} so'm</TableCell>
                                        <TableCell>{payment.paymentMethod}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
