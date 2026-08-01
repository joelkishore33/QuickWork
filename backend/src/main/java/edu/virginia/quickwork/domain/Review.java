package edu.virginia.quickwork.domain;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "reviews")
public class Review {

    @Id
    @Column(length = 36)
    private String id = UUID.randomUUID().toString();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(nullable = false)
    private int stars;

    @Column(columnDefinition = "TEXT")
    private String body;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected Review() { }

    public Review(Job job, User student, User author, int stars, String body) {
        this.job = job;
        this.student = student;
        this.author = author;
        this.stars = stars;
        this.body = body;
    }

    public String getId() { return id; }
    public Job getJob() { return job; }
    public User getStudent() { return student; }
    public User getAuthor() { return author; }

    public int getStars() { return stars; }
    public void setStars(int stars) { this.stars = stars; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }

    public Instant getCreatedAt() { return createdAt; }
}
