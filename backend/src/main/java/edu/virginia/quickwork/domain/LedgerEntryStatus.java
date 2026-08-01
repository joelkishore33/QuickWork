package edu.virginia.quickwork.domain;

/** Where the money in a ledger row currently sits. */
public enum LedgerEntryStatus {
    /** Captured from the lister, not yet anyone's. */
    HELD,
    /** A hold that has been paid out to the student. */
    RELEASED,
    /** Money that landed in the student's balance. */
    PAID,
    /** Money returned to the lister. */
    REFUNDED,
    /** Platform commission collected. */
    COLLECTED
}
