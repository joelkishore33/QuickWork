package edu.virginia.quickwork.web;

/** Business-rule violation surfaced to the client as a 400 with a readable message. */
public class ApiException extends RuntimeException {
    public ApiException(String message) {
        super(message);
    }
}
