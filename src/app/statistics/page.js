import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Users, CreditCard } from "lucide-react"

// Mock data
const productRentals = [
    { name: "Bike", count: 150 },
    { name: "Camera", count: 120 },
    { name: "Tent", count: 100 },
    { name: "Surfboard", count: 80 },
    { name: "Kayak", count: 60 },
]

const customerRentals = [
    { month: "Jan", count: 65 },
    { month: "Feb", count: 75 },
    { month: "Mar", count: 100 },
    { month: "Apr", count: 120 },
    { month: "May", count: 150 },
    { month: "Jun", count: 180 },
]

const paymentsData = [
    { month: "Jan", amount: 5000 },
    { month: "Feb", amount: 6000 },
    { month: "Mar", amount: 7500 },
    { month: "Apr", amount: 9000 },
    { month: "May", amount: 11000 },
    { month: "Jun", amount: 13000 },
]

export default function StatisticsPage() {
    const maxProductCount = Math.max(...productRentals.map(p => p.count))
    const maxCustomerCount = Math.max(...customerRentals.map(c => c.count))
    const maxPaymentAmount = Math.max(...paymentsData.map(p => p.amount))

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <header className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900">Rental App Statistics</h1>
            </header>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {/* Products Section */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Products Rented
                        </CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{productRentals.reduce((sum, product) => sum + product.count, 0)}</div>
                        <p className="text-xs text-muted-foreground">
                            Across {productRentals.length} product categories
                        </p>
                        <div className="mt-4 space-y-2">
                            {productRentals.map((product) => (
                                <div key={product.name} className="flex items-center">
                                    <div className="w-24 text-sm">{product.name}</div>
                                    <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500"
                                            style={{ width: `${(product.count / maxProductCount) * 100}%` }}
                                        />
                                    </div>
                                    <div className="w-12 text-right text-sm">{product.count}</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Customers Section */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Customer Rentals
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{customerRentals.reduce((sum, month) => sum + month.count, 0)}</div>
                        <p className="text-xs text-muted-foreground">
                            Total rentals in the last 6 months
                        </p>
                        <div className="mt-4 h-[200px] flex items-end justify-between">
                            {customerRentals.map((month) => (
                                <div key={month.month} className="flex flex-col items-center">
                                    <div
                                        className="w-8 bg-green-500"
                                        style={{ height: `${(month.count / maxCustomerCount) * 180}px` }}
                                    />
                                    <div className="mt-2 text-xs">{month.month}</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Payments Section */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Payments
                        </CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${paymentsData.reduce((sum, month) => sum + month.amount, 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Total payments received in the last 6 months
                        </p>
                        <div className="mt-4 h-[200px] flex items-end">
                            <svg className="w-full h-full" viewBox="0 0 300 200" preserveAspectRatio="none">
                                <polyline
                                    points={paymentsData.map((month, index) =>
                                        `${index * 50},${200 - (month.amount / maxPaymentAmount) * 180}`
                                    ).join(' ')}
                                    fill="none"
                                    stroke="#10b981"
                                    strokeWidth="2"
                                />
                            </svg>
                        </div>
                        <div className="flex justify-between mt-2">
                            {paymentsData.map((month) => (
                                <div key={month.month} className="text-xs">{month.month}</div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}