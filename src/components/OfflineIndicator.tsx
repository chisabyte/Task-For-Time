"use client";

import { useEffect, useState } from "react";

export function OfflineIndicator() {
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        function handleOnline() {
            setIsOffline(false);
        }
        function handleOffline() {
            setIsOffline(true);
        }

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        // Initial check
        setIsOffline(!navigator.onLine);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    if (!isOffline) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50 animate-bounce">
            <span className="material-symbols-outlined text-yellow-400">wifi_off</span>
            <div className="text-sm font-medium">
                You are offline. Some features may be unavailable.
            </div>
        </div>
    );
}
