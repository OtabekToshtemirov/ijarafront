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

    // Filter active rentals
    const activeRentals = rentals.filter(rental => rental.status === 'active');
    
    // Get unreturned products across all rentals
    const getUnreturnedProducts = () => {
        return rentals.flatMap(rental => {
            return rental.borrowedProducts.filter(product => {
                const returnedQuantity = rental.returnedProducts
                    ?.filter(rp => rp.product?._id === product.product?._id)
                    ?.reduce((sum, rp) => sum + rp.quantity, 0) || 0;
                return returnedQuantity < product.quantity;
            }).map(product => ({
                ...product,
                rental,
                remainingQuantity: getRemainingQuantity(rental, product)
            }));
        });
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

                {/* Active Rentals */}
                <Card>
                    <CardHeader>
                        <CardTitle>Faol ijaralar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {activeRentals.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground">
                                Faol ijaralar mavjud emas
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Sana</TableHead>
                                        <TableHead>Mahsulotlar</TableHead>
                                        <TableHead>Umumiy narx</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {activeRentals.map((rental) => (
                                        <TableRow key={rental._id}>
                                            <TableCell>{new Date(rental.startDate).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                {rental.borrowedProducts.map((product, index) => (
                                                    <div key={index}>
                                                        {product.product?.name} ({product.quantity} dona)
                                                    </div>
                                                ))}
                                            </TableCell>
                                            <TableCell>{rental.totalCost?.toLocaleString()} so'm</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">
                                                    {rental.status === 'active' ? 'Faol' : 'Yakunlangan'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* All Rentals History */}
                <Card>
                    <CardHeader>
                        <CardTitle>Barcha ijaralar tarixi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {rentals.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground">
                                Ijaralar tarixi mavjud emas
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Sana</TableHead>
                                        <TableHead>Mahsulotlar</TableHead>
                                        <TableHead>Umumiy narx</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rentals.map((rental) => (
                                        <TableRow key={rental._id}>
                                            <TableCell>{new Date(rental.startDate).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                {rental.borrowedProducts.map((product, index) => (
                                                    <div key={index}>
                                                        {product.product?.name} ({product.quantity} dona)
                                                    </div>
                                                ))}
                                            </TableCell>
                                            <TableCell>{rental.totalCost?.toLocaleString()} so'm</TableCell>
                                            <TableCell>
                                                <Badge variant={rental.status === 'active' ? 'secondary' : 'outline'}>
                                                    {rental.status === 'active' ? 'Faol' : 'Yakunlangan'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Unreturned Products */}
                <Card>
                    <CardHeader>
                        <CardTitle>Qaytarilmagan mahsulotlar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {getUnreturnedProducts().length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground">
                                Qaytarilmagan mahsulotlar mavjud emas
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Mahsulot</TableHead>
                                        <TableHead>Ijara sanasi</TableHead>
                                        <TableHead>Qolgan miqdor</TableHead>
                                        <TableHead>Amallar</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {getUnreturnedProducts().map((product, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{product.product?.name}</TableCell>
                                            <TableCell>{new Date(product.rental.startDate).toLocaleDateString()}</TableCell>
                                            <TableCell>{product.remainingQuantity} dona</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setReturnProduct(product);
                                                        setExpandedRental(product.rental._id);
                                                    }}
                                                >
                                                    Qaytarish
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
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
