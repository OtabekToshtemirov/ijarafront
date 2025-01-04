'use client';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchDailyRevenue,
    fetchWeeklyRevenue,
    fetchMonthlyRevenue,
    fetchYearlyRevenue,
    fetchTopCustomers,
    fetchMostRentedCars,
} from '@/lib/features/statistics/statisticsSlice';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function StatisticsPage() {
    const dispatch = useDispatch();
    const {
        dailyRevenue,
        weeklyRevenue,
        monthlyRevenue,
        yearlyRevenue,
        topCustomers,
        mostRentedCars,
    } = useSelector((state) => state.statistics);

    useEffect(() => {
        dispatch(fetchDailyRevenue());
        dispatch(fetchWeeklyRevenue());
        dispatch(fetchMonthlyRevenue());
        dispatch(fetchYearlyRevenue());
        dispatch(fetchTopCustomers());
        dispatch(fetchMostRentedCars());
    }, [dispatch]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'UZS',
        }).format(amount);
    };

    const StatCard = ({ title, data, loading, error }) => (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : error ? (
                    <p className="text-red-500">Ma'lumotlarni yuklashda xatolik</p>
                ) : (
                    <div className="text-2xl font-bold">
                        {data?.stats?.totalAmount
                            ? formatCurrency(data.stats.totalAmount)
                            : "Ma'lumot yo'q"}
                    </div>
                )}
            </CardContent>
        </Card>
    );

    const CustomerCard = ({ customer, index }) => (
        <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg shadow mb-2">
            <div className="flex items-center space-x-4">
                <div className="w-8 h-8 flex items-center justify-center bg-primary/10 rounded-full">
                    {index + 1}
                </div>
                <div>
                    <p className="font-semibold">{customer.customerName}</p>
                    <p className="text-sm text-gray-500">{customer.customerPhone}</p>
                </div>
            </div>
            <div className="text-right">
                <p className="font-semibold">{formatCurrency(customer.totalAmount)}</p>
                <p className="text-sm text-gray-500">{customer.paymentCount} ta to'lov</p>
            </div>
        </div>
    );

    const CarCard = ({ car, index }) => (
        <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg shadow mb-2">
            <div className="flex items-center space-x-4">
                <div className="w-10 h-10 flex items-center justify-center bg-gray-500 rounded-full text-primary">
                    {index + 1}
                </div>
                <div className="flex flex-col">
                    <p className="text-primary">Haydovchi: {car.driverName}</p>
                    <p className="text-primary">Mashina: {car.carNumber}</p>
                </div>
            </div>
            <div className="text-right">
                <p className="font-semibold text-primary">{car.rentalCount} ta ijara</p>
            </div>
        </div>
    );

    return (
        <div className="container mx-auto p-6 space-y-6">
            <h1 className="text-3xl font-bold mb-8">Statistika</h1>

            {/* Revenue Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Kunlik daromad"
                    data={dailyRevenue.data}
                    loading={dailyRevenue.loading}
                    error={dailyRevenue.error}
                />
                <StatCard
                    title="Haftalik daromad"
                    data={weeklyRevenue.data}
                    loading={weeklyRevenue.loading}
                    error={weeklyRevenue.error}
                />
                <StatCard
                    title="Oylik daromad"
                    data={monthlyRevenue.data}
                    loading={monthlyRevenue.loading}
                    error={monthlyRevenue.error}
                />
                <StatCard
                    title="Yillik daromad"
                    data={yearlyRevenue.data}
                    loading={yearlyRevenue.loading}
                    error={yearlyRevenue.error}
                />
            </div>

            {/* Top Customers and Most Rented Cars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Top 5 mijozlar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {topCustomers.loading ? (
                            <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : topCustomers.error ? (
                            <p className="text-red-500">Mijozlarni yuklashda xatolik</p>
                        ) : (
                            <div className="space-y-2">
                                {topCustomers.data?.map((customer, index) => (
                                    <CustomerCard
                                        key={customer._id}
                                        customer={customer}
                                        index={index}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Ko'p ijaraga berilgan mashinalar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {mostRentedCars.loading ? (
                            <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : mostRentedCars.error ? (
                            <p className="text-red-500">Mashinalarni yuklashda xatolik</p>
                        ) : (
                            <div className="space-y-2">
                                {mostRentedCars.data?.map((car, index) => (
                                    <CarCard
                                        key={car._id}
                                        car={car}
                                        index={index}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}