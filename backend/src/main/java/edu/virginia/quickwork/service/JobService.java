package edu.virginia.quickwork.service;

import edu.virginia.quickwork.domain.*;
import edu.virginia.quickwork.repository.*;
import edu.virginia.quickwork.web.ApiException;
import edu.virginia.quickwork.web.ForbiddenException;
import edu.virginia.quickwork.web.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * The job lifecycle: post → admin approval → applications → hire →
 * completion → payout, with cancellation and disputes hanging off the side.
 * Money is delegated to {@link LedgerService}; this class owns state transitions.
 */
@Service
public class JobService {

    private final JobRepository jobs;
    private final JobApplicationRepository applications;
    private final ReviewRepository reviews;
    private final LedgerService ledgerService;
    private final NotificationService notifier;

    public JobService(JobRepository jobs,
                      JobApplicationRepository applications,
                      ReviewRepository reviews,
                      LedgerService ledgerService,
                      NotificationService notifier) {
        this.jobs = jobs;
        this.applications = applications;
        this.reviews = reviews;
        this.ledgerService = ledgerService;
        this.notifier = notifier;
    }

    public Job require(String jobId) {
        return jobs.findById(jobId)
                .orElseThrow(() -> new NotFoundException("No job with id " + jobId));
    }

    public List<Job> openJobs() {
        return jobs.findOpenJobs(Instant.now());
    }

    public List<Job> forLister(String listerId) {
        return jobs.findByListerIdOrderByCreatedAtDesc(listerId);
    }

    public List<Job> pendingApproval() {
        return jobs.findByStatusOrderByCreatedAtDesc(JobStatus.PENDING_APPROVAL);
    }

    public List<Job> awaitingCompletion() {
        return jobs.findByStatusOrderByCreatedAtDesc(JobStatus.HIRED);
    }

    public List<Job> all() {
        return jobs.findAll();
    }

    // ------------------------------------------------------------------
    // posting & moderation
    // ------------------------------------------------------------------

    /** Post a job. Funds are captured immediately; the listing waits on admin review. */
    @Transactional
    public Job create(Job job) {
        if (job.getPrice() == null || job.getPrice().signum() <= 0) {
            throw new ApiException("Job price must be greater than zero.");
        }
        job.setStatus(JobStatus.PENDING_APPROVAL);
        Job saved = jobs.save(job);

        ledgerService.captureForNewJob(saved);
        notifier.recordSystem("Held %s for \"%s\"".formatted(saved.getPrice(), saved.getTitle()), saved.getId());
        notifier.notifyAdmins("New listing \"%s\" awaiting approval".formatted(saved.getTitle()), saved.getId());
        return saved;
    }

    @Transactional
    public Job approve(Job job, User admin) {
        requireStatus(job, JobStatus.PENDING_APPROVAL, "approve");
        job.setStatus(JobStatus.OPEN);
        notifier.record("ADMIN", admin.getId(), "Approved listing \"%s\"".formatted(job.getTitle()), job.getId());
        notifier.notifyUser(job.getLister(),
                "Your listing \"%s\" is live".formatted(job.getTitle()), job.getId());
        return job;
    }

    /** Reject a listing and return the lister's money. */
    @Transactional
    public Job reject(Job job, User admin, String reason) {
        requireStatus(job, JobStatus.PENDING_APPROVAL, "reject");
        job.setStatus(JobStatus.REJECTED);
        ledgerService.refundLister(job, reason == null ? "Listing rejected" : reason);
        notifier.record("ADMIN", admin.getId(),
                "Rejected and refunded \"%s\"".formatted(job.getTitle()), job.getId());
        notifier.notifyUser(job.getLister(),
                "Your listing \"%s\" was not approved — you've been refunded".formatted(job.getTitle()), job.getId());
        return job;
    }

    /** Lister pulls a listing before anyone is hired; escrow goes back to them. */
    @Transactional
    public Job cancel(Job job, User actor) {
        requireLister(job, actor);
        if (job.getHiredStudent() != null) {
            throw new ApiException("You've already hired someone — report an issue instead of cancelling.");
        }
        if (job.getStatus() != JobStatus.OPEN && job.getStatus() != JobStatus.PENDING_APPROVAL) {
            throw new ApiException("This listing can no longer be cancelled.");
        }
        job.setStatus(JobStatus.CANCELLED);
        ledgerService.refundLister(job, "Listing cancelled by lister");

        applications.findByJobIdOrderByCreatedAtAsc(job.getId()).forEach(a -> {
            a.setStatus(ApplicationStatus.WITHDRAWN);
            notifier.notifyUser(a.getStudent(),
                    "\"%s\" was cancelled by the lister".formatted(job.getTitle()), job.getId());
        });

        notifier.record("LISTER", actor.getId(),
                "Cancelled \"%s\" — %s refunded".formatted(job.getTitle(), job.getPrice()), job.getId());
        notifier.notifyAdmins("Listing \"%s\" was cancelled and refunded".formatted(job.getTitle()), job.getId());
        return job;
    }

    // ------------------------------------------------------------------
    // applications & hiring
    // ------------------------------------------------------------------

    @Transactional
    public JobApplication apply(Job job, User student, String message) {
        if (job.getStatus() != JobStatus.OPEN) {
            throw new ApiException("This job isn't accepting applications.");
        }
        if (job.hasEnded()) {
            throw new ApiException("This job's time slot has already passed.");
        }
        if (applications.existsByJobIdAndStudentId(job.getId(), student.getId())) {
            throw new ApiException("You've already applied to this job.");
        }
        JobApplication application = applications.save(new JobApplication(job, student, message));
        notifier.notifyUser(job.getLister(),
                "%s applied to \"%s\"".formatted(student.getName(), job.getTitle()), job.getId());
        return application;
    }

    @Transactional
    public Job hire(Job job, String applicationId, User actor) {
        requireLister(job, actor);
        requireStatus(job, JobStatus.OPEN, "hire for");

        JobApplication application = applications.findById(applicationId)
                .orElseThrow(() -> new NotFoundException("No application with id " + applicationId));
        if (!application.getJob().getId().equals(job.getId())) {
            throw new ApiException("That application belongs to a different job.");
        }

        application.setStatus(ApplicationStatus.HIRED);
        job.setHiredStudent(application.getStudent());
        job.setStatus(JobStatus.HIRED);

        applications.findByJobIdOrderByCreatedAtAsc(job.getId()).stream()
                .filter(a -> !a.getId().equals(applicationId))
                .forEach(a -> a.setStatus(ApplicationStatus.DECLINED));

        notifier.record("LISTER", actor.getId(),
                "Hired %s for \"%s\"".formatted(application.getStudent().getName(), job.getTitle()), job.getId());
        notifier.notifyUser(application.getStudent(),
                "You were hired for \"%s\"".formatted(job.getTitle()), job.getId());
        return job;
    }

    @Transactional
    public void declineApplication(String applicationId, User actor) {
        JobApplication application = applications.findById(applicationId)
                .orElseThrow(() -> new NotFoundException("No application with id " + applicationId));
        requireLister(application.getJob(), actor);
        application.setStatus(ApplicationStatus.DECLINED);
        notifier.notifyUser(application.getStudent(),
                "You weren't selected for \"%s\"".formatted(application.getJob().getTitle()),
                application.getJob().getId());
    }

    public List<JobApplication> applicationsFor(String jobId) {
        return applications.findByJobIdOrderByCreatedAtAsc(jobId);
    }

    public List<JobApplication> applicationsByStudent(String studentId) {
        return applications.findByStudentIdOrderByCreatedAtDesc(studentId);
    }

    // ------------------------------------------------------------------
    // completion
    // ------------------------------------------------------------------

    /** Student says the work is done. Starts the confirmation clock. */
    @Transactional
    public Job markDoneByStudent(Job job, User student) {
        if (job.getHiredStudent() == null || !job.getHiredStudent().getId().equals(student.getId())) {
            throw new ForbiddenException("You aren't the student hired for this job.");
        }
        requireStatus(job, JobStatus.HIRED, "mark complete");

        Instant now = Instant.now();
        job.setMarkedDoneAt(now);
        if (job.getReminderSentAt() == null) {
            job.setReminderSentAt(now);
        }
        notifier.record("STUDENT", student.getId(),
                "Marked \"%s\" complete — confirmation window started".formatted(job.getTitle()), job.getId());
        notifier.notifyUser(job.getLister(),
                "%s marked \"%s\" complete — confirm to release payment".formatted(student.getName(), job.getTitle()),
                job.getId());
        return job;
    }

    /** Lister confirms; escrow is released to the student. */
    @Transactional
    public Job confirmCompletion(Job job, User actor, boolean automatic) {
        requireStatus(job, JobStatus.HIRED, "complete");
        if (job.getHiredStudent() == null) {
            throw new ApiException("No student is hired for this job.");
        }
        if (!automatic) {
            requireLister(job, actor);
        }

        job.setStatus(JobStatus.COMPLETED);
        job.setCompletedAt(Instant.now());
        ledgerService.releaseToStudent(job, job.getHiredStudent(),
                automatic ? "Auto-released after confirmation window" : "Completion approved by lister");

        notifier.record(automatic ? "SYSTEM" : "LISTER", automatic ? null : actor.getId(),
                "%s payout %s for \"%s\"".formatted(automatic ? "Auto-released" : "Approved",
                        job.getPrice(), job.getTitle()), job.getId());
        notifier.notifyUser(job.getHiredStudent(),
                "You were paid %s for \"%s\"".formatted(job.getPrice(), job.getTitle()), job.getId());
        return job;
    }

    /** Admin or scheduler nudges the lister, starting the confirmation clock. */
    @Transactional
    public Job sendReminder(Job job, User admin, boolean automatic) {
        requireStatus(job, JobStatus.HIRED, "remind about");
        job.setReminderSentAt(Instant.now());
        job.setReminderAutomatic(automatic);

        if (automatic) {
            notifier.recordSystem(
                    "Auto-sent completion reminder for \"%s\" (scheduled time passed)".formatted(job.getTitle()),
                    job.getId());
            notifier.notifyUser(job.getLister(),
                    "\"%s\" has wrapped up — confirm completion to release payment".formatted(job.getTitle()),
                    job.getId());
            notifier.notifyUser(job.getHiredStudent(),
                    "Job time passed for \"%s\" — we asked the lister to confirm".formatted(job.getTitle()),
                    job.getId());
        } else {
            notifier.record("ADMIN", admin == null ? null : admin.getId(),
                    "Sent completion reminder for \"%s\"".formatted(job.getTitle()), job.getId());
            notifier.notifyUser(job.getLister(),
                    "Reminder: confirm completion for \"%s\"".formatted(job.getTitle()), job.getId());
        }
        return job;
    }

    // ------------------------------------------------------------------
    // reviews
    // ------------------------------------------------------------------

    @Transactional
    public Review leaveReview(Job job, User author, int stars, String body) {
        requireLister(job, author);
        if (job.getStatus() != JobStatus.COMPLETED) {
            throw new ApiException("You can only review a completed job.");
        }
        if (reviews.existsByJobId(job.getId())) {
            throw new ApiException("You've already reviewed this job.");
        }
        if (stars < 1 || stars > 5) {
            throw new ApiException("Rating must be between 1 and 5 stars.");
        }
        Review review = reviews.save(new Review(job, job.getHiredStudent(), author, stars, body));
        notifier.notifyUser(job.getHiredStudent(),
                "%s left you a %d-star review".formatted(author.getName(), stars), job.getId());
        return review;
    }

    // ------------------------------------------------------------------

    private void requireLister(Job job, User actor) {
        if (actor == null || !job.getLister().getId().equals(actor.getId())) {
            throw new ForbiddenException("Only the lister who posted this job can do that.");
        }
    }

    private void requireStatus(Job job, JobStatus expected, String verb) {
        if (job.getStatus() != expected) {
            throw new ApiException("Can't %s a job that is %s.".formatted(verb, job.getStatus()));
        }
    }

    public BigDecimal feeFor(BigDecimal price) {
        return ledgerService.feeFor(price);
    }
}
