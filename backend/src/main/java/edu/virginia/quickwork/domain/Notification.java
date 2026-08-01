package edu.virginia.quickwork.domain;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @Column(length = 36)
    private String id = UUID.randomUUID().toString();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    /** Optional deep link target, e.g. a job id. */
    private String jobId;

    private boolean read;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected Notification() { }

    public Notification(User recipient, String body, String jobId) {
        this.recipient = recipient;
        this.body = body;
        this.jobId = jobId;
    }

    public String getId() { return id; }
    public User getRecipient() { return recipient; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }

    public String getJobId() { return jobId; }
    public void setJobId(String jobId) { this.jobId = jobId; }

    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
