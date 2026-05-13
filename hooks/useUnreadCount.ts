import { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';

export const useUnreadCount = (userId: string) => {
    const [totalUnread, setTotalUnread] = useState(0);

    useEffect(() => {
        if (!userId) return;

        const checkUnread = () => {
            const count = StorageService.getUnreadCount(userId);
            setTotalUnread(count);
        };

        // Initial check
        checkUnread();

        // Check continuously
        const interval = setInterval(checkUnread, 3000);
        return () => clearInterval(interval);
    }, [userId]);

    return totalUnread;
};
