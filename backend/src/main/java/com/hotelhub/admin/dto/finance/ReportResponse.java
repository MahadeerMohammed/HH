package com.hotelhub.admin.dto.finance;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record ReportResponse(
    LocalDate fromDate,
    LocalDate toDate,
    BigDecimal grossRevenue,
    BigDecimal operatingExpenses,
    BigDecimal revenueCosts,
    BigDecimal netProfit,
    BigDecimal occupancyRate,
    List<RoomPerformanceResponse> roomPerformance
) {
}
