package edu.virginia.quickwork.domain;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

/** Immutable trail of significant actions, for the admin audit log. */
@Entity
@Table(name = "audit_events")
public class AuditEvent {

    @Id
    @Column(length = 36)
    private String id = UUID.randomUUID().toString();

    /** STUDENT / LISTER / ADMIN / SYSTEM. Stored as text so SYSTEM is representable. */
    @Column(nullable = false, length = 16)
    private String actor;

    private String actorId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String action;

    private String jobId;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected AuditEvent() { }

    public AuditEvent(String actor, String actorId, String action, String jobId) {
        this.actor = actor;
        this.actorId = actorId;
        this.action = action;
        this.jobId = jobId;
    }

    public String getId() { return id; }
    public String getActor() { return actor; }
    public String getActorId() { return actorId; }
    public String getAction() { return action; }
    public String getJobId() { return jobId; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
