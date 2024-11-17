'use client'
import { useRef } from 'react'
import { Provider } from 'react-redux'
import { makeStore } from '@/lib/store'

export const StoreProvider = ({ children }) => {
    const store = useRef(makeStore()).current
    return <Provider store={store}>{children}</Provider>
}