package edu.virginia.quickwork.domain;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "jobs")
public class Job {

    @Id
    @Column(length = 36)
    private String id = UUID.randomUUID().toString();

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    // --- where ---
    @Column(nullable = false)
    private String locationName;
    /** Nullable so a map can be added later without a migration. */
    private Double latitude;
    private Double longitude;

    // --- when ---
    /** Human-readable, e.g. "Sat Jun 14 · 10:00 AM". */
    @Column(nullable = false)
    private String scheduleLabel;
    private String durationLabel;
    /** Machine-readable end of the work window. Drives reminders and expiry. */
    private Instant endsAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private JobStatus status = JobStatus.PENDING_APPROVAL;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "lister_id", nullable = false)
    private User lister;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hired_student_id")
    private User hiredStudent;

    @OneToMany(mappedBy = "job", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<JobApplication> applications = new ArrayList<>();

    // --- completion tracking ---
    /** Set when the student says the work is done. */
    private Instant markedDoneAt;
    /** Set when the lister is nudged (manually or by the scheduler). Starts the auto-release clock. */
    private Instant reminderSentAt;
    /** True when the reminder came from the scheduler rather than an admin. */
    private boolean reminderAutomatic;
    private Instant completedAt;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected Job() { }

    public Job(String title, String description, String category, BigDecimal price, User lister) {
        this.title = title;
        this.description = description;
        this.category = category;
        this.price = price;
        this.lister = lister;
    }

    /** True once the scheduled work window has passed. */
    public boolean hasEnded() {
        return endsAt != null && Instant.now().isAfter(endsAt);
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public String getLocationName() { return locationName; }
    public void setLocationName(String locationName) { this.locationName = locationName; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getScheduleLabel() { return scheduleLabel; }
    public void setScheduleLabel(String scheduleLabel) { this.scheduleLabel = scheduleLabel; }

    public String getDurationLabel() { return durationLabel; }
    public void setDurationLabel(String durationLabel) { this.durationLabel = durationLabel; }

    public Instant getEndsAt() { return endsAt; }
    public void setEndsAt(Instant endsAt) { this.endsAt = endsAt; }

    public JobStatus getStatus() { return status; }
    public void setStatus(JobStatus status) { this.status = status; }

    public User getLister() { return lister; }
    public void setLister(User lister) { this.lister = lister; }

    public User getHiredStudent() { return hiredStudent; }
    public void setHiredStudent(User hiredStudent) { this.hiredStudent = hiredStudent; }

    public List<JobApplication> getApplications() { return applications; }
    public void setApplications(List<JobApplication> applications) { this.applications = applications; }

    public Instant getMarkedDoneAt() { return markedDoneAt; }
    public void setMarkedDoneAt(Instant markedDoneAt) { this.markedDoneAt = markedDoneAt; }

    public Instant getReminderSentAt() { return reminderSentAt; }
    public void setReminderSentAt(Instant reminderSentAt) { this.reminderSentAt = reminderSentAt; }

    public boolean isReminderAutomatic() { return reminderAutomatic; }
    public void setReminderAutomatic(boolean reminderAutomatic) { this.reminderAutomatic = reminderAutomatic; }

    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
