package edu.virginia.quickwork.repository;

import edu.virginia.quickwork.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, String> {
    List<Message> findByJobIdOrderByCreatedAtAsc(String jobId);
}
