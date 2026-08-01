package edu.virginia.quickwork.service;

import edu.virginia.quickwork.config.QuickWorkProperties;
import edu.virginia.quickwork.domain.Job;
import edu.virginia.quickwork.repository.JobRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Background sweeps that keep money moving without anyone clicking:
 *
 * <ol>
 *   <li>once a job's scheduled window passes, nudge the lister to confirm;</li>
 *   <li>once the confirmation window lapses, release the payout automatically
 *       so a silent lister can't strand a student's earnings.</li>
 * </ol>
 */
@Component
public class CompletionScheduler {

    private static final Logger log = LoggerFactory.getLogger(CompletionScheduler.class);

    private final JobRepository jobs;
    private final JobService jobService;
    private final QuickWorkProperties props;

    public CompletionScheduler(JobRepository jobs, JobService jobService, QuickWorkProperties props) {
        this.jobs = jobs;
        this.jobService = jobService;
        this.props = props;
    }

    @Scheduled(fixedDelayString = "${quickwork.scheduler-interval-ms:60000}")
    @Transactional
    public void sweep() {
        sendDueReminders();
        releaseLapsedPayouts();
    }

    private void sendDueReminders() {
        List<Job> due = jobs.findJobsNeedingReminder(Instant.now());
        for (Job job : due) {
            try {
                jobService.sendReminder(job, null, true);
                log.info("Auto-reminder sent for job {} ({})", job.getId(), job.getTitle());
            } catch (RuntimeException ex) {
                log.warn("Could not send auto-reminder for job {}: {}", job.getId(), ex.getMessage());
            }
        }
    }

    private void releaseLapsedPayouts() {
        Instant cutoff = Instant.now().minus(Duration.ofHours(props.getAutoReleaseHours()));
        List<Job> lapsed = jobs.findJobsPastConfirmationWindow(cutoff);
        for (Job job : lapsed) {
            try {
                jobService.confirmCompletion(job, null, true);
                log.info("Auto-released payout for job {} ({})", job.getId(), job.getTitle());
            } catch (RuntimeException ex) {
                log.warn("Could not auto-release job {}: {}", job.getId(), ex.getMessage());
            }
        }
    }
}
