
import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { UserRole } from '@/types';

type Permission = 
    | 'view_feed' 
    | 'create_post' 
    | 'comment' 
    | 'like' 
    | 'moderate_content' 
    | 'admin_dashboard' 
    | 'view_analytics' 
    | 'upload_video_4k';

interface RBACContextType {
    hasRole: (role: UserRole) => boolean;
    hasPermission: (permission: Permission) => boolean;
    role: UserRole;
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

// Role Hierarchy: Higher index = more power
const ROLE_HIERARCHY: UserRole[] = ['banned', 'visitor', 'citoyen', 'moderator', 'founder'];

// Implicit Permissions
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    banned: [],
    visitor: ['view_feed'],
    citoyen: ['view_feed', 'create_post', 'comment', 'like'],
    moderator: ['view_feed', 'create_post', 'comment', 'like', 'moderate_content'],
    founder: ['view_feed', 'create_post', 'comment', 'like', 'moderate_content', 'admin_dashboard', 'view_analytics', 'upload_video_4k']
};

export function RBACProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    
    // Default to 'visitor' if not logged in, or 'citoyen' if logged in but no role set
    const currentRole: UserRole = user?.role || (user ? 'citoyen' : 'visitor');

    const hasRole = (targetRole: UserRole) => {
        return currentRole === targetRole;
    };

    /**
     * Checks if user has permission.
     * Logic: 1. Check explicit custom_permissions override.
     *        2. Check implicit role permissions.
     */
    const hasPermission = (permission: Permission) => {
        // 1. Custom Override (Allow or Deny)
        if (user?.custom_permissions && user.custom_permissions[permission] !== undefined) {
             return user.custom_permissions[permission];
        }

        // 2. Role Base
        const allowed = ROLE_PERMISSIONS[currentRole] || [];
        return allowed.includes(permission);
    };

    // Helper: Check Hierarchy (e.g. is at least Moderator)
    const isAtLeast = (targetRole: UserRole) => {
        const currentIdx = ROLE_HIERARCHY.indexOf(currentRole);
        const targetIdx = ROLE_HIERARCHY.indexOf(targetRole);
        return currentIdx >= targetIdx;
    };

    return (
        <RBACContext.Provider value={{ hasRole, hasPermission, role: currentRole }}>
            {children}
        </RBACContext.Provider>
    );
}

export function useRBAC() {
    const context = useContext(RBACContext);
    if (context === undefined) {
        throw new Error('useRBAC must be used within a RBACProvider');
    }
    return context;
}
