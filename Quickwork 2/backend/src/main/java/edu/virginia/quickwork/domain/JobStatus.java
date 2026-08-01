package edu.virginia.quickwork.domain;

/**
 * Lifecycle of a listing.
 *
 * <pre>
 * PENDING_APPROVAL ──approve──> OPEN ──hire──> HIRED ──confirm──> COMPLETED
 *        │                       │               │
 *        │                       └──cancel──> CANCELLED
 *        └──reject──> REJECTED    (refund)      │
 *                                               └──report──> DISPUTED ──resolve──> COMPLETED
 * </pre>
 */
public enum JobStatus {
    PENDING_APPROVAL,
    OPEN,
    HIRED,
    COMPLETED,
    DISPUTED,
    CANCELLED,
    REJECTED;

    public boolean isTerminal() {
        return this == COMPLETED || this == CANCELLED || this == REJECTED;
    }
}
