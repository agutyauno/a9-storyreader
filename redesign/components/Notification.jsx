import React, { createContext, useContext, useState, useEffect } from 'react'
import { CheckCircle, Info, AlertTriangle, XCircle, X } from 'lucide-react'

// Create Context
const NotificationContext = createContext()

// Custom Hook
export function useNotification() {
    return useContext(NotificationContext)
}

// Helper to get Icon based on type
function getNotificationIcon(type) {
    switch (type) {
        case 'success':
            return <CheckCircle size={20} className="notification-icon success" />
        case 'warning':
            return <AlertTriangle size={20} className="notification-icon warning" />
        case 'danger':
            return <XCircle size={20} className="notification-icon danger" />
        case 'info':
        default:
            return <Info size={20} className="notification-icon info" />
    }
}

// Individual Notification Item
function NotificationItem({ id, message, type = 'info', title, onClose, duration = 4000 }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id)
        }, duration)

        return () => clearTimeout(timer)
    }, [id, duration, onClose])

    const defaultTitle = type.toUpperCase()
    const displayTitle = title || defaultTitle

    return (
        <div className={`notification-item notification-${type}`}>
            {getNotificationIcon(type)}
            <div className="notification-content">
                <span className="notification-title technical-text">{displayTitle}</span>
                <p className="notification-message">{message}</p>
            </div>
            <button className="notification-close-btn" onClick={() => onClose(id)} aria-label="Close">
                <X size={16} />
            </button>
        </div>
    )
}

// Context Provider
export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([])

    const addNotification = (message, type = 'info', title = '') => {
        const id = Math.random().toString(36).substring(2, 9)
        setNotifications((prev) => [...prev, { id, message, type, title }])
    }

    const removeNotification = (id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
    }

    return (
        <NotificationContext.Provider value={{ addNotification }}>
            {children}
            {/* Notification Stack container */}
            <div className="notification-stack">
                {notifications.map((n) => (
                    <NotificationItem
                        key={n.id}
                        id={n.id}
                        message={n.message}
                        type={n.type}
                        title={n.title}
                        onClose={removeNotification}
                    />
                ))}
            </div>
        </NotificationContext.Provider>
    )
}
