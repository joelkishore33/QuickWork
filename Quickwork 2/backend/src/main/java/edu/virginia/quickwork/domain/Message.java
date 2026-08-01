package edu.virginia.quickwork.domain;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "messages")
public class Message {

    @Id
    @Column(length = 36)
    private String id = UUID.randomUUID().toString();

    /** Conversations are scoped to a job, so both parties share one thread per gig. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String body;

    private boolean readByRecipient;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected Message() { }

    public Message(Job job, User sender, String body) {
        this.job = job;
        this.sender = sender;
        this.body = body;
    }

    public String getId() { return id; }
    public Job getJob() { return job; }
    public User getSender() { return sender; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }

    public boolean isReadByRecipient() { return readByRecipient; }
    public void setReadByRecipient(boolean readByRecipient) { this.readByRecipient = readByRecipient; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
