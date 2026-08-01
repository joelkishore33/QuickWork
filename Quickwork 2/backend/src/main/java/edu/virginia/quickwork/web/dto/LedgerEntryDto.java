package edu.virginia.quickwork.web.dto;

import edu.virginia.quickwork.domain.LedgerEntry;

import java.math.BigDecimal;
import java.time.Instant;

public record LedgerEntryDto(
        String id,
        String jobId,
        String jobTitle,
        String type,
        String status,
        BigDecimal amount,
        UserDto payee,
        UserDto lister,
        UserDto hiredStudent,
        String note,
        Instant createdAt
) {
    public static LedgerEntryDto of(LedgerEntry e) {
        var job = e.getJob();
        return new LedgerEntryDto(
                e.getId(), job.getId(), job.getTitle(), e.getType().name(), e.getStatus().name(),
                e.getAmount(), UserDto.summary(e.getPayee()),
                UserDto.summary(job.getLister()), UserDto.summary(job.getHiredStudent()),
                e.getNote(), e.getCreatedAt());
    }
}
