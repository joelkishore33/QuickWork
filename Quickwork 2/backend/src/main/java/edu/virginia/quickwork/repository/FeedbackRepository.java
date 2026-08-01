package edu.virginia.quickwork.repository;

import edu.virginia.quickwork.domain.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FeedbackRepository extends JpaRepository<Feedback, String> {
    List<Feedback> findAllByOrderByCreatedAtDesc();
    List<Feedback> findByAuthorIdOrderByCreatedAtDesc(String authorId);
    long countByReplyIsNull();
}
