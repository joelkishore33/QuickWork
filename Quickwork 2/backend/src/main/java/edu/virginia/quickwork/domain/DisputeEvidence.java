package edu.virginia.quickwork.domain;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

/** A note or photo added to a dispute by either party or an admin. */
@Entity
@Table(name = "dispute_evidence")
public class DisputeEvidence {

    @Id
    @Column(length = 36)
    private String id = UUID.randomUUID().toString();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "dispute_id", nullable = false)
    private Dispute dispute;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(columnDefinition = "TEXT")
    private String note;

    /** base64 data URL when the author attached a photo. */
    @Lob
    @Column(columnDefinition = "TEXT")
    private String imageData;

    private String fileName;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected DisputeEvidence() { }

    public DisputeEvidence(Dispute dispute, User author, String note) {
        this.dispute = dispute;
        this.author = author;
        this.note = note;
    }

    public String getId() { return id; }
    public Dispute getDispute() { return dispute; }
    public User getAuthor() { return author; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public String getImageData() { return imageData; }
    public void setImageData(String imageData) { this.imageData = imageData; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
