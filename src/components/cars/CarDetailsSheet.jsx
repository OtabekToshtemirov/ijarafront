'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchCarById } from '@/lib/features/cars/carsSlice';
import { Skeleton } from "@/components/ui/skeleton";

const getStatusBadge = (status) => {
    switch (status) {
        case 'active':
            return <Badge variant="success">Фаол</Badge>;
        case 'inactive':
            return <Badge variant="destructive">Фаол эмас</Badge>;
        case 'repair':
            return <Badge variant="warning">Таъмирда</Badge>;
        case 'banned':
            return <Badge variant="destructive">Тақиқда</Badge>;
        default:
            return <Badge variant="secondary">Номаълум</Badge>;
    }
};

const getRentalStatusBadge = (status) => {
    switch (status) {
        case 'active':
            return <Badge variant="success">Фаол</Badge>;
        case 'completed':
            return <Badge variant="secondary">Тугалланган</Badge>;
        case 'overdue':
            return <Badge variant="destructive">Муддати ўтган</Badge>;
        default:
            return <Badge variant="secondary">Номаълум</Badge>;
    }
};

const formatDate = (date) => {
    if (!date) return 'Номаълум';
    return new Date(date).toLocaleDateString('uz-UZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const formatCurrency = (amount) => {
    if (!amount) return '0';
    return amount.toLocaleString('uz-UZ', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
};

export default function CarDetailsSheet({ isOpen, onClose, car }) {
    const dispatch = useDispatch();
    const { currentCar, status } = useSelector((state) => state.cars);
    
    useEffect(() => {
        if (isOpen && car?._id) {
            dispatch(fetchCarById(car._id));
        }
    }, [isOpen, car, dispatch]);

    if (!isOpen) return null;

    const isLoading = status === 'loading';
    const displayCar = currentCar || car;

    if (!displayCar) return null;

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-[400px] sm:w-[540px]">
                <SheetHeader className="mb-5">
                    <SheetTitle>Транспорт тафсилотлари</SheetTitle>
                </SheetHeader>

                <ScrollArea className="h-[calc(100vh-8rem)] pr-4">
                    <div className="space-y-6">
                        {/* Asosiy ma'lumotlar */}
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Асосий маълумотлар</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Транспорт рақами</p>
                                    {isLoading ? (
                                        <Skeleton className="h-6 w-24" />
                                    ) : (
                                        <p className="font-medium">{displayCar.carNumber}</p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Ижаралар сони</p>
                                    {isLoading ? (
                                        <Skeleton className="h-6 w-16" />
                                    ) : (
                                        <p className="font-medium">{displayCar.rentalCount || 0}</p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Ҳолати</p>
                                    {isLoading ? (
                                        <Skeleton className="h-6 w-20" />
                                    ) : (
                                        <div className="mt-1">{getStatusBadge(displayCar.status)}</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Haydovchi ma'lumotlari */}
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Ҳайдовчи маълумотлари</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Исми</p>
                                    {isLoading ? (
                                        <Skeleton className="h-6 w-32" />
                                    ) : (
                                        <p className="font-medium">{displayCar.driverName}</p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Телефон рақами</p>
                                    {isLoading ? (
                                        <Skeleton className="h-6 w-32" />
                                    ) : (
                                        <p className="font-medium">{displayCar.driverPhone}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Qo'shimcha ma'lumotlar */}
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Қўшимча маълумотлар</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {displayCar.description ? ( 
                                    <div className="col-span-2">
                                        {isLoading ? (
                                            <Skeleton className="h-6 w-full" />
                                        ) : (
                                            <p className="font-medium">{displayCar.description}</p>
                                        )}
                                    </div>
                                ) : (<p>Ҳозирча маълумотлар йўқ</p>)}
                            </div>
                        </div>

                        {/* Faol ijaralar */}
                        {isLoading ? (
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Фаол ижаралар</h3>
                                <div className="space-y-4">
                                    <Skeleton className="h-32 w-full" />
                                    <Skeleton className="h-32 w-full" />
                                </div>
                            </div>
                        ) : displayCar.activeRentals?.length > 0 ? (
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Фаол ижаралар</h3>
                                <div className="space-y-4">
                                    {displayCar.activeRentals.map((rental, index) => (
                                        <div key={index} className="border rounded-lg p-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Мижоз</p>
                                                    <p className="font-medium">{rental.customer?.name || 'Номаълум'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Телефон</p>
                                                    <p className="font-medium">{rental.customer?.phone || 'Номаълум'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Статус</p>
                                                    <div className="mt-1">{getRentalStatusBadge(rental.status)}</div>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Умумий сумма</p>
                                                    <p className="font-medium">{formatCurrency(rental.totalAmount)} сўм</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Бошланиш санаси</p>
                                                    <p className="font-medium">{formatDate(rental.startDate)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Тугаш санаси</p>
                                                    <p className="font-medium">{formatDate(rental.endDate)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        {/* Ijara tarixi */}
                        {isLoading ? (
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Ижара тарихи</h3>
                                <div className="space-y-4">
                                    <Skeleton className="h-32 w-full" />
                                    <Skeleton className="h-32 w-full" />
                                </div>
                            </div>
                        ) : displayCar.rentalHistory?.length > 0 ? (
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Ижара тарихи</h3>
                                <div className="space-y-4">
                                    {displayCar.rentalHistory.map((rental, index) => (
                                        <div key={index} className="border rounded-lg p-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Мижоз</p>
                                                    <p className="font-medium">{rental.customer?.name || 'Номаълум'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Телефон</p>
                                                    <p className="font-medium">{rental.customer?.phone || 'Номаълум'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Статус</p>
                                                    <div className="mt-1">{getRentalStatusBadge(rental.status)}</div>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Умумий сумма</p>
                                                    <p className="font-medium">{formatCurrency(rental.totalAmount)} сўм</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Бошланиш санаси</p>
                                                    <p className="font-medium">{formatDate(rental.startDate)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Тугаш санаси</p>
                                                    <p className="font-medium">{formatDate(rental.endDate)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Қайтарилган сана</p>
                                                    <p className="font-medium">{formatDate(rental.returnDate)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
