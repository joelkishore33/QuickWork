package edu.virginia.quickwork.service;

import edu.virginia.quickwork.domain.*;
import edu.virginia.quickwork.repository.DisputeRepository;
import edu.virginia.quickwork.web.ApiException;
import edu.virginia.quickwork.web.ForbiddenException;
import edu.virginia.quickwork.web.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/** Disputes freeze escrow until an admin rules on them. */
@Service
public class DisputeService {

    private final DisputeRepository disputes;
    private final LedgerService ledgerService;
    private final NotificationService notifier;

    public DisputeService(DisputeRepository disputes,
                          LedgerService ledgerService,
                          NotificationService notifier) {
        this.disputes = disputes;
        this.ledgerService = ledgerService;
        this.notifier = notifier;
    }

    public Dispute require(String id) {
        return disputes.findById(id)
                .orElseThrow(() -> new NotFoundException("No dispute with id " + id));
    }

    public List<Dispute> all() {
        return disputes.findAllByOrderByCreatedAtDesc();
    }

    public List<Dispute> forParticipant(String userId) {
        return disputes.findForParticipant(userId);
    }

    public long openCount() {
        return disputes.countByStatus(DisputeStatus.OPEN);
    }

    /** Either party can raise a case while a job is hired. */
    @Transactional
    public Dispute open(Job job, User actor, String note, String imageData, String fileName) {
        boolean isParty = job.getLister().getId().equals(actor.getId())
                || (job.getHiredStudent() != null && job.getHiredStudent().getId().equals(actor.getId()));
        if (!isParty) {
            throw new ForbiddenException("Only the people involved in this job can open a dispute.");
        }
        if (job.getStatus() != JobStatus.HIRED) {
            throw new ApiException("Disputes can only be opened on a job that's in progress.");
        }
        if (disputes.findByJobId(job.getId()).isPresent()) {
            throw new ApiException("There's already an open case for this job.");
        }

        job.setStatus(JobStatus.DISPUTED);
        Dispute dispute = disputes.save(new Dispute(job, actor));

        if (note != null && !note.isBlank()) {
            addEvidence(dispute, actor, note, imageData, fileName);
        }

        String role = job.getLister().getId().equals(actor.getId()) ? "LISTER" : "STUDENT";
        notifier.record(role, actor.getId(),
                "Opened a dispute on \"%s\"".formatted(job.getTitle()), job.getId());
        notifier.notifyAdmins("Dispute opened on \"%s\"".formatted(job.getTitle()), job.getId());

        User other = job.getLister().getId().equals(actor.getId()) ? job.getHiredStudent() : job.getLister();
        notifier.notifyUser(other,
                "A case was opened on \"%s\" — funds are held while QuickWork reviews".formatted(job.getTitle()),
                job.getId());
        return dispute;
    }

    @Transactional
    public DisputeEvidence addEvidence(Dispute dispute, User author, String note, String imageData, String fileName) {
        if (dispute.getStatus() == DisputeStatus.RESOLVED) {
            throw new ApiException("This case is closed.");
        }
        DisputeEvidence evidence = new DisputeEvidence(dispute, author, note);
        evidence.setImageData(imageData);
        evidence.setFileName(fileName);
        dispute.getEvidence().add(evidence);
        return evidence;
    }

    /**
     * Admin decision. Releases, refunds, or splits the held funds and closes the job.
     *
     * @param studentAmount only used when the decision is SPLIT
     */
    @Transactional
    public Dispute resolve(Dispute dispute, User admin, DisputeDecision decision,
                           BigDecimal studentAmount, String note) {
        if (dispute.getStatus() == DisputeStatus.RESOLVED) {
            throw new ApiException("This case is already resolved.");
        }
        Job job = dispute.getJob();
        String summary;

        switch (decision) {
            case PAY_STUDENT -> {
                ledgerService.releaseToStudent(job, job.getHiredStudent(), "Dispute resolved in student's favour");
                summary = "paid student";
            }
            case REFUND_LISTER -> {
                ledgerService.refundLister(job, "Dispute resolved in lister's favour");
                summary = "refunded lister";
            }
            case SPLIT -> {
                if (studentAmount == null) {
                    throw new ApiException("A split decision needs a student amount.");
                }
                ledgerService.split(job, studentAmount, "Dispute settled by split");
                dispute.setStudentAmount(studentAmount);
                summary = "split %s to student".formatted(studentAmount);
            }
            default -> throw new ApiException("Unknown decision.");
        }

        dispute.setStatus(DisputeStatus.RESOLVED);
        dispute.setDecision(decision);
        dispute.setResolutionNote(note);
        dispute.setResolvedAt(Instant.now());

        job.setStatus(JobStatus.COMPLETED);
        job.setCompletedAt(Instant.now());

        notifier.record("ADMIN", admin.getId(),
                "Resolved dispute on \"%s\" → %s".formatted(job.getTitle(), summary), job.getId());
        notifier.notifyUser(job.getHiredStudent(),
                "Your case on \"%s\" was resolved — %s".formatted(job.getTitle(), summary), job.getId());
        notifier.notifyUser(job.getLister(),
                "The case on \"%s\" was resolved — %s".formatted(job.getTitle(), summary), job.getId());
        return dispute;
    }
}
