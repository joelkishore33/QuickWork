package edu.virginia.quickwork.domain;

/** What a ledger row represents. */
public enum LedgerEntryType {
    /** Lister's money captured and held in escrow when the job is posted. */
    HOLD,
    /** The platform commission taken on top of the job price. */
    FEE,
    /** Escrow released to the student. */
    PAYOUT,
    /** Escrow returned to the lister. */
    REFUND
}
