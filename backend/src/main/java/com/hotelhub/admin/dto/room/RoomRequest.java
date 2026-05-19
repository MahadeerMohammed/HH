package com.hotelhub.admin.dto.room;

import com.hotelhub.admin.domain.RoomStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record RoomRequest(
    @NotBlank @Size(max = 50) String roomNumber,
    @NotBlank @Size(max = 80) String roomType,
    @NotNull @Min(0) @Max(200) Integer floorNumber,
    @NotNull @Min(1) @Max(20) Integer maxOccupancy,
    @NotNull RoomStatus status,
    @NotNull @DecimalMin("0.0") BigDecimal baseRate,
    @Size(max = 1200) String notes
) {
}
