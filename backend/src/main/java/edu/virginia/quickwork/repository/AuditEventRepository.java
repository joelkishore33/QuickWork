package edu.virginia.quickwork.repository;

import edu.virginia.quickwork.domain.AuditEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditEventRepository extends JpaRepository<AuditEvent, String> {
    List<AuditEvent> findTop200ByOrderByCreatedAtDesc();
    List<AuditEvent> findByJobIdOrderByCreatedAtDesc(String jobId);
}
