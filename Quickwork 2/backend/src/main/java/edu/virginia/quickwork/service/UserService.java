package edu.virginia.quickwork.service;

import edu.virginia.quickwork.domain.*;
import edu.virginia.quickwork.repository.*;
import edu.virginia.quickwork.web.ForbiddenException;
import edu.virginia.quickwork.web.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserService {

    private final UserRepository users;
    private final ReviewRepository reviews;

    public UserService(UserRepository users, ReviewRepository reviews) {
        this.users = users;
        this.reviews = reviews;
    }

    public User require(String id) {
        return users.findById(id)
                .orElseThrow(() -> new NotFoundException("No user with id " + id));
    }

    public User requireRole(String id, UserRole role) {
        User user = require(id);
        if (user.getRole() != role) {
            throw new ForbiddenException("This action requires the %s role.".formatted(role));
        }
        return user;
    }

    public List<User> byRole(UserRole role) {
        return users.findByRole(role);
    }

    public double averageStars(String studentId) {
        return Math.round(reviews.averageStarsForStudent(studentId) * 10) / 10.0;
    }

    public long reviewCount(String studentId) {
        return reviews.countByStudentId(studentId);
    }

    public List<Review> reviewsFor(String studentId) {
        return reviews.findByStudentIdOrderByCreatedAtDesc(studentId);
    }

    @Transactional
    public User updateProfile(User user, String bio, List<String> skills, String photo) {
        if (bio != null) user.setBio(bio);
        if (skills != null) user.setSkills(skills);
        if (photo != null) user.setPhoto(photo);
        return user;
    }

    @Transactional
    public User configurePayout(User user, String last4) {
        user.setPayoutConfigured(true);
        user.setPayoutLast4(last4);
        return user;
    }
}
