package com.hotelhub.admin.dto.room;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record RoomResponse(
    UUID id,
    String roomNumber,
    String roomType,
    Integer floorNumber,
    Integer maxOccupancy,
    String status,
    BigDecimal roomRent,
    String notes,
    boolean active,
    Instant updatedAt
) {
}
