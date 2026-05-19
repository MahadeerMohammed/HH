package com.hotelhub.admin.dto.finance;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record DashboardSummaryResponse(
    LocalDate fromDate,
    LocalDate toDate,
    BigDecimal grossRevenue,
    BigDecimal operatingExpenses,
    BigDecimal revenueCosts,
    BigDecimal netProfit,
    long activeRooms,
    long occupiedRooms,
    BigDecimal occupancyRate,
    List<MonthlyTrendPointResponse> trend
) {
}
