package edu.virginia.quickwork.web;

import edu.virginia.quickwork.domain.*;
import edu.virginia.quickwork.service.*;
import edu.virginia.quickwork.web.dto.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/jobs")
public class JobController {

    private final JobService jobService;
    private final DisputeService disputeService;
    private final MessagingService messaging;
    private final CurrentUser currentUser;

    public JobController(JobService jobService, DisputeService disputeService,
                         MessagingService messaging, CurrentUser currentUser) {
        this.jobService = jobService;
        this.disputeService = disputeService;
        this.messaging = messaging;
        this.currentUser = currentUser;
    }

    /** Jobs a student can browse and apply to. */
    @GetMapping
    public List<JobDto> open() {
        return jobService.openJobs().stream().map(JobDto::of).toList();
    }

    @GetMapping("/{id}")
    public JobDto one(@PathVariable String id) {
        Job job = jobService.require(id);
        List<ApplicationDto> apps = jobService.applicationsFor(id).stream().map(ApplicationDto::of).toList();
        return JobDto.of(job, apps.size(), apps);
    }

    /** Every listing belonging to the calling lister. */
    @GetMapping("/mine")
    public List<JobDto> mine(HttpServletRequest request) {
        User me = currentUser.requireRole(request, UserRole.LISTER);
        return jobService.forLister(me.getId()).stream()
                .map(job -> {
                    var apps = jobService.applicationsFor(job.getId()).stream().map(ApplicationDto::of).toList();
                    return JobDto.of(job, apps.size(), apps);
                })
                .toList();
    }

    @PostMapping
    public JobDto create(@Valid @RequestBody Requests.CreateJob body, HttpServletRequest request) {
        User lister = currentUser.requireRole(request, UserRole.LISTER);

        Job job = new Job(body.title(), body.description(), body.category(), body.price(), lister);
        job.setLocationName(body.locationName());
        job.setLatitude(body.latitude());
        job.setLongitude(body.longitude());
        job.setScheduleLabel(body.scheduleLabel());
        job.setDurationLabel(body.durationLabel());
        job.setEndsAt(body.endsAt());

        return JobDto.of(jobService.create(job));
    }

    @PostMapping("/{id}/cancel")
    public JobDto cancel(@PathVariable String id, HttpServletRequest request) {
        User me = currentUser.require(request);
        return JobDto.of(jobService.cancel(jobService.require(id), me));
    }

    // --- applications ---

    @PostMapping("/{id}/apply")
    public ApplicationDto apply(@PathVariable String id,
                                @RequestBody(required = false) Requests.Apply body,
                                HttpServletRequest request) {
        User student = currentUser.requireRole(request, UserRole.STUDENT);
        String message = body == null ? null : body.message();
        return ApplicationDto.of(jobService.apply(jobService.require(id), student, message));
    }

    @GetMapping("/{id}/applications")
    public List<ApplicationDto> applications(@PathVariable String id) {
        return jobService.applicationsFor(id).stream().map(ApplicationDto::of).toList();
    }

    @PostMapping("/{id}/hire")
    public JobDto hire(@PathVariable String id, @Valid @RequestBody Requests.Hire body,
                       HttpServletRequest request) {
        User me = currentUser.require(request);
        return JobDto.of(jobService.hire(jobService.require(id), body.applicationId(), me));
    }

    @PostMapping("/applications/{applicationId}/decline")
    public void decline(@PathVariable String applicationId, HttpServletRequest request) {
        jobService.declineApplication(applicationId, currentUser.require(request));
    }

    // --- completion ---

    /** Student reports the work as finished; starts the confirmation clock. */
    @PostMapping("/{id}/mark-done")
    public JobDto markDone(@PathVariable String id, HttpServletRequest request) {
        User student = currentUser.requireRole(request, UserRole.STUDENT);
        return JobDto.of(jobService.markDoneByStudent(jobService.require(id), student));
    }

    /** Lister confirms; escrow is released. */
    @PostMapping("/{id}/confirm")
    public JobDto confirm(@PathVariable String id, HttpServletRequest request) {
        User me = currentUser.require(request);
        return JobDto.of(jobService.confirmCompletion(jobService.require(id), me, false));
    }

    @PostMapping("/{id}/review")
    public MiscDtos.ReviewDto review(@PathVariable String id, @Valid @RequestBody Requests.LeaveReview body,
                                     HttpServletRequest request) {
        User me = currentUser.require(request);
        return MiscDtos.ReviewDto.of(
                jobService.leaveReview(jobService.require(id), me, body.stars(), body.body()));
    }

    // --- disputes ---

    @PostMapping("/{id}/dispute")
    public DisputeDto openDispute(@PathVariable String id, @Valid @RequestBody Requests.OpenDispute body,
                                  HttpServletRequest request) {
        User me = currentUser.require(request);
        return DisputeDto.of(disputeService.open(
                jobService.require(id), me, body.note(), body.imageData(), body.fileName()));
    }

    // --- messages ---

    @GetMapping("/{id}/messages")
    public List<MiscDtos.MessageDto> messages(@PathVariable String id, HttpServletRequest request) {
        User me = currentUser.require(request);
        return messaging.thread(jobService.require(id), me).stream().map(MiscDtos.MessageDto::of).toList();
    }

    @PostMapping("/{id}/messages")
    public MiscDtos.MessageDto sendMessage(@PathVariable String id, @Valid @RequestBody Requests.SendMessage body,
                                           HttpServletRequest request) {
        User me = currentUser.require(request);
        return MiscDtos.MessageDto.of(messaging.send(jobService.require(id), me, body.body()));
    }
}
