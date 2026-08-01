package edu.virginia.quickwork.web.dto;

import edu.virginia.quickwork.domain.Dispute;
import edu.virginia.quickwork.domain.DisputeEvidence;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record DisputeDto(
        String id,
        JobDto job,
        UserDto openedBy,
        String status,
        String decision,
        BigDecimal studentAmount,
        String resolutionNote,
        List<EvidenceDto> evidence,
        Instant createdAt,
        Instant resolvedAt
) {
    public static DisputeDto of(Dispute d) {
        return new DisputeDto(
                d.getId(), JobDto.of(d.getJob()), UserDto.summary(d.getOpenedBy()),
                d.getStatus().name(),
                d.getDecision() == null ? null : d.getDecision().name(),
                d.getStudentAmount(), d.getResolutionNote(),
                d.getEvidence().stream().map(EvidenceDto::of).toList(),
                d.getCreatedAt(), d.getResolvedAt());
    }

    public record EvidenceDto(
            String id,
            UserDto author,
            String authorRole,
            String note,
            String imageData,
            String fileName,
            Instant createdAt
    ) {
        public static EvidenceDto of(DisputeEvidence e) {
            return new EvidenceDto(e.getId(), UserDto.summary(e.getAuthor()),
                    e.getAuthor().getRole().name(), e.getNote(), e.getImageData(),
                    e.getFileName(), e.getCreatedAt());
        }
    }
}
