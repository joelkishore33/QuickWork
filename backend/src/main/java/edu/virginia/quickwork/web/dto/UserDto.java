package edu.virginia.quickwork.web.dto;

import edu.virginia.quickwork.domain.User;

import java.math.BigDecimal;

public record UserDto(
        String id,
        String name,
        String email,
        String role,
        String color,
        String photo,
        String year,
        String bio,
        boolean verified,
        java.util.List<String> skills,
        String organization,
        boolean payoutConfigured,
        String payoutLast4,
        Double rating,
        Long reviewCount,
        BigDecimal totalPaid
) {
    /** Lightweight form used when a user is nested inside another payload. */
    public static UserDto summary(User u) {
        if (u == null) return null;
        return new UserDto(u.getId(), u.getName(), u.getEmail(), u.getRole().name(), u.getColor(), u.getPhoto(),
                u.getYear(), u.getBio(), u.isVerified(), u.getSkills(), u.getOrganization(),
                u.isPayoutConfigured(), u.getPayoutLast4(), null, null, null);
    }

    public static UserDto full(User u, double rating, long reviewCount, BigDecimal totalPaid) {
        if (u == null) return null;
        return new UserDto(u.getId(), u.getName(), u.getEmail(), u.getRole().name(), u.getColor(), u.getPhoto(),
                u.getYear(), u.getBio(), u.isVerified(), u.getSkills(), u.getOrganization(),
                u.isPayoutConfigured(), u.getPayoutLast4(), rating, reviewCount, totalPaid);
    }
}
