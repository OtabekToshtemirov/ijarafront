'use client';

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { fetchRentalsByProductId } from "@/lib/features/rentals/rentalsSlice";

export default function ProductDetailsSheet({ product, isOpen, onOpenChange }) {
    const dispatch = useDispatch();
    const rentals = useSelector((state) => state.rentals.rentals);
    const status = useSelector((state) => state.rentals.status);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'N/A';
            return date.toLocaleDateString();
        } catch (error) {
            return 'N/A';
        }
    };

    useEffect(() => {
        if (isOpen && product?._id) {
            dispatch(fetchRentalsByProductId(product._id));
        }
    }, [dispatch, isOpen, product?._id]);

    const getActiveRentals = () => {
        return rentals.filter(rental => {
            const hasProduct = rental.borrowedProducts.some(bp => bp.product?._id === product?._id);
            return rental.status === 'active' && hasProduct;
        });
    };

    const getReturnedQuantity = (rental) => {
        return rental.returnedProducts
            .filter(rp => rp.product?._id === product?._id)
            .reduce((sum, rp) => sum + rp.quantity, 0);
    };

    const getBorrowedQuantity = (rental) => {
        const borrowed = rental.borrowedProducts.find(bp => bp.product?._id === product?._id);
        return borrowed ? borrowed.quantity : 0;
    };

    const getRemainingQuantity = (rental) => {
        const borrowed = getBorrowedQuantity(rental);
        const returned = getReturnedQuantity(rental);
        return borrowed - returned;
    };

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="w-[90%] sm:max-w-2xl overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle>{product?.name}</SheetTitle>
                    <SheetDescription>
                    Мулк маълумотлари ва ижаралар тарихи
                    </SheetDescription>
                </SheetHeader>

                {/* Product Details */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Мулк маълумотлари</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium">Категория:</p>
                                <p>{product?.category || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">Кунлик нарх:</p>
                                <p>{product?.dailyRate?.toLocaleString()} сўм</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">Умумий сони:</p>
                                <p>{product?.quantity} дона</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">Марта ижарага берилган:</p>
                                <p>{product?.rentalCount}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">Ҳолати:</p>
                                <Badge variant={product?.isAvailable ? "default" : "secondary"}>
                                    {product?.isAvailable ? 'Мавжуд' : 'Мавжуд эмас'}
                                </Badge>
                            </div>
                            {product?.description && (
                                <div className="col-span-2">
                                    <p className="text-sm font-medium">Изоҳ:</p>
                                    <p>{product.description}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Combo Parts */}
                {product?.type === 'combo' && product.parts?.length > 0 && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Қисмлар</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Номи</TableHead>
                                        <TableHead>Сони</TableHead>
                                        <TableHead>Нархи</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {product.parts.map((part) => (
                                        <TableRow key={part._id}>
                                            <TableCell>{part.product?.name || 'Номаълум'}</TableCell>
                                            <TableCell>{part.quantity} дона</TableCell>
                                            <TableCell>{part.dailyRate?.toLocaleString()} сўм</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}

                {/* Active Rentals */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Фаол ижаралар</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {status === 'loading' ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : getActiveRentals().length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">
                                Фаол ижаралар мавжуд эмас
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {getActiveRentals().map((rental) => (
                                    <div 
                                        key={rental._id} 
                                        className="border rounded-lg p-4"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-medium">{rental.rentalNumber}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {rental.customer?.name}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">
                                                    {getBorrowedQuantity(rental)} дона
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    Қолди: {getRemainingQuantity(rental)} дона
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            Сана: {formatDate(rental.startDate)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Rental History */}
                <Card>
                    <CardHeader>
                        <CardTitle>Ижаралар тарихи</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {status === 'loading' ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : rentals.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">
                                Ижаралар тарихи мавжуд эмас
                            </p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Сана</TableHead>
                                        <TableHead>Мижоз</TableHead>
                                        <TableHead>Ижара рақами</TableHead>
                                        <TableHead>Сони</TableHead>
                                        <TableHead>Ҳолати</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rentals.map((rental) => (
                                        <TableRow key={rental._id}>
                                            <TableCell>
                                            {formatDate(rental.createdAt)}
                                            </TableCell>
                                            <TableCell>{rental.customer?.name}</TableCell>
                                            <TableCell>{rental.rentalNumber}</TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <p>{getBorrowedQuantity(rental)} дона</p>
                                                    {rental.status === 'active' && (
                                                        <p className="text-sm text-muted-foreground">
                                                            Қолди: {getRemainingQuantity(rental)} дона
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={rental.status === 'active' ? "default" : "secondary"}>
                                                    {rental.status === 'active' ? 'Фаол' : 'Якунланган'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </SheetContent>
        </Sheet>
    );
}