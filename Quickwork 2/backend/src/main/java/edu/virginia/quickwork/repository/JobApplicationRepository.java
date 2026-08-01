package edu.virginia.quickwork.repository;

import edu.virginia.quickwork.domain.JobApplication;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface JobApplicationRepository extends JpaRepository<JobApplication, String> {
    List<JobApplication> findByJobIdOrderByCreatedAtAsc(String jobId);
    List<JobApplication> findByStudentIdOrderByCreatedAtDesc(String studentId);
    Optional<JobApplication> findByJobIdAndStudentId(String jobId, String studentId);
    boolean existsByJobIdAndStudentId(String jobId, String studentId);
}
