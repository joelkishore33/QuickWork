package edu.virginia.quickwork.service;

import edu.virginia.quickwork.config.QuickWorkProperties;
import edu.virginia.quickwork.domain.*;
import edu.virginia.quickwork.repository.LedgerEntryRepository;
import edu.virginia.quickwork.web.ApiException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

/**
 * Owns every movement of money. Nothing outside this class writes to the ledger.
 *
 * <p>Invariant: a job has at most one HOLD row in HELD state. Closing it out
 * always flips that row and writes a matching PAYOUT/REFUND in the same
 * transaction, so escrow can never be released twice.
 */
@Service
public class LedgerService {

    private final LedgerEntryRepository ledger;
    private final QuickWorkProperties props;

    public LedgerService(LedgerEntryRepository ledger, QuickWorkProperties props) {
        this.ledger = ledger;
        this.props = props;
    }

    /** Commission charged to the lister on top of the job price. */
    public BigDecimal feeFor(BigDecimal price) {
        return price.multiply(props.getPlatformFeeRate()).setScale(2, RoundingMode.HALF_UP);
    }

    /** What the lister is actually charged at checkout. */
    public BigDecimal totalChargedFor(BigDecimal price) {
        return price.add(feeFor(price)).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Capture the lister's funds when a job is posted: one HOLD for the job price
     * plus one FEE row so platform revenue is auditable.
     */
    @Transactional
    public void captureForNewJob(Job job) {
        LedgerEntry hold = new LedgerEntry(job, LedgerEntryType.HOLD, LedgerEntryStatus.HELD, job.getPrice());
        hold.setNote("Funds held in escrow");
        ledger.save(hold);

        BigDecimal fee = feeFor(job.getPrice());
        if (fee.signum() > 0) {
            LedgerEntry feeRow = new LedgerEntry(job, LedgerEntryType.FEE, LedgerEntryStatus.COLLECTED, fee);
            feeRow.setNote("QuickWork platform fee");
            ledger.save(feeRow);
        }
    }

    /** Release the full hold to the student. */
    @Transactional
    public LedgerEntry releaseToStudent(Job job, User student, String note) {
        LedgerEntry hold = requireOpenHold(job);
        hold.setStatus(LedgerEntryStatus.RELEASED);
        ledger.save(hold);

        LedgerEntry payout = new LedgerEntry(job, LedgerEntryType.PAYOUT, LedgerEntryStatus.PAID, hold.getAmount());
        payout.setPayee(student);
        payout.setNote(note);
        return ledger.save(payout);
    }

    /** Return the full hold to the lister. */
    @Transactional
    public LedgerEntry refundLister(Job job, String note) {
        LedgerEntry hold = requireOpenHold(job);
        hold.setStatus(LedgerEntryStatus.REFUNDED);
        ledger.save(hold);

        LedgerEntry refund = new LedgerEntry(job, LedgerEntryType.REFUND, LedgerEntryStatus.REFUNDED, hold.getAmount());
        refund.setPayee(job.getLister());
        refund.setNote(note);
        return ledger.save(refund);
    }

    /**
     * Split the hold between the student and the lister — used when an admin
     * decides a dispute partially in each party's favour.
     */
    @Transactional
    public void split(Job job, BigDecimal studentAmount, String note) {
        LedgerEntry hold = requireOpenHold(job);
        BigDecimal total = hold.getAmount();

        if (studentAmount.signum() < 0 || studentAmount.compareTo(total) > 0) {
            throw new ApiException("Split amount must be between 0 and " + total);
        }
        BigDecimal listerAmount = total.subtract(studentAmount);

        hold.setStatus(LedgerEntryStatus.RELEASED);
        ledger.save(hold);

        if (studentAmount.signum() > 0) {
            LedgerEntry payout = new LedgerEntry(job, LedgerEntryType.PAYOUT, LedgerEntryStatus.PAID, studentAmount);
            payout.setPayee(job.getHiredStudent());
            payout.setNote(note + " (student share)");
            ledger.save(payout);
        }
        if (listerAmount.signum() > 0) {
            LedgerEntry refund = new LedgerEntry(job, LedgerEntryType.REFUND, LedgerEntryStatus.REFUNDED, listerAmount);
            refund.setPayee(job.getLister());
            refund.setNote(note + " (lister share)");
            ledger.save(refund);
        }
    }

    public List<LedgerEntry> forJob(String jobId) {
        return ledger.findByJobIdOrderByCreatedAtAsc(jobId);
    }

    public List<LedgerEntry> all() {
        return ledger.findAllByOrderByCreatedAtDesc();
    }

    public BigDecimal totalHeld() {
        return ledger.sumByStatus(LedgerEntryStatus.HELD);
    }

    public BigDecimal totalPaidTo(String userId) {
        return ledger.sumPayoutsForUser(userId);
    }

    public List<LedgerEntry> payoutsFor(String userId) {
        return ledger.findByPayeeIdAndTypeOrderByCreatedAtDesc(userId, LedgerEntryType.PAYOUT);
    }

    private LedgerEntry requireOpenHold(Job job) {
        return ledger.findFirstByJobIdAndTypeAndStatus(job.getId(), LedgerEntryType.HOLD, LedgerEntryStatus.HELD)
                .orElseThrow(() -> new ApiException(
                        "No funds are being held for \"" + job.getTitle() + "\" — it may already be settled."));
    }
}
