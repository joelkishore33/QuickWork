package edu.virginia.quickwork.service;

import edu.virginia.quickwork.domain.*;
import edu.virginia.quickwork.repository.FeedbackRepository;
import edu.virginia.quickwork.repository.MessageRepository;
import edu.virginia.quickwork.web.ForbiddenException;
import edu.virginia.quickwork.web.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class MessagingService {

    private final MessageRepository messages;
    private final FeedbackRepository feedback;
    private final NotificationService notifier;

    public MessagingService(MessageRepository messages,
                            FeedbackRepository feedback,
                            NotificationService notifier) {
        this.messages = messages;
        this.feedback = feedback;
        this.notifier = notifier;
    }

    public List<Message> thread(Job job, User viewer) {
        requireParticipant(job, viewer);
        return messages.findByJobIdOrderByCreatedAtAsc(job.getId());
    }

    @Transactional
    public Message send(Job job, User sender, String body) {
        requireParticipant(job, sender);
        Message message = messages.save(new Message(job, sender, body));
        User recipient = job.getLister().getId().equals(sender.getId())
                ? job.getHiredStudent() : job.getLister();
        notifier.notifyUser(recipient,
                "%s: %s".formatted(sender.getName(), preview(body)), job.getId());
        return message;
    }

    private String preview(String body) {
        return body.length() <= 60 ? body : body.substring(0, 57) + "…";
    }

    private void requireParticipant(Job job, User user) {
        boolean ok = job.getLister().getId().equals(user.getId())
                || (job.getHiredStudent() != null && job.getHiredStudent().getId().equals(user.getId()))
                || user.getRole() == UserRole.ADMIN;
        if (!ok) {
            throw new ForbiddenException("You aren't part of this conversation.");
        }
    }

    // --- help desk ---

    @Transactional
    public Feedback submit(User author, String subject, String body) {
        Feedback saved = feedback.save(new Feedback(author, subject, body));
        notifier.notifyAdmins("New feedback: \"%s\"".formatted(subject), null);
        return saved;
    }

    public List<Feedback> allFeedback() {
        return feedback.findAllByOrderByCreatedAtDesc();
    }

    public List<Feedback> feedbackBy(String authorId) {
        return feedback.findByAuthorIdOrderByCreatedAtDesc(authorId);
    }

    public long unansweredFeedbackCount() {
        return feedback.countByReplyIsNull();
    }

    @Transactional
    public Feedback reply(String feedbackId, User admin, String replyBody) {
        Feedback item = feedback.findById(feedbackId)
                .orElseThrow(() -> new NotFoundException("No feedback with id " + feedbackId));
        item.setReply(replyBody);
        item.setRepliedBy(admin);
        item.setRepliedAt(Instant.now());
        notifier.notifyUser(item.getAuthor(),
                "QuickWork replied to \"%s\"".formatted(item.getSubject()), null);
        notifier.record("ADMIN", admin.getId(),
                "Replied to feedback \"%s\"".formatted(item.getSubject()), null);
        return item;
    }
}
