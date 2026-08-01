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
@RequestMapping("/api/users")
public class UserController {

    private final UserService users;
    private final JobService jobService;
    private final LedgerService ledger;
    private final NotificationService notifier;
    private final MessagingService messaging;
    private final DisputeService disputes;
    private final CurrentUser currentUser;

    public UserController(UserService users, JobService jobService, LedgerService ledger,
                          NotificationService notifier, MessagingService messaging,
                          DisputeService disputes, CurrentUser currentUser) {
        this.users = users;
        this.jobService = jobService;
        this.ledger = ledger;
        this.notifier = notifier;
        this.messaging = messaging;
        this.disputes = disputes;
        this.currentUser = currentUser;
    }

    /** Demo account picker — replaced by real sign-in later. */
    @GetMapping
    public List<UserDto> byRole(@RequestParam(required = false) String role) {
        if (role == null) {
            return users.byRole(UserRole.STUDENT).stream().map(this::detail).toList();
        }
        return users.byRole(UserRole.valueOf(role.toUpperCase())).stream().map(this::detail).toList();
    }

    @GetMapping("/me")
    public UserDto me(HttpServletRequest request) {
        return detail(currentUser.require(request));
    }

    @GetMapping("/{id}")
    public UserDto one(@PathVariable String id) {
        return detail(users.require(id));
    }

    @GetMapping("/{id}/reviews")
    public List<MiscDtos.ReviewDto> reviews(@PathVariable String id) {
        return users.reviewsFor(id).stream().map(MiscDtos.ReviewDto::of).toList();
    }

    @PatchMapping("/me")
    public UserDto updateMe(@RequestBody Requests.UpdateProfile body, HttpServletRequest request) {
        User me = currentUser.require(request);
        return detail(users.updateProfile(me, body.bio(), body.skills(), body.photo()));
    }

    @PostMapping("/me/payout-method")
    public UserDto configurePayout(@Valid @RequestBody Requests.ConfigurePayout body, HttpServletRequest request) {
        User me = currentUser.require(request);
        return detail(users.configurePayout(me, body.last4()));
    }

    /** Everything the student dashboard needs in one call. */
    @GetMapping("/me/dashboard")
    public Map<String, Object> dashboard(HttpServletRequest request) {
        User me = currentUser.requireRole(request, UserRole.STUDENT);

        var applications = jobService.applicationsByStudent(me.getId()).stream()
                .map(ApplicationDto::of).toList();
        var hired = jobService.all().stream()
                .filter(j -> j.getHiredStudent() != null && j.getHiredStudent().getId().equals(me.getId()))
                .map(JobDto::of).toList();
        var payouts = ledger.payoutsFor(me.getId()).stream().map(LedgerEntryDto::of).toList();

        BigDecimal inEscrow = jobService.all().stream()
                .filter(j -> j.getHiredStudent() != null
                        && j.getHiredStudent().getId().equals(me.getId())
                        && (j.getStatus() == JobStatus.HIRED || j.getStatus() == JobStatus.DISPUTED))
                .map(Job::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return Map.of(
                "user", detail(me),
                "applications", applications,
                "hiredJobs", hired,
                "payouts", payouts,
                "totalPaid", ledger.totalPaidTo(me.getId()),
                "inEscrow", inEscrow,
                "completedCount", hired.stream().filter(j -> "COMPLETED".equals(j.status())).count()
        );
    }

    // --- notifications ---

    @GetMapping("/me/notifications")
    public List<MiscDtos.NotificationDto> notifications(HttpServletRequest request) {
        User me = currentUser.require(request);
        return notifier.forUser(me.getId()).stream().map(MiscDtos.NotificationDto::of).toList();
    }

    @PostMapping("/me/notifications/read")
    public void markRead(HttpServletRequest request) {
        notifier.markAllRead(currentUser.require(request).getId());
    }

    // --- disputes the caller is party to ---

    @GetMapping("/me/disputes")
    public List<DisputeDto> myDisputes(HttpServletRequest request) {
        User me = currentUser.require(request);
        return disputes.forParticipant(me.getId()).stream().map(DisputeDto::of).toList();
    }

    // --- help desk ---

    @GetMapping("/me/feedback")
    public List<MiscDtos.FeedbackDto> myFeedback(HttpServletRequest request) {
        User me = currentUser.require(request);
        return messaging.feedbackBy(me.getId()).stream().map(MiscDtos.FeedbackDto::of).toList();
    }

    @PostMapping("/me/feedback")
    public MiscDtos.FeedbackDto submitFeedback(@Valid @RequestBody Requests.SubmitFeedback body,
                                               HttpServletRequest request) {
        User me = currentUser.require(request);
        return MiscDtos.FeedbackDto.of(messaging.submit(me, body.subject(), body.body()));
    }

    private UserDto detail(User u) {
        return UserDto.full(u, users.averageStars(u.getId()), users.reviewCount(u.getId()),
                ledger.totalPaidTo(u.getId()));
    }
}
