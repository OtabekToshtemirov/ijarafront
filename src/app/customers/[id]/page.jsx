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
import { Badge } from "@/components/ui/badge";
import { fetchCustomers } from "@/lib/features/customers/customerSlice";
import { 
    fetchRentalsByCustomerId, 
    addReturnedProduct, 
    clearReturnStatus,
    selectReturnRentalStatus,
    selectCustomerRentals,
    selectCustomerRentalsStatus,
    selectCustomerRentalsError
} from "@/lib/features/rentals/rentalsSlice";
import { 
    fetchPaymentsByCustomerId,
    selectPayments,
    selectPaymentsStatus 
} from "@/lib/features/payments/paymentSlice";
import { toast } from "sonner";

export default function CustomerDetailsPage() {
    const dispatch = useDispatch();
    const router = useRouter();
    const { id } = useParams();
    
    const customer = useSelector((state) => state.customers.customers.find(c => c._id === id));
    const rentals = useSelector(selectCustomerRentals) || [];
    const rentalsStatus = useSelector(selectCustomerRentalsStatus);
    const rentalsError = useSelector(selectCustomerRentalsError);
    const payments = useSelector(selectPayments) || [];
    const status = useSelector((state) => state.customers.status);
    const paymentsStatus = useSelector(selectPaymentsStatus);
    const returnStatus = useSelector(selectReturnRentalStatus);

    const [expandedRental, setExpandedRental] = useState(null);
    const [returnProduct, setReturnProduct] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                if (status === 'idle') {
                    await dispatch(fetchCustomers());
                }
                if (id) {
                    await dispatch(fetchRentalsByCustomerId(id));
                    await dispatch(fetchPaymentsByCustomerId(id));
                }
            } catch (error) {
                console.error('Error loading data:', error);
                toast.error('Ma\'lumotlarni yuklashda xatolik');
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

    useEffect(() => {
        if (rentalsError) {
            toast.error(rentalsError);
        }
    }, [rentalsError, toast]);

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
                // Refresh rentals after successful return
                dispatch(fetchRentalsByCustomerId(id));
            }
        } catch (error) {
            toast.error('Xatolik yuz berdi');
        }
    };

    // Calculate total payments for a rental
    const getTotalPayments = (rental) => {
        return rental.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
    };

    // Calculate remaining quantity for a borrowed product
    const getRemainingQuantity = (rental, product) => {
        const returnedQuantity = rental.returnedProducts
            ?.filter(rp => rp.product?._id === product.product?._id)
            ?.reduce((sum, rp) => sum + rp.quantity, 0) || 0;
        return product.quantity - returnedQuantity;
    };

    // Calculate rental duration in days
    const getRentalDuration = (startDate) => {
        const start = new Date(startDate);
        const now = new Date();
        return Math.ceil((now - start) / (1000 * 60 * 60 * 24));
    };

    if (status === 'loading' || rentalsStatus === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-muted-foreground">Mijoz topilmadi</p>
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
                        <CardTitle>Ijaralar tarixi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {rentalsStatus === 'loading' ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : rentals.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground">
                                Ijaralar mavjud emas
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {rentals.map((rental) => (
                                    <div 
                                        key={rental._id}
                                        className="border rounded-lg p-4 space-y-4"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium">{rental.rentalNumber}</p>
                                                    <Badge variant={rental.status === 'active' ? 'default' : 'secondary'}>
                                                        {rental.status === 'active' ? 'Faol' : 'Yakunlangan'}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {new Date(rental.startDate).toLocaleDateString()} - {rental.rentalDays} kun
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">
                                                    {rental.totalCost?.toLocaleString()} so'm
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    To'langan: {rental.totalPayments?.toLocaleString()} so'm
                                                </p>
                                                {rental.debt > 0 && (
                                                    <p className="text-sm text-red-500">
                                                        Qarz: {rental.debt?.toLocaleString()} so'm
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-sm font-medium mb-2">Mahsulotlar:</p>
                                            <div className="grid gap-2">
                                                {rental.borrowedProducts.map((product, idx) => {
                                                    const remainingQuantity = getRemainingQuantity(rental, product);
                                                    return (
                                                        <div key={idx} className="flex justify-between items-center">
                                                            <div>
                                                                <p className="font-medium">{product.product?.name}</p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {product.quantity} dona x {product.dailyRate?.toLocaleString()} so'm
                                                                </p>
                                                            </div>
                                                            {remainingQuantity > 0 && rental.status === 'active' ? (
                                                                <div className="flex items-center gap-2">
                                                                    <Badge variant="destructive">
                                                                        Qaytarilmagan: {remainingQuantity} dona
                                                                    </Badge>
                                                                    <Input
                                                                        type="number"
                                                                        min="1"
                                                                        max={remainingQuantity}
                                                                        className="w-20"
                                                                        value={returnProduct?.productId === product.product?._id ? returnProduct.quantity : ''}
                                                                        onChange={(e) => setReturnProduct({
                                                                            productId: product.product?._id,
                                                                            quantity: parseInt(e.target.value)
                                                                        })}
                                                                    />
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => handleReturnProduct(rental, product)}
                                                                        disabled={returnStatus === 'loading'}
                                                                    >
                                                                        {returnStatus === 'loading' ? (
                                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                                        ) : (
                                                                            'Qaytarish'
                                                                        )}
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                <Badge variant="outline">Qaytarilgan</Badge>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {rental.car && (
                                            <div className="text-sm text-muted-foreground">
                                                Mashina: {rental.car.carNumber}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Payments */}
                <Card>
                    <CardHeader>
                        <CardTitle>To'lovlar tarixi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {paymentsStatus === 'loading' ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : payments.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">
                                To'lovlar mavjud emas
                            </p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Sana</TableHead>
                                        <TableHead>Miqdor</TableHead>
                                        <TableHead>To'lov turi</TableHead>
                                        <TableHead>Izoh</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payments.map((payment) => (
                                        <TableRow key={payment._id}>
                                            <TableCell>
                                                {new Date(payment.paymentDate).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                {payment.amount?.toLocaleString()} so'm
                                            </TableCell>
                                            <TableCell>
                                                <Badge>
                                                    {payment.paymentType === 'cash' ? 'Naqd' :
                                                     payment.paymentType === 'card' ? 'Karta' :
                                                     'O\'tkazma'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {payment.description || '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
