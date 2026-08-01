package edu.virginia.quickwork.web;

/** Thrown when the caller isn't allowed to act on a resource; surfaced as a 403. */
public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }
}
