package edu.virginia.quickwork.web;

import edu.virginia.quickwork.domain.User;
import edu.virginia.quickwork.domain.UserRole;
import edu.virginia.quickwork.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

/**
 * Stand-in for real authentication.
 *
 * <p>The client sends {@code X-User-Id}; we look the user up and trust it. When
 * proper auth lands, this is the only class that needs to change — swap the
 * header read for a decoded JWT subject and every controller keeps working.
 */
@Component
public class CurrentUser {

    public static final String HEADER = "X-User-Id";

    private final UserService users;

    public CurrentUser(UserService users) {
        this.users = users;
    }

    public User require(HttpServletRequest request) {
        String id = request.getHeader(HEADER);
        if (id == null || id.isBlank()) {
            throw new ForbiddenException("Missing " + HEADER + " header.");
        }
        return users.require(id);
    }

    public User requireRole(HttpServletRequest request, UserRole role) {
        User user = require(request);
        if (user.getRole() != role) {
            throw new ForbiddenException("This action requires the %s role.".formatted(role));
        }
        return user;
    }

    public User requireAdmin(HttpServletRequest request) {
        return requireRole(request, UserRole.ADMIN);
    }
}
