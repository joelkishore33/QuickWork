package edu.virginia.quickwork.service;

import edu.virginia.quickwork.domain.*;
import edu.virginia.quickwork.repository.AuditEventRepository;
import edu.virginia.quickwork.repository.NotificationRepository;
import edu.virginia.quickwork.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Writes notifications and the audit trail. */
@Service
public class NotificationService {

    private final NotificationRepository notifications;
    private final AuditEventRepository audit;
    private final UserRepository users;

    public NotificationService(NotificationRepository notifications,
                               AuditEventRepository audit,
                               UserRepository users) {
        this.notifications = notifications;
        this.audit = audit;
        this.users = users;
    }

    @Transactional
    public void notifyUser(User recipient, String body, String jobId) {
        if (recipient == null) return;
        notifications.save(new Notification(recipient, body, jobId));
    }

    /** Fan a message out to every admin. */
    @Transactional
    public void notifyAdmins(String body, String jobId) {
        for (User admin : users.findByRole(UserRole.ADMIN)) {
            notifications.save(new Notification(admin, body, jobId));
        }
    }

    @Transactional
    public void record(String actor, String actorId, String action, String jobId) {
        audit.save(new AuditEvent(actor, actorId, action, jobId));
    }

    @Transactional
    public void recordSystem(String action, String jobId) {
        record("SYSTEM", null, action, jobId);
    }

    public List<Notification> forUser(String userId) {
        return notifications.findByRecipientIdOrderByCreatedAtDesc(userId);
    }

    public long unreadCount(String userId) {
        return notifications.countByRecipientIdAndReadFalse(userId);
    }

    @Transactional
    public void markAllRead(String userId) {
        notifications.findByRecipientIdOrderByCreatedAtDesc(userId)
                .forEach(n -> n.setRead(true));
    }

    public List<AuditEvent> recentAudit() {
        return audit.findTop200ByOrderByCreatedAtDesc();
    }
}
