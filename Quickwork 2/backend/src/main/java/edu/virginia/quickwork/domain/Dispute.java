package edu.virginia.quickwork.domain;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "disputes")
public class Dispute {

    @Id
    @Column(length = 36)
    private String id = UUID.randomUUID().toString();

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_id", nullable = false, unique = true)
    private Job job;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "opened_by_id", nullable = false)
    private User openedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private DisputeStatus status = DisputeStatus.OPEN;

    @Enumerated(EnumType.STRING)
    @Column(length = 24)
    private DisputeDecision decision;

    /** Only set when the decision is SPLIT. */
    @Column(precision = 10, scale = 2)
    private BigDecimal studentAmount;

    @Column(columnDefinition = "TEXT")
    private String resolutionNote;

    @OneToMany(mappedBy = "dispute", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    private List<DisputeEvidence> evidence = new ArrayList<>();

    @Column(nullable = false)
    private Instant createdAt = Instant.now();
    private Instant resolvedAt;

    protected Dispute() { }

    public Dispute(Job job, User openedBy) {
        this.job = job;
        this.openedBy = openedBy;
    }

    public String getId() { return id; }
    public Job getJob() { return job; }
    public User getOpenedBy() { return openedBy; }

    public DisputeStatus getStatus() { return status; }
    public void setStatus(DisputeStatus status) { this.status = status; }

    public DisputeDecision getDecision() { return decision; }
    public void setDecision(DisputeDecision decision) { this.decision = decision; }

    public BigDecimal getStudentAmount() { return studentAmount; }
    public void setStudentAmount(BigDecimal studentAmount) { this.studentAmount = studentAmount; }

    public String getResolutionNote() { return resolutionNote; }
    public void setResolutionNote(String resolutionNote) { this.resolutionNote = resolutionNote; }

    public List<DisputeEvidence> getEvidence() { return evidence; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(Instant resolvedAt) { this.resolvedAt = resolvedAt; }
}
