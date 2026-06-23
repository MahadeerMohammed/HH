package com.hotelhub.admin.dto.finance;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public record RevenueEntryRequest(
    UUID bookingGroupId,
    @NotEmpty List<@Valid RevenueRoomRentRequest> rooms,
    @NotNull LocalDate checkInDate,
    @NotNull LocalTime checkInTime,
    @NotNull LocalDate chargeFromDate,
    @NotNull LocalDate rentUntilDate,
    @NotBlank @Size(max = 120) String guestName,
    @NotBlank @Size(max = 30) String mobileNumber,
    @NotBlank @Size(max = 1200) String address,
    @NotBlank @Pattern(regexp = "\\d{12}", message = "Aadhar number must be exactly 12 digits.") String aadharNumber,
    @NotBlank @Size(max = 255) String purposeOfStay,
    boolean checkingOut,
    LocalTime checkoutTime
) {
}
