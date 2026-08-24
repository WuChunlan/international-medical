package com.intlmedical.util;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class SecurityUtil {

    public static Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return null;
        Object principal = auth.getPrincipal();
        if (principal instanceof Long) return (Long) principal;
        return null;
    }

    public static Long getCurrentHospitalId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return null;
        Object details = auth.getDetails();
        if (details instanceof Long) return (Long) details;
        return null;
    }

    public static boolean hasRole(String role) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_" + role.toUpperCase()));
    }

    public static boolean isAdmin() {
        return hasRole("admin");
    }

    public static boolean isHospitalAdmin() {
        return hasRole("hospital_admin");
    }

    public static boolean isBaseAdmin() {
        return hasRole("base_admin");
    }

    /**
     * 判断当前用户是否有权限编辑/删除某条数据。
     * Admin可操作任何数据；基础管理员只能操作自己创建的（createdUser匹配）。
     */
    public static boolean canEdit(Long createdUser) {
        if (isAdmin()) return true;
        if (isBaseAdmin()) {
            Long currentUserId = getCurrentUserId();
            return currentUserId != null && currentUserId.equals(createdUser);
        }
        return false;
    }
}
