package edu.virginia.quickwork.domain;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Append-only record of money movement. Rows are never deleted; a hold is
 * closed out by flipping its status and writing a matching PAYOUT or REFUND.
 */
@Entity
@Table(name = "ledger_entries")
public class LedgerEntry {

    @Id
    @Column(length = 36)
    private String id = UUID.randomUUID().toString();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private LedgerEntryType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private LedgerEntryStatus status;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    /** Who received the money, when it left escrow. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payee_id")
    private User payee;

    private String note;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected LedgerEntry() { }

    public LedgerEntry(Job job, LedgerEntryType type, LedgerEntryStatus status, BigDecimal amount) {
        this.job = job;
        this.type = type;
        this.status = status;
        this.amount = amount;
    }

    public String getId() { return id; }
    public Job getJob() { return job; }

    public LedgerEntryType getType() { return type; }
    public void setType(LedgerEntryType type) { this.type = type; }

    public LedgerEntryStatus getStatus() { return status; }
    public void setStatus(LedgerEntryStatus status) { this.status = status; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public User getPayee() { return payee; }
    public void setPayee(User payee) { this.payee = payee; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
