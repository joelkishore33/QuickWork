package edu.virginia.quickwork.web.dto;

import edu.virginia.quickwork.domain.*;

import java.time.Instant;

public class MiscDtos {

    public record MessageDto(String id, String jobId, UserDto sender, String body, Instant createdAt) {
        public static MessageDto of(Message m) {
            return new MessageDto(m.getId(), m.getJob().getId(), UserDto.summary(m.getSender()),
                    m.getBody(), m.getCreatedAt());
        }
    }

    public record ReviewDto(String id, String jobId, String jobTitle, UserDto author,
                            int stars, String body, Instant createdAt) {
        public static ReviewDto of(Review r) {
            return new ReviewDto(r.getId(), r.getJob().getId(), r.getJob().getTitle(),
                    UserDto.summary(r.getAuthor()), r.getStars(), r.getBody(), r.getCreatedAt());
        }
    }

    public record NotificationDto(String id, String body, String jobId, boolean read, Instant createdAt) {
        public static NotificationDto of(Notification n) {
            return new NotificationDto(n.getId(), n.getBody(), n.getJobId(), n.isRead(), n.getCreatedAt());
        }
    }

    public record AuditEventDto(String id, String actor, String action, String jobId, Instant createdAt) {
        public static AuditEventDto of(AuditEvent e) {
            return new AuditEventDto(e.getId(), e.getActor(), e.getAction(), e.getJobId(), e.getCreatedAt());
        }
    }

    public record FeedbackDto(String id, UserDto author, String authorRole, String subject, String body,
                              String reply, boolean answered, Instant createdAt, Instant repliedAt) {
        public static FeedbackDto of(Feedback f) {
            return new FeedbackDto(f.getId(), UserDto.summary(f.getAuthor()), f.getAuthor().getRole().name(),
                    f.getSubject(), f.getBody(), f.getReply(), f.isAnswered(), f.getCreatedAt(), f.getRepliedAt());
        }
    }
}
