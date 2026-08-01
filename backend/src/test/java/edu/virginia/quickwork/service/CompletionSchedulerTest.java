package edu.virginia.quickwork.service;

import edu.virginia.quickwork.domain.*;
import edu.virginia.quickwork.repository.JobRepository;
import edu.virginia.quickwork.repository.UserRepository;
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

/** The scheduler is what protects a student from a lister who never clicks confirm. */
@SpringBootTest
@TestPropertySource(properties = {
        "quickwork.seed-demo-data=false",
        "quickwork.scheduler-interval-ms=3600000",
        "quickwork.auto-release-hours=48"
})
@Transactional
class CompletionSchedulerTest {

    @Autowired CompletionScheduler scheduler;
    @Autowired JobService jobService;
    @Autowired LedgerService ledgerService;
    @Autowired UserRepository users;
    @Autowired JobRepository jobs;

    User lister, student, admin;

    @BeforeEach
    void setUp() {
        long n = System.nanoTime();
        lister = users.save(new User("Lister", "l" + n + "@x.com", UserRole.LISTER));
        student = users.save(new User("Student", "s" + n + "@x.com", UserRole.STUDENT));
        admin = users.save(new User("Admin", "a" + n + "@x.com", UserRole.ADMIN));
    }

    private Job hiredJobEnding(Instant endsAt) {
        Job job = new Job("Tutoring", "Regression review", "Tutoring", new BigDecimal("35.00"), lister);
        job.setLocationName("Alderman");
        job.setScheduleLabel("Wed 4:00 PM");
        job.setEndsAt(endsAt);
        Job saved = jobService.create(job);
        jobService.approve(saved, admin);
        var application = jobService.apply(saved, student, null);
        return jobService.hire(saved, application.getId(), lister);
    }

    @Test
    @DisplayName("a job whose window has passed gets an automatic reminder")
    void autoRemindsAfterJobEnds() {
        Job job = hiredJobEnding(Instant.now().minus(Duration.ofHours(2)));
        assertThat(job.getReminderSentAt()).isNull();

        scheduler.sweep();

        assertThat(job.getReminderSentAt()).isNotNull();
        assertThat(job.isReminderAutomatic()).isTrue();
        assertThat(job.getStatus()).isEqualTo(JobStatus.HIRED);
    }

    @Test
    @DisplayName("a job still in its window is left alone")
    void futureJobsAreNotTouched() {
        Job job = hiredJobEnding(Instant.now().plus(Duration.ofHours(6)));

        scheduler.sweep();

        assertThat(job.getReminderSentAt()).isNull();
    }

    @Test
    @DisplayName("payout auto-releases once the confirmation window lapses")
    void autoReleasesAfterWindow() {
        Job job = hiredJobEnding(Instant.now().minus(Duration.ofDays(4)));
        // pretend the reminder went out three days ago and the lister never responded
        job.setReminderSentAt(Instant.now().minus(Duration.ofHours(72)));
        jobs.save(job);

        scheduler.sweep();

        assertThat(job.getStatus()).isEqualTo(JobStatus.COMPLETED);
        assertThat(ledgerService.totalPaidTo(student.getId())).isEqualByComparingTo("35.00");
    }

    @Test
    @DisplayName("payout is not released before the window lapses")
    void doesNotReleaseEarly() {
        Job job = hiredJobEnding(Instant.now().minus(Duration.ofHours(3)));
        job.setReminderSentAt(Instant.now().minus(Duration.ofHours(2)));
        jobs.save(job);

        scheduler.sweep();

        assertThat(job.getStatus()).isEqualTo(JobStatus.HIRED);
        assertThat(ledgerService.totalPaidTo(student.getId())).isEqualByComparingTo("0");
    }
}
