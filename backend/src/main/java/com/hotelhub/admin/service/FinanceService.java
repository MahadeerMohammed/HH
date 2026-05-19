package com.hotelhub.admin.service;

import com.hotelhub.admin.domain.Expense;
import com.hotelhub.admin.domain.RevenueEntry;
import com.hotelhub.admin.domain.Room;
import com.hotelhub.admin.domain.RoomStatus;
import com.hotelhub.admin.dto.finance.DashboardSummaryResponse;
import com.hotelhub.admin.dto.finance.ExpenseRequest;
import com.hotelhub.admin.dto.finance.ExpenseResponse;
import com.hotelhub.admin.dto.finance.MonthlyTrendPointResponse;
import com.hotelhub.admin.dto.finance.ReportResponse;
import com.hotelhub.admin.dto.finance.RevenueEntryRequest;
import com.hotelhub.admin.dto.finance.RevenueEntryResponse;
import com.hotelhub.admin.dto.finance.RoomPerformanceResponse;
import com.hotelhub.admin.exception.BadRequestException;
import com.hotelhub.admin.exception.ResourceNotFoundException;
import com.hotelhub.admin.repository.ExpenseRepository;
import com.hotelhub.admin.repository.RevenueEntryRepository;
import com.hotelhub.admin.repository.RoomRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FinanceService {

    private static final DateTimeFormatter MONTH_LABEL_FORMAT = DateTimeFormatter.ofPattern("MMM yyyy");

    private final RevenueEntryRepository revenueEntryRepository;
    private final ExpenseRepository expenseRepository;
    private final RoomRepository roomRepository;

    @Transactional(readOnly = true)
    public List<RevenueEntryResponse> listRevenueEntries(LocalDate fromDate, LocalDate toDate) {
        DateRange dateRange = resolveOptionalRange(fromDate, toDate);
        List<RevenueEntry> entries = dateRange == null
            ? revenueEntryRepository.findAllByOrderByStayDateDescCreatedAtDesc()
            : revenueEntryRepository.findByStayDateBetweenOrderByStayDateDescCreatedAtDesc(dateRange.from(), dateRange.to());

        return entries.stream()
            .map(this::toRevenueResponse)
            .toList();
    }

    @Transactional
    public RevenueEntryResponse createRevenueEntry(RevenueEntryRequest request) {
        Room room = roomRepository.findByIdAndActiveTrue(request.roomId())
            .orElseThrow(() -> new ResourceNotFoundException("Room not found."));

        RevenueEntry entry = new RevenueEntry();
        entry.setRoom(room);
        entry.setStayDate(request.stayDate());
        entry.setGuestName(request.guestName().trim());
        entry.setBookingChannel(request.bookingChannel().trim());
        entry.setNights(request.nights());
        entry.setGrossRevenue(request.grossRevenue());
        entry.setPlatformFee(request.platformFee());
        entry.setTaxAmount(request.taxAmount());
        entry.setVariableCost(request.variableCost());
        entry.setNotes(request.notes() == null ? null : request.notes().trim());

        return toRevenueResponse(revenueEntryRepository.save(entry));
    }

    @Transactional(readOnly = true)
    public List<ExpenseResponse> listExpenses(LocalDate fromDate, LocalDate toDate) {
        DateRange dateRange = resolveOptionalRange(fromDate, toDate);
        List<Expense> expenses = dateRange == null
            ? expenseRepository.findAllByOrderByExpenseDateDescCreatedAtDesc()
            : expenseRepository.findByExpenseDateBetweenOrderByExpenseDateDescCreatedAtDesc(dateRange.from(), dateRange.to());

        return expenses.stream()
            .map(this::toExpenseResponse)
            .toList();
    }

    @Transactional
    public ExpenseResponse createExpense(ExpenseRequest request) {
        Room room = request.roomId() == null
            ? null
            : roomRepository.findByIdAndActiveTrue(request.roomId())
                .orElseThrow(() -> new ResourceNotFoundException("Room not found."));

        Expense expense = new Expense();
        expense.setRoom(room);
        expense.setExpenseDate(request.expenseDate());
        expense.setCategory(request.category());
        expense.setVendorName(request.vendorName().trim());
        expense.setAmount(request.amount());
        expense.setNotes(request.notes() == null ? null : request.notes().trim());

        return toExpenseResponse(expenseRepository.save(expense));
    }

    @Transactional(readOnly = true)
    public DashboardSummaryResponse getDashboardSummary(LocalDate fromDate, LocalDate toDate) {
        DateRange range = resolveRange(fromDate, toDate);
        BigDecimal grossRevenue = normalize(revenueEntryRepository.sumGrossRevenueBetween(range.from(), range.to()));
        BigDecimal revenueCosts = normalize(revenueEntryRepository.sumRevenueCostsBetween(range.from(), range.to()));
        BigDecimal operatingExpenses = normalize(expenseRepository.sumAmountBetween(range.from(), range.to()));
        BigDecimal netProfit = grossRevenue.subtract(revenueCosts).subtract(operatingExpenses);

        long activeRooms = roomRepository.countActiveRooms();
        long occupiedRooms = roomRepository.countByStatus(RoomStatus.OCCUPIED);
        BigDecimal occupancyRate = activeRooms == 0
            ? BigDecimal.ZERO
            : BigDecimal.valueOf(occupiedRooms)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(activeRooms), 2, RoundingMode.HALF_UP);

        return new DashboardSummaryResponse(
            range.from(),
            range.to(),
            grossRevenue,
            operatingExpenses,
            revenueCosts,
            netProfit,
            activeRooms,
            occupiedRooms,
            occupancyRate,
            buildTrend()
        );
    }

    @Transactional(readOnly = true)
    public ReportResponse getReport(LocalDate fromDate, LocalDate toDate) {
        DateRange range = resolveRange(fromDate, toDate);
        BigDecimal grossRevenue = normalize(revenueEntryRepository.sumGrossRevenueBetween(range.from(), range.to()));
        BigDecimal revenueCosts = normalize(revenueEntryRepository.sumRevenueCostsBetween(range.from(), range.to()));
        BigDecimal operatingExpenses = normalize(expenseRepository.sumAmountBetween(range.from(), range.to()));
        BigDecimal netProfit = grossRevenue.subtract(revenueCosts).subtract(operatingExpenses);

        long activeRooms = roomRepository.countActiveRooms();
        long occupiedRooms = roomRepository.countByStatus(RoomStatus.OCCUPIED);
        BigDecimal occupancyRate = activeRooms == 0
            ? BigDecimal.ZERO
            : BigDecimal.valueOf(occupiedRooms)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(activeRooms), 2, RoundingMode.HALF_UP);

        return new ReportResponse(
            range.from(),
            range.to(),
            grossRevenue,
            operatingExpenses,
            revenueCosts,
            netProfit,
            occupancyRate,
            buildRoomPerformance(range)
        );
    }

    @Transactional(readOnly = true)
    public String exportCsv(LocalDate fromDate, LocalDate toDate) {
        ReportResponse report = getReport(fromDate, toDate);
        StringBuilder builder = new StringBuilder();
        builder.append("Metric,Value\n");
        builder.append("From,").append(report.fromDate()).append('\n');
        builder.append("To,").append(report.toDate()).append('\n');
        builder.append("Gross Revenue,").append(report.grossRevenue()).append('\n');
        builder.append("Revenue Costs,").append(report.revenueCosts()).append('\n');
        builder.append("Operating Expenses,").append(report.operatingExpenses()).append('\n');
        builder.append("Net Profit,").append(report.netProfit()).append('\n');
        builder.append("Occupancy Rate,").append(report.occupancyRate()).append("%\n\n");
        builder.append("Room Number,Room Type,Revenue,Expenses,Profit\n");

        for (RoomPerformanceResponse room : report.roomPerformance()) {
            builder
                .append(csv(room.roomNumber())).append(',')
                .append(csv(room.roomType())).append(',')
                .append(room.revenue()).append(',')
                .append(room.expenses()).append(',')
                .append(room.profit()).append('\n');
        }

        return builder.toString();
    }

    private List<MonthlyTrendPointResponse> buildTrend() {
        List<MonthlyTrendPointResponse> trend = new ArrayList<>();
        YearMonth currentMonth = YearMonth.now();
        for (int i = 5; i >= 0; i--) {
            YearMonth month = currentMonth.minusMonths(i);
            LocalDate from = month.atDay(1);
            LocalDate to = month.atEndOfMonth();

            BigDecimal revenue = normalize(revenueEntryRepository.sumGrossRevenueBetween(from, to));
            BigDecimal revenueCosts = normalize(revenueEntryRepository.sumRevenueCostsBetween(from, to));
            BigDecimal expenses = normalize(expenseRepository.sumAmountBetween(from, to));
            BigDecimal profit = revenue.subtract(revenueCosts).subtract(expenses);

            trend.add(new MonthlyTrendPointResponse(month.format(MONTH_LABEL_FORMAT), revenue, expenses.add(revenueCosts), profit));
        }
        return trend;
    }

    private List<RoomPerformanceResponse> buildRoomPerformance(DateRange range) {
        List<Room> rooms = roomRepository.findAllByActiveTrueOrderByRoomNumberAsc();
        List<RevenueEntry> revenues = revenueEntryRepository.findByStayDateBetweenOrderByStayDateDescCreatedAtDesc(range.from(), range.to());
        List<Expense> expenses = expenseRepository.findByExpenseDateBetweenOrderByExpenseDateDescCreatedAtDesc(range.from(), range.to());

        Map<UUID, BigDecimal> revenueByRoom = new HashMap<>();
        Map<UUID, BigDecimal> costByRoom = new HashMap<>();

        for (RevenueEntry revenueEntry : revenues) {
            UUID roomId = revenueEntry.getRoom().getId();
            revenueByRoom.merge(roomId, normalize(revenueEntry.getGrossRevenue()), BigDecimal::add);
            BigDecimal revenueCosts = normalize(revenueEntry.getPlatformFee())
                .add(normalize(revenueEntry.getTaxAmount()))
                .add(normalize(revenueEntry.getVariableCost()));
            costByRoom.merge(roomId, revenueCosts, BigDecimal::add);
        }

        for (Expense expense : expenses) {
            if (expense.getRoom() != null) {
                costByRoom.merge(expense.getRoom().getId(), normalize(expense.getAmount()), BigDecimal::add);
            }
        }

        return rooms.stream()
            .map(room -> {
                BigDecimal revenue = revenueByRoom.getOrDefault(room.getId(), BigDecimal.ZERO);
                BigDecimal expenseTotal = costByRoom.getOrDefault(room.getId(), BigDecimal.ZERO);
                return new RoomPerformanceResponse(
                    room.getId(),
                    room.getRoomNumber(),
                    room.getRoomType(),
                    revenue,
                    expenseTotal,
                    revenue.subtract(expenseTotal)
                );
            })
            .sorted(Comparator.comparing(RoomPerformanceResponse::profit).reversed())
            .toList();
    }

    private RevenueEntryResponse toRevenueResponse(RevenueEntry entry) {
        BigDecimal netRevenue = normalize(entry.getGrossRevenue())
            .subtract(normalize(entry.getPlatformFee()))
            .subtract(normalize(entry.getTaxAmount()))
            .subtract(normalize(entry.getVariableCost()));

        return new RevenueEntryResponse(
            entry.getId(),
            entry.getRoom().getId(),
            entry.getRoom().getRoomNumber(),
            entry.getStayDate(),
            entry.getGuestName(),
            entry.getBookingChannel(),
            entry.getNights(),
            normalize(entry.getGrossRevenue()),
            normalize(entry.getPlatformFee()),
            normalize(entry.getTaxAmount()),
            normalize(entry.getVariableCost()),
            netRevenue,
            entry.getNotes(),
            entry.getCreatedAt()
        );
    }

    private ExpenseResponse toExpenseResponse(Expense expense) {
        return new ExpenseResponse(
            expense.getId(),
            expense.getRoom() == null ? null : expense.getRoom().getId(),
            expense.getRoom() == null ? null : expense.getRoom().getRoomNumber(),
            expense.getExpenseDate(),
            expense.getCategory().name(),
            expense.getVendorName(),
            normalize(expense.getAmount()),
            expense.getNotes(),
            expense.getCreatedAt()
        );
    }

    private DateRange resolveRange(LocalDate fromDate, LocalDate toDate) {
        if (fromDate == null && toDate == null) {
            LocalDate today = LocalDate.now();
            return new DateRange(today.withDayOfMonth(1), today);
        }
        if (fromDate == null || toDate == null) {
            throw new BadRequestException("Both fromDate and toDate must be supplied together.");
        }
        if (toDate.isBefore(fromDate)) {
            throw new BadRequestException("toDate must be on or after fromDate.");
        }
        return new DateRange(fromDate, toDate);
    }

    private DateRange resolveOptionalRange(LocalDate fromDate, LocalDate toDate) {
        if (fromDate == null && toDate == null) {
            return null;
        }
        return resolveRange(fromDate, toDate);
    }

    private BigDecimal normalize(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value.setScale(2, RoundingMode.HALF_UP);
    }

    private String csv(String value) {
        if (value == null) {
            return "";
        }
        return "\"" + value.replace("\"", "\"\"") + "\"";
    }

    private record DateRange(LocalDate from, LocalDate to) {
    }
}
