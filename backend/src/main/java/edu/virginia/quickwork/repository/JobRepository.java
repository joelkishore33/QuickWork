package edu.virginia.quickwork.repository;

import edu.virginia.quickwork.domain.Job;
import edu.virginia.quickwork.domain.JobStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface JobRepository extends JpaRepository<Job, String> {

    List<Job> findByStatusOrderByCreatedAtDesc(JobStatus status);

    List<Job> findByListerIdOrderByCreatedAtDesc(String listerId);

    List<Job> findByHiredStudentIdOrderByCreatedAtDesc(String studentId);

    /** Live jobs a student can still apply to: approved and not past their window. */
    @Query("""
           select j from Job j
           where j.status = edu.virginia.quickwork.domain.JobStatus.OPEN
             and (j.endsAt is null or j.endsAt > :now)
           order by j.createdAt desc
           """)
    List<Job> findOpenJobs(@Param("now") Instant now);

    /**
     * Hired jobs whose work window has passed and that have not been nudged yet —
     * the scheduler turns these into automatic completion reminders.
     */
    @Query("""
           select j from Job j
           where j.status = edu.virginia.quickwork.domain.JobStatus.HIRED
             and j.reminderSentAt is null
             and j.endsAt is not null
             and j.endsAt <= :now
           """)
    List<Job> findJobsNeedingReminder(@Param("now") Instant now);

    /** Hired jobs whose confirmation window has lapsed — eligible for auto-release. */
    @Query("""
           select j from Job j
           where j.status = edu.virginia.quickwork.domain.JobStatus.HIRED
             and j.reminderSentAt is not null
             and j.reminderSentAt <= :cutoff
           """)
    List<Job> findJobsPastConfirmationWindow(@Param("cutoff") Instant cutoff);
}
