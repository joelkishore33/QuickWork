package edu.virginia.quickwork.domain;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "users")
public class User {

    @Id
    @Column(length = 36)
    private String id = UUID.randomUUID().toString();

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private UserRole role;

    /** Display colour used for the avatar fallback. */
    private String color;

    /** base64 data URL. Small images only — see README for the S3 note. */
    @Lob
    @Column(columnDefinition = "TEXT")
    private String photo;

    // --- student fields ---
    private String year;
    @Column(columnDefinition = "TEXT")
    private String bio;
    private boolean verified;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_skills", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "skill")
    private List<String> skills = new ArrayList<>();

    private String payoutLast4;
    private boolean payoutConfigured;

    // --- lister fields ---
    private String organization;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected User() { }

    public User(String name, String email, UserRole role) {
        this.name = name;
        this.email = email;
        this.role = role;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public UserRole getRole() { return role; }
    public void setRole(UserRole role) { this.role = role; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public String getPhoto() { return photo; }
    public void setPhoto(String photo) { this.photo = photo; }

    public String getYear() { return year; }
    public void setYear(String year) { this.year = year; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public boolean isVerified() { return verified; }
    public void setVerified(boolean verified) { this.verified = verified; }

    public List<String> getSkills() { return skills; }
    public void setSkills(List<String> skills) { this.skills = skills; }

    public String getPayoutLast4() { return payoutLast4; }
    public void setPayoutLast4(String payoutLast4) { this.payoutLast4 = payoutLast4; }

    public boolean isPayoutConfigured() { return payoutConfigured; }
    public void setPayoutConfigured(boolean payoutConfigured) { this.payoutConfigured = payoutConfigured; }

    public String getOrganization() { return organization; }
    public void setOrganization(String organization) { this.organization = organization; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
