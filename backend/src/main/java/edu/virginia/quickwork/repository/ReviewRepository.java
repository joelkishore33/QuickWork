package edu.virginia.quickwork.repository;

import edu.virginia.quickwork.domain.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, String> {

    List<Review> findByStudentIdOrderByCreatedAtDesc(String studentId);

    boolean existsByJobId(String jobId);

    @Query("select coalesce(avg(r.stars), 0) from Review r where r.student.id = :studentId")
    double averageStarsForStudent(@Param("studentId") String studentId);

    long countByStudentId(String studentId);
}
