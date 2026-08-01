package edu.virginia.quickwork.service;

import edu.virginia.quickwork.domain.*;
import edu.virginia.quickwork.repository.*;
import edu.virginia.quickwork.web.ApiException;
import edu.virginia.quickwork.web.ForbiddenException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * The money rules are the part of this system that must not be wrong, so they
 * get the most coverage: escrow is captured once, released once, and every
 * terminal state leaves the ledger balanced.
 */
@SpringBootTest
@TestPropertySource(properties = {
        "quickwork.seed-demo-data=false",
        "quickwork.scheduler-interval-ms=3600000"
})
@Transactional
class EscrowFlowTest {

    @Autowired JobService jobService;
    @Autowired LedgerService ledgerService;
    @Autowired DisputeService disputeService;
    @Autowired UserRepository users;
    @Autowired JobRepository jobs;
    @Autowired LedgerEntryRepository ledger;
    @Autowired JobApplicationRepository applications;

    User lister;
    User student;
    User admin;

    @BeforeEach
    void setUp() {
        lister = users.save(new User("Test Lister", "lister-" + System.nanoTime() + "@x.com", UserRole.LISTER));
        student = users.save(new User("Test Student", "student-" + System.nanoTime() + "@x.com", UserRole.STUDENT));
        admin = users.save(new User("Test Admin", "admin-" + System.nanoTime() + "@x.com", UserRole.ADMIN));
    }

    private Job postJob(String price) {
        Job job = new Job("Move a couch", "Up three flights", "Moving", new BigDecimal(price), lister);
        job.setLocationName("Rugby Road");
        job.setScheduleLabel("Sat 10:00 AM");
        job.setEndsAt(Instant.now().plus(Duration.ofHours(4)));
        return jobService.create(job);
    }

    private Job hireStudentOn(Job job) {
        jobService.approve(job, admin);
        var application = jobService.apply(job, student, "I can help");
        return jobService.hire(job, application.getId(), lister);
    }

    @Test
    @DisplayName("posting a job holds the price and records the platform fee")
    void postingCapturesFunds() {
        Job job = postJob("50.00");

        List<LedgerEntry> entries = ledgerService.forJob(job.getId());
        assertThat(entries).hasSize(2);

        LedgerEntry hold = entries.stream().filter(e -> e.getType() == LedgerEntryType.HOLD).findFirst().orElseThrow();
        assertThat(hold.getStatus()).isEqualTo(LedgerEntryStatus.HELD);
        assertThat(hold.getAmount()).isEqualByComparingTo("50.00");

        LedgerEntry fee = entries.stream().filter(e -> e.getType() == LedgerEntryType.FEE).findFirst().orElseThrow();
        assertThat(fee.getAmount()).isEqualByComparingTo("5.00");
        assertThat(ledgerService.totalChargedFor(new BigDecimal("50.00"))).isEqualByComparingTo("55.00");

        assertThat(job.getStatus()).isEqualTo(JobStatus.PENDING_APPROVAL);
    }

    @Test
    @DisplayName("confirming completion releases escrow to the student exactly once")
    void confirmationPaysStudentOnce() {
        Job job = hireStudentOn(postJob("50.00"));

        jobService.confirmCompletion(job, lister, false);

        assertThat(job.getStatus()).isEqualTo(JobStatus.COMPLETED);
        assertThat(ledgerService.totalPaidTo(student.getId())).isEqualByComparingTo("50.00");

        LedgerEntry hold = ledgerService.forJob(job.getId()).stream()
                .filter(e -> e.getType() == LedgerEntryType.HOLD).findFirst().orElseThrow();
        assertThat(hold.getStatus()).isEqualTo(LedgerEntryStatus.RELEASED);

        // a second confirmation must not double-pay
        assertThatThrownBy(() -> jobService.confirmCompletion(job, lister, false))
                .isInstanceOf(ApiException.class);
        assertThat(ledgerService.totalPaidTo(student.getId())).isEqualByComparingTo("50.00");
    }

    @Test
    @DisplayName("rejecting a listing refunds the lister and leaves nothing held")
    void rejectionRefunds() {
        Job job = postJob("40.00");

        jobService.reject(job, admin, "Not appropriate");

        assertThat(job.getStatus()).isEqualTo(JobStatus.REJECTED);
        assertThat(ledgerService.forJob(job.getId()))
                .noneMatch(e -> e.getStatus() == LedgerEntryStatus.HELD);
        assertThat(ledgerService.forJob(job.getId()))
                .anyMatch(e -> e.getType() == LedgerEntryType.REFUND && e.getAmount().compareTo(new BigDecimal("40.00")) == 0);
    }

    @Test
    @DisplayName("a lister can cancel before hiring and gets their money back")
    void cancellationRefunds() {
        Job job = postJob("30.00");
        jobService.approve(job, admin);

        jobService.cancel(job, lister);

        assertThat(job.getStatus()).isEqualTo(JobStatus.CANCELLED);
        assertThat(ledgerService.forJob(job.getId()))
                .noneMatch(e -> e.getStatus() == LedgerEntryStatus.HELD);
    }

    @Test
    @DisplayName("a lister cannot cancel once a student is hired")
    void cannotCancelAfterHiring() {
        Job job = hireStudentOn(postJob("30.00"));

        assertThatThrownBy(() -> jobService.cancel(job, lister))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("already hired");
    }

    @Test
    @DisplayName("only the owning lister can confirm completion")
    void strangersCannotConfirm() {
        Job job = hireStudentOn(postJob("25.00"));
        User someoneElse = users.save(new User("Other", "other-" + System.nanoTime() + "@x.com", UserRole.LISTER));

        assertThatThrownBy(() -> jobService.confirmCompletion(job, someoneElse, false))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    @DisplayName("a student marking work done starts the confirmation clock")
    void markingDoneStartsClock() {
        Job job = hireStudentOn(postJob("45.00"));

        jobService.markDoneByStudent(job, student);

        assertThat(job.getMarkedDoneAt()).isNotNull();
        assertThat(job.getReminderSentAt()).isNotNull();
        assertThat(job.getStatus()).isEqualTo(JobStatus.HIRED);
    }

    @Test
    @DisplayName("students cannot apply twice to the same job")
    void noDoubleApplications() {
        Job job = postJob("20.00");
        jobService.approve(job, admin);
        jobService.apply(job, student, null);

        assertThatThrownBy(() -> jobService.apply(job, student, null))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("already applied");
    }

    @Test
    @DisplayName("applications close once the job's time slot has passed")
    void cannotApplyAfterWindow() {
        Job job = new Job("Past job", "Already over", "Moving", new BigDecimal("20.00"), lister);
        job.setLocationName("The Corner");
        job.setScheduleLabel("Yesterday");
        job.setEndsAt(Instant.now().minus(Duration.ofHours(2)));
        Job saved = jobService.create(job);
        jobService.approve(saved, admin);

        assertThatThrownBy(() -> jobService.apply(saved, student, null))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("time slot");
    }

    @Test
    @DisplayName("hiring one applicant declines the others")
    void hiringDeclinesOthers() {
        Job job = postJob("35.00");
        jobService.approve(job, admin);
        User second = users.save(new User("Second", "second-" + System.nanoTime() + "@x.com", UserRole.STUDENT));

        var first = jobService.apply(job, student, null);
        var other = jobService.apply(job, second, null);
        jobService.hire(job, first.getId(), lister);

        assertThat(applications.findById(other.getId()).orElseThrow().getStatus())
                .isEqualTo(ApplicationStatus.DECLINED);
    }
}
