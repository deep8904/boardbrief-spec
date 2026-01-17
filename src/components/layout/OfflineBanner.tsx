import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    if (isOnline) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-destructive text-destructive-foreground p-2 text-center text-sm font-medium z-50 flex items-center justify-center gap-2 animate-in slide-in-from-bottom-5">
            <WifiOff className="h-4 w-4" />
            <span>You are currently offline. Changes may not be saved.</span>
        </div>
    );
}
