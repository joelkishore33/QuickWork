package edu.virginia.quickwork.repository;

import edu.virginia.quickwork.domain.LedgerEntry;
import edu.virginia.quickwork.domain.LedgerEntryStatus;
import edu.virginia.quickwork.domain.LedgerEntryType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface LedgerEntryRepository extends JpaRepository<LedgerEntry, String> {

    List<LedgerEntry> findByJobIdOrderByCreatedAtAsc(String jobId);

    List<LedgerEntry> findByStatusOrderByCreatedAtDesc(LedgerEntryStatus status);

    List<LedgerEntry> findByPayeeIdAndTypeOrderByCreatedAtDesc(String payeeId, LedgerEntryType type);

    List<LedgerEntry> findAllByOrderByCreatedAtDesc();

    Optional<LedgerEntry> findFirstByJobIdAndTypeAndStatus(
            String jobId, LedgerEntryType type, LedgerEntryStatus status);

    @Query("select coalesce(sum(l.amount), 0) from LedgerEntry l where l.status = :status")
    BigDecimal sumByStatus(@Param("status") LedgerEntryStatus status);

    @Query("""
           select coalesce(sum(l.amount), 0) from LedgerEntry l
           where l.payee.id = :userId and l.type = edu.virginia.quickwork.domain.LedgerEntryType.PAYOUT
           """)
    BigDecimal sumPayoutsForUser(@Param("userId") String userId);
}
