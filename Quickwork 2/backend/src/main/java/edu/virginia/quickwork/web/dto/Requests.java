package edu.virginia.quickwork.web.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/** Inbound request bodies. */
public class Requests {

    public record CreateJob(
            @NotBlank String title,
            @NotBlank String description,
            @NotBlank String category,
            @NotNull @DecimalMin("1.00") BigDecimal price,
            @NotBlank String locationName,
            Double latitude,
            Double longitude,
            @NotBlank String scheduleLabel,
            String durationLabel,
            Instant endsAt
    ) { }

    public record Apply(String message) { }

    public record Hire(@NotBlank String applicationId) { }

    public record Reject(String reason) { }

    public record LeaveReview(@Min(1) @Max(5) int stars, String body) { }

    public record OpenDispute(@NotBlank String note, String imageData, String fileName) { }

    public record AddEvidence(String note, String imageData, String fileName) { }

    public record ResolveDispute(
            @NotBlank String decision,
            BigDecimal studentAmount,
            String note
    ) { }

    public record SendMessage(@NotBlank String body) { }

    public record UpdateProfile(String bio, List<String> skills, String photo) { }

    public record ConfigurePayout(@NotBlank String last4) { }

    public record SubmitFeedback(@NotBlank String subject, @NotBlank String body) { }

    public record ReplyFeedback(@NotBlank String reply) { }
}
