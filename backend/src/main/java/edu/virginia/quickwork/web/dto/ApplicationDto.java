package edu.virginia.quickwork.web.dto;

import edu.virginia.quickwork.domain.JobApplication;

import java.time.Instant;

public record ApplicationDto(
        String id,
        String jobId,
        String jobTitle,
        UserDto student,
        String status,
        String message,
        Instant createdAt
) {
    public static ApplicationDto of(JobApplication a) {
        return new ApplicationDto(
                a.getId(), a.getJob().getId(), a.getJob().getTitle(),
                UserDto.summary(a.getStudent()), a.getStatus().name(), a.getMessage(), a.getCreatedAt());
    }
}
