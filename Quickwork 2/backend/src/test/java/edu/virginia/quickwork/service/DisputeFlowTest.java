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

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@TestPropertySource(properties = {
        "quickwork.seed-demo-data=false",
        "quickwork.scheduler-interval-ms=3600000"
})
@Transactional
class DisputeFlowTest {

    @Autowired JobService jobService;
    @Autowired DisputeService disputeService;
    @Autowired LedgerService ledgerService;
    @Autowired UserRepository users;

    User lister, student, admin;

    @BeforeEach
    void setUp() {
        long n = System.nanoTime();
        lister = users.save(new User("Lister", "l" + n + "@x.com", UserRole.LISTER));
        student = users.save(new User("Student", "s" + n + "@x.com", UserRole.STUDENT));
        admin = users.save(new User("Admin", "a" + n + "@x.com", UserRole.ADMIN));
    }

    private Job hiredJob(String price) {
        Job job = new Job("Yard work", "Haul branches", "Yard Work", new BigDecimal(price), lister);
        job.setLocationName("Fry's Spring");
        job.setScheduleLabel("Sun 9:00 AM");
        job.setEndsAt(Instant.now().plus(Duration.ofHours(3)));
        Job saved = jobService.create(job);
        jobService.approve(saved, admin);
        var application = jobService.apply(saved, student, null);
        return jobService.hire(saved, application.getId(), lister);
    }

    @Test
    @DisplayName("opening a dispute freezes the job and keeps funds held")
    void openingFreezesFunds() {
        Job job = hiredJob("55.00");

        Dispute dispute = disputeService.open(job, student, "I wasn't paid", null, null);

        assertThat(job.getStatus()).isEqualTo(JobStatus.DISPUTED);
        assertThat(dispute.getStatus()).isEqualTo(DisputeStatus.OPEN);
        assertThat(dispute.getEvidence()).hasSize(1);
        assertThat(ledgerService.forJob(job.getId()))
                .anyMatch(e -> e.getType() == LedgerEntryType.HOLD && e.getStatus() == LedgerEntryStatus.HELD);
    }

    @Test
    @DisplayName("either party can open a case, outsiders cannot")
    void onlyPartiesCanOpen() {
        Job job = hiredJob("55.00");
        User outsider = users.save(new User("Nosy", "n" + System.nanoTime() + "@x.com", UserRole.STUDENT));

        assertThatThrownBy(() -> disputeService.open(job, outsider, "let me in", null, null))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    @DisplayName("resolving for the student pays out the full amount")
    void resolvePaysStudent() {
        Job job = hiredJob("55.00");
        Dispute dispute = disputeService.open(job, student, "I did the work", null, null);

        disputeService.resolve(dispute, admin, DisputeDecision.PAY_STUDENT, null, "Receipt checks out");

        assertThat(dispute.getStatus()).isEqualTo(DisputeStatus.RESOLVED);
        assertThat(job.getStatus()).isEqualTo(JobStatus.COMPLETED);
        assertThat(ledgerService.totalPaidTo(student.getId())).isEqualByComparingTo("55.00");
    }

    @Test
    @DisplayName("resolving for the lister refunds and pays the student nothing")
    void resolveRefundsLister() {
        Job job = hiredJob("55.00");
        Dispute dispute = disputeService.open(job, lister, "Work was not done", null, null);

        disputeService.resolve(dispute, admin, DisputeDecision.REFUND_LISTER, null, "No evidence of work");

        assertThat(ledgerService.totalPaidTo(student.getId())).isEqualByComparingTo("0");
        assertThat(ledgerService.forJob(job.getId()))
                .anyMatch(e -> e.getType() == LedgerEntryType.REFUND);
    }

    @Test
    @DisplayName("a split decision divides the hold between both parties")
    void resolveSplits() {
        Job job = hiredJob("60.00");
        Dispute dispute = disputeService.open(job, student, "Only one load counted", null, null);

        disputeService.resolve(dispute, admin, DisputeDecision.SPLIT, new BigDecimal("30.00"), "Half each");

        assertThat(ledgerService.totalPaidTo(student.getId())).isEqualByComparingTo("30.00");
        assertThat(ledgerService.forJob(job.getId()))
                .filteredOn(e -> e.getType() == LedgerEntryType.REFUND)
                .singleElement()
                .satisfies(e -> assertThat(e.getAmount()).isEqualByComparingTo("30.00"));
        assertThat(ledgerService.forJob(job.getId()))
                .noneMatch(e -> e.getStatus() == LedgerEntryStatus.HELD);
    }

    @Test
    @DisplayName("a split larger than the hold is rejected")
    void splitCannotExceedHold() {
        Job job = hiredJob("60.00");
        Dispute dispute = disputeService.open(job, student, "Pay me everything and more", null, null);

        assertThatThrownBy(() ->
                disputeService.resolve(dispute, admin, DisputeDecision.SPLIT, new BigDecimal("90.00"), "oops"))
                .isInstanceOf(ApiException.class);
    }

    @Test
    @DisplayName("a case cannot be resolved twice")
    void noDoubleResolution() {
        Job job = hiredJob("55.00");
        Dispute dispute = disputeService.open(job, student, "I did the work", null, null);
        disputeService.resolve(dispute, admin, DisputeDecision.PAY_STUDENT, null, null);

        assertThatThrownBy(() ->
                disputeService.resolve(dispute, admin, DisputeDecision.REFUND_LISTER, null, null))
                .isInstanceOf(ApiException.class);
        assertThat(ledgerService.totalPaidTo(student.getId())).isEqualByComparingTo("55.00");
    }
}
