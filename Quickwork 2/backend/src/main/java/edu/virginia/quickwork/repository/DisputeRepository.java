package edu.virginia.quickwork.repository;

import edu.virginia.quickwork.domain.Dispute;
import edu.virginia.quickwork.domain.DisputeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DisputeRepository extends JpaRepository<Dispute, String> {

    List<Dispute> findAllByOrderByCreatedAtDesc();

    List<Dispute> findByStatusOrderByCreatedAtDesc(DisputeStatus status);

    Optional<Dispute> findByJobId(String jobId);

    long countByStatus(DisputeStatus status);

    /** Every dispute a given user is party to, on either side. */
    @Query("""
           select d from Dispute d
           where d.job.lister.id = :userId or d.job.hiredStudent.id = :userId
           order by d.createdAt desc
           """)
    List<Dispute> findForParticipant(@Param("userId") String userId);
}
