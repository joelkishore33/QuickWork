package edu.virginia.quickwork.web;

import edu.virginia.quickwork.domain.*;
import edu.virginia.quickwork.service.*;
import edu.virginia.quickwork.web.dto.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final JobService jobService;
    private final DisputeService disputes;
    private final LedgerService ledger;
    private final NotificationService notifier;
    private final MessagingService messaging;
    private final UserService users;
    private final CurrentUser currentUser;

    public AdminController(JobService jobService, DisputeService disputes, LedgerService ledger,
                           NotificationService notifier, MessagingService messaging,
                           UserService users, CurrentUser currentUser) {
        this.jobService = jobService;
        this.disputes = disputes;
        this.ledger = ledger;
        this.notifier = notifier;
        this.messaging = messaging;
        this.users = users;
        this.currentUser = currentUser;
    }

    @GetMapping("/overview")
    public Map<String, Object> overview(HttpServletRequest request) {
        currentUser.requireAdmin(request);
        return Map.of(
                "heldTotal", ledger.totalHeld(),
                "pendingApproval", jobService.pendingApproval().size(),
                "openDisputes", disputes.openCount(),
                "unansweredFeedback", messaging.unansweredFeedbackCount(),
                "liveJobs", jobService.openJobs().size(),
                "studentCount", users.byRole(UserRole.STUDENT).size()
        );
    }

    // --- approval queue ---

    @GetMapping("/queue")
    public List<JobDto> queue(HttpServletRequest request) {
        currentUser.requireAdmin(request);
        return jobService.pendingApproval().stream().map(JobDto::of).toList();
    }

    @PostMapping("/jobs/{id}/approve")
    public JobDto approve(@PathVariable String id, HttpServletRequest request) {
        User admin = currentUser.requireAdmin(request);
        return JobDto.of(jobService.approve(jobService.require(id), admin));
    }

    @PostMapping("/jobs/{id}/reject")
    public JobDto reject(@PathVariable String id, @RequestBody(required = false) Requests.Reject body,
                         HttpServletRequest request) {
        User admin = currentUser.requireAdmin(request);
        return JobDto.of(jobService.reject(jobService.require(id), admin,
                body == null ? null : body.reason()));
    }

    // --- completions ---

    @GetMapping("/completions")
    public List<JobDto> completions(HttpServletRequest request) {
        currentUser.requireAdmin(request);
        return jobService.awaitingCompletion().stream().map(JobDto::of).toList();
    }

    @PostMapping("/jobs/{id}/remind")
    public JobDto remind(@PathVariable String id, HttpServletRequest request) {
        User admin = currentUser.requireAdmin(request);
        return JobDto.of(jobService.sendReminder(jobService.require(id), admin, false));
    }

    /** Manual override of the auto-release, for when a lister has gone silent. */
    @PostMapping("/jobs/{id}/force-payout")
    public JobDto forcePayout(@PathVariable String id, HttpServletRequest request) {
        currentUser.requireAdmin(request);
        return JobDto.of(jobService.confirmCompletion(jobService.require(id), null, true));
    }

    // --- disputes ---

    @GetMapping("/disputes")
    public List<DisputeDto> disputes(HttpServletRequest request) {
        currentUser.requireAdmin(request);
        return disputes.all().stream().map(DisputeDto::of).toList();
    }

    @PostMapping("/disputes/{id}/evidence")
    public DisputeDto addEvidence(@PathVariable String id, @RequestBody Requests.AddEvidence body,
                                  HttpServletRequest request) {
        User admin = currentUser.requireAdmin(request);
        Dispute dispute = disputes.require(id);
        disputes.addEvidence(dispute, admin, body.note(), body.imageData(), body.fileName());
        return DisputeDto.of(dispute);
    }

    @PostMapping("/disputes/{id}/resolve")
    public DisputeDto resolve(@PathVariable String id, @Valid @RequestBody Requests.ResolveDispute body,
                              HttpServletRequest request) {
        User admin = currentUser.requireAdmin(request);
        DisputeDecision decision = DisputeDecision.valueOf(body.decision().toUpperCase());
        BigDecimal studentAmount = body.studentAmount();
        return DisputeDto.of(disputes.resolve(disputes.require(id), admin, decision, studentAmount, body.note()));
    }

    // --- ledger ---

    @GetMapping("/ledger")
    public List<LedgerEntryDto> ledger(HttpServletRequest request) {
        currentUser.requireAdmin(request);
        return ledger.all().stream().map(LedgerEntryDto::of).toList();
    }

    @GetMapping("/ledger/job/{jobId}")
    public List<LedgerEntryDto> ledgerForJob(@PathVariable String jobId, HttpServletRequest request) {
        currentUser.requireAdmin(request);
        return ledger.forJob(jobId).stream().map(LedgerEntryDto::of).toList();
    }

    // --- feedback + audit ---

    @GetMapping("/feedback")
    public List<MiscDtos.FeedbackDto> feedback(HttpServletRequest request) {
        currentUser.requireAdmin(request);
        return messaging.allFeedback().stream().map(MiscDtos.FeedbackDto::of).toList();
    }

    @PostMapping("/feedback/{id}/reply")
    public MiscDtos.FeedbackDto reply(@PathVariable String id, @Valid @RequestBody Requests.ReplyFeedback body,
                                      HttpServletRequest request) {
        User admin = currentUser.requireAdmin(request);
        return MiscDtos.FeedbackDto.of(messaging.reply(id, admin, body.reply()));
    }

    @GetMapping("/audit")
    public List<MiscDtos.AuditEventDto> audit(HttpServletRequest request) {
        currentUser.requireAdmin(request);
        return notifier.recentAudit().stream().map(MiscDtos.AuditEventDto::of).toList();
    }
}
