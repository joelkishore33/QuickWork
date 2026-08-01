package edu.virginia.quickwork.domain;

/** How an admin settled a dispute. */
public enum DisputeDecision {
    /** Full amount released to the student. */
    PAY_STUDENT,
    /** Full amount returned to the lister. */
    REFUND_LISTER,
    /** Amount split between the two parties. */
    SPLIT
}
