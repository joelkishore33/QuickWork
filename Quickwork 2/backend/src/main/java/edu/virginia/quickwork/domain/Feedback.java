package edu.virginia.quickwork.domain;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

/** Help-desk message from a student or lister, answered by an admin. */
@Entity
@Table(name = "feedback")
public class Feedback {

    @Id
    @Column(length = 36)
    private String id = UUID.randomUUID().toString();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(nullable = false)
    private String subject;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    @Column(columnDefinition = "TEXT")
    private String reply;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "replied_by_id")
    private User repliedBy;

    private Instant repliedAt;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected Feedback() { }

    public Feedback(User author, String subject, String body) {
        this.author = author;
        this.subject = subject;
        this.body = body;
    }

    public boolean isAnswered() { return reply != null; }

    public String getId() { return id; }
    public User getAuthor() { return author; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }

    public String getReply() { return reply; }
    public void setReply(String reply) { this.reply = reply; }

    public User getRepliedBy() { return repliedBy; }
    public void setRepliedBy(User repliedBy) { this.repliedBy = repliedBy; }

    public Instant getRepliedAt() { return repliedAt; }
    public void setRepliedAt(Instant repliedAt) { this.repliedAt = repliedAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
