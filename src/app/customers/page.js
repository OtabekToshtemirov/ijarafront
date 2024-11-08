'use client'

import { useState } from "react"
import { Search, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

const initialCustomers = [
    {
        id: 1,
        name: "John Smith",
        address: "123 Main St, San Francisco",
        phone: "123-456-7890",
        balance: 0,
    },
    {
        id: 2,
        name: "John Smith",
        address: "123 Main St, San Francisco",
        phone: "123-456-7890",
        balance: -125000,
    },
    // Add more sample data as needed
]

export default function Component() {
    const [customers, setCustomers] = useState(initialCustomers)
    const [searchQuery, setSearchQuery] = useState("")
    const [newCustomer, setNewCustomer] = useState({
        name: "",
        address: "",
        phone: "",
        balance: 0,
    })
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const filteredCustomers = customers.filter((customer) =>
        Object.values(customer).some((value) =>
            value.toString().toLowerCase().includes(searchQuery.toLowerCase())
        )
    )

    const handleAddCustomer = () => {
        setCustomers([
            ...customers,
            {
                id: customers.length + 1,
                ...newCustomer,
            },
        ])
        setNewCustomer({
            name: "",
            address: "",
            phone: "",
            balance: 0,
        })
        setIsDialogOpen(false)
    }

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold">Mijozlar</h1>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Yangi mijoz
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Customer</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={newCustomer.name}
                                    onChange={(e) =>
                                        setNewCustomer({ ...newCustomer, name: e.target.value })
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="address">Address</Label>
                                <Input
                                    id="address"
                                    value={newCustomer.address}
                                    onChange={(e) =>
                                        setNewCustomer({ ...newCustomer, address: e.target.value })
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    value={newCustomer.phone}
                                    onChange={(e) =>
                                        setNewCustomer({ ...newCustomer, phone: e.target.value })
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="balance">Balance</Label>
                                <Input
                                    id="balance"
                                    type="number"
                                    value={newCustomer.balance}
                                    onChange={(e) =>
                                        setNewCustomer({
                                            ...newCustomer,
                                            balance: parseFloat(e.target.value),
                                        })
                                    }
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={handleAddCustomer}>Add Customer</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="relative w-full md:w-96 mb-6">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Mijoz qidirish"
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Balance</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCustomers.map((customer) => (
                            <TableRow
                                key={customer.id}
                                className={customer.balance < 0 ? "bg-red-100" : ""}
                            >
                                <TableCell>{customer.name}</TableCell>
                                <TableCell>{customer.address}</TableCell>
                                <TableCell>{customer.phone}</TableCell>
                                <TableCell>${customer.balance}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
