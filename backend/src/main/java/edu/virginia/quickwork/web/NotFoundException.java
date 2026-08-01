package edu.virginia.quickwork.web;

/** Thrown when an id doesn't resolve; surfaced as a 404. */
public class NotFoundException extends RuntimeException {
    public NotFoundException(String message) {
        super(message);
    }
}
