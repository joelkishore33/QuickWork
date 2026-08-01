package edu.virginia.quickwork.web.dto;

import edu.virginia.quickwork.domain.Job;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record JobDto(
        String id,
        String title,
        String description,
        String category,
        BigDecimal price,
        String locationName,
        Double latitude,
        Double longitude,
        String scheduleLabel,
        String durationLabel,
        Instant endsAt,
        boolean ended,
        String status,
        UserDto lister,
        UserDto hiredStudent,
        Instant markedDoneAt,
        Instant reminderSentAt,
        boolean reminderAutomatic,
        Instant completedAt,
        Instant createdAt,
        Integer applicantCount,
        List<ApplicationDto> applications
) {
    public static JobDto of(Job job) {
        return of(job, null, null);
    }

    public static JobDto of(Job job, Integer applicantCount, List<ApplicationDto> applications) {
        return new JobDto(
                job.getId(), job.getTitle(), job.getDescription(), job.getCategory(), job.getPrice(),
                job.getLocationName(), job.getLatitude(), job.getLongitude(),
                job.getScheduleLabel(), job.getDurationLabel(), job.getEndsAt(), job.hasEnded(),
                job.getStatus().name(),
                UserDto.summary(job.getLister()), UserDto.summary(job.getHiredStudent()),
                job.getMarkedDoneAt(), job.getReminderSentAt(), job.isReminderAutomatic(),
                job.getCompletedAt(), job.getCreatedAt(),
                applicantCount, applications);
    }
}
