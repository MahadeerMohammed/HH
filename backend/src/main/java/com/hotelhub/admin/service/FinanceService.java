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
import com.hotelhub.admin.dto.common.PagedResponse;
import com.hotelhub.admin.dto.imports.ImportResultResponse;
import com.hotelhub.admin.exception.BadRequestException;
import com.hotelhub.admin.exception.ResourceNotFoundException;
import com.hotelhub.admin.repository.ExpenseRepository;
import com.hotelhub.admin.repository.RevenueEntryRepository;
import com.hotelhub.admin.repository.RoomRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.io.IOException;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class FinanceService {

    private static final DateTimeFormatter MONTH_LABEL_FORMAT = DateTimeFormatter.ofPattern("MMM yyyy");

    private final RevenueEntryRepository revenueEntryRepository;
    private final ExpenseRepository expenseRepository;
    private final RoomRepository roomRepository;
    private final ExcelTransferService excelTransferService;

    @Transactional(readOnly = true)
    public List<RevenueEntryResponse> listRevenueEntries(LocalDate fromDate, LocalDate toDate) {
        return listRevenueEntities(fromDate, toDate).stream()
            .map(this::toRevenueResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public PagedResponse<RevenueEntryResponse> listRevenueEntriesPage(String filter, LocalDate fromDate, LocalDate toDate, int page) {
        FilterRange range = resolveFilterRange(filter, fromDate, toDate);
        Page<RevenueEntry> result = revenueEntryRepository.findPageByCheckInDateBetween(
            range.from(),
            range.to(),
            PageRequest.of(Math.max(page, 0), range.pageSize(), Sort.by(Sort.Direction.DESC, "checkInDate", "createdAt"))
        );
        return toPagedResponse(result.map(this::toRevenueResponse));
    }

    @Transactional(readOnly = true)
    public byte[] exportRevenue(LocalDate fromDate, LocalDate toDate) {
        return excelTransferService.exportRevenue(listRevenueEntities(fromDate, toDate));
    }

    @Transactional
    public ImportResultResponse importRevenue(MultipartFile file, boolean commit) throws IOException {
        return excelTransferService.importRevenue(file, commit);
    }

    @Transactional
    public List<RevenueEntryResponse> createRevenueEntry(RevenueEntryRequest request) {
        if (request.rentUntilDate().isBefore(request.chargeFromDate())) {
            throw new BadRequestException("Rent until date must be on or after rent from date.");
        }

        UUID groupId = request.bookingGroupId() != null ? request.bookingGroupId() : UUID.randomUUID();
        return saveRevenueEntries(groupId, request, null);
    }

    @Transactional
    public List<RevenueEntryResponse> updateRevenueEntry(UUID bookingGroupId, RevenueEntryRequest request) {
        List<RevenueEntry> existingEntries = revenueEntryRepository.findByBookingGroupId(bookingGroupId);
        if (existingEntries.isEmpty()) {
            throw new ResourceNotFoundException("Revenue entry not found.");
        }
        if (request.rentUntilDate().isBefore(request.chargeFromDate())) {
            throw new BadRequestException("Rent until date must be on or after rent from date.");
        }

        RevenueEntry guestSource = existingEntries.get(0);
        Set<UUID> previousRoomIds = existingEntries.stream()
            .map(entry -> entry.getRoom().getId())
            .collect(java.util.stream.Collectors.toSet());
        revenueEntryRepository.deleteAll(existingEntries);
        revenueEntryRepository.flush();

        List<RevenueEntryResponse> responses = saveRevenueEntries(bookingGroupId, request, guestSource);
        Set<UUID> updatedRoomIds = request.rooms()
            .stream()
            .map(room -> room.roomId())
            .collect(java.util.stream.Collectors.toSet());
        previousRoomIds.stream()
            .filter(roomId -> !updatedRoomIds.contains(roomId))
            .forEach(this::syncRoomStatusFromRevenueHistory);
        return responses;
    }

    @Transactional
    public void deleteRevenueEntry(UUID bookingGroupId) {
        List<RevenueEntry> existingEntries = revenueEntryRepository.findByBookingGroupId(bookingGroupId);
        if (existingEntries.isEmpty()) {
            throw new ResourceNotFoundException("Revenue entry not found.");
        }
        Set<UUID> affectedRoomIds = existingEntries.stream()
            .map(entry -> entry.getRoom().getId())
            .collect(java.util.stream.Collectors.toSet());
        revenueEntryRepository.deleteAll(existingEntries);
        revenueEntryRepository.flush();
        affectedRoomIds.forEach(this::syncRoomStatusFromRevenueHistory);
    }

    private List<RevenueEntryResponse> saveRevenueEntries(UUID bookingGroupId, RevenueEntryRequest request, RevenueEntry guestSource) {
        List<RevenueEntry> existingEntries = revenueEntryRepository.findByBookingGroupId(bookingGroupId);
        Map<UUID, RevenueEntry> existingMap = existingEntries.stream()
            .collect(java.util.stream.Collectors.toMap(e -> e.getRoom().getId(), e -> e));

        Set<UUID> processedRoomIds = new HashSet<>();
        List<RevenueEntry> entriesToSave = new ArrayList<>();

        for (var roomRentRequest : request.rooms()) {
            if (!processedRoomIds.add(roomRentRequest.roomId())) {
                throw new BadRequestException("Each room can be selected only once.");
            }

            RevenueEntry entry = existingMap.get(roomRentRequest.roomId());
            Room room;
            if (entry == null) {
                room = roomRepository.findByIdAndActiveTrue(roomRentRequest.roomId())
                    .orElseThrow(() -> new ResourceNotFoundException("Room not found."));
                entry = new RevenueEntry();
                entry.setRoom(room);
                entry.setBookingGroupId(bookingGroupId);
                entry.setChargeFromDate(request.chargeFromDate());
            } else {
                room = entry.getRoom();
            }

            String rentEditReason = roomRentRequest.rentEditReason() == null ? null : roomRentRequest.rentEditReason().trim();
            if (roomRentRequest.roomRent().compareTo(room.getRoomRent()) != 0 && (rentEditReason == null || rentEditReason.isBlank())) {
                throw new BadRequestException("Reason for rent edit is required when room rent is changed.");
            }

            entry.setCheckInDate(request.checkInDate());
            entry.setCheckInTime(request.checkInTime());
            entry.setRentUntilDate(request.rentUntilDate());
            entry.setCheckoutDate(request.checkingOut() ? request.rentUntilDate() : null);
            entry.setCheckoutTime(request.checkingOut() ? request.checkoutTime() : null);
            entry.setGuestName(guestSource == null ? request.guestName().trim() : guestSource.getGuestName());
            entry.setMobileNumber(guestSource == null ? request.mobileNumber().trim() : guestSource.getMobileNumber());
            entry.setAddress(guestSource == null ? request.address().trim() : guestSource.getAddress());
            entry.setAadharNumber(guestSource == null ? request.aadharNumber().trim() : guestSource.getAadharNumber());
            entry.setPurposeOfStay(guestSource == null ? request.purposeOfStay().trim() : guestSource.getPurposeOfStay());
            entry.setRoomRent(roomRentRequest.roomRent());
            entry.setRentEditReason(rentEditReason == null || rentEditReason.isBlank() ? null : rentEditReason);
            
            int totalRentDays = Math.toIntExact(ChronoUnit.DAYS.between(entry.getChargeFromDate(), entry.getRentUntilDate()) + 1);
            entry.setRentDays(totalRentDays);
            entry.setCheckingOut(request.checkingOut());
            
            entriesToSave.add(entry);
            room.setStatus(request.checkingOut() ? RoomStatus.AVAILABLE : RoomStatus.OCCUPIED);
        }

        return revenueEntryRepository.saveAll(entriesToSave)
            .stream()
            .map(this::toRevenueResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<ExpenseResponse> listExpenses(LocalDate fromDate, LocalDate toDate) {
        return listExpenseEntities(fromDate, toDate).stream()
            .map(this::toExpenseResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public PagedResponse<ExpenseResponse> listExpensesPage(String filter, LocalDate fromDate, LocalDate toDate, int page) {
        FilterRange range = resolveFilterRange(filter, fromDate, toDate);
        Page<Expense> result = expenseRepository.findPageByExpenseDateBetween(
            range.from(),
            range.to(),
            PageRequest.of(Math.max(page, 0), range.pageSize(), Sort.by(Sort.Direction.DESC, "expenseDate", "createdAt"))
        );
        return toPagedResponse(result.map(this::toExpenseResponse));
    }

    @Transactional(readOnly = true)
    public byte[] exportExpenses(LocalDate fromDate, LocalDate toDate) {
        return excelTransferService.exportExpenses(listExpenseEntities(fromDate, toDate));
    }

    @Transactional
    public ImportResultResponse importExpenses(MultipartFile file, boolean commit) throws IOException {
        return excelTransferService.importExpenses(file, commit);
    }

    @Transactional
    public ExpenseResponse createExpense(ExpenseRequest request) {
        Expense expense = new Expense();
        applyExpenseRequest(expense, request);
        return toExpenseResponse(expenseRepository.save(expense));
    }

    @Transactional
    public ExpenseResponse updateExpense(UUID expenseId, ExpenseRequest request) {
        Expense expense = expenseRepository.findById(expenseId)
            .orElseThrow(() -> new ResourceNotFoundException("Expense not found."));

        applyExpenseRequest(expense, request);
        return toExpenseResponse(expenseRepository.save(expense));
    }

    private void applyExpenseRequest(Expense expense, ExpenseRequest request) {
        Room room = request.roomId() == null
            ? null
            : roomRepository.findByIdAndActiveTrue(request.roomId())
                .orElseThrow(() -> new ResourceNotFoundException("Room not found."));

        expense.setRoom(room);
        expense.setExpenseDate(request.expenseDate());
        expense.setCategory(request.category());
        expense.setVendorName(request.vendorName().trim());
        expense.setAmount(request.amount());
        expense.setNotes(request.notes() == null ? null : request.notes().trim());
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
        List<RevenueEntry> revenues = revenueEntryRepository.findByCheckInDateBetweenOrderByCheckInDateDescCreatedAtDesc(range.from(), range.to());
        List<Expense> expenses = expenseRepository.findByExpenseDateBetweenOrderByExpenseDateDescCreatedAtDesc(range.from(), range.to());

        Map<UUID, BigDecimal> revenueByRoom = new HashMap<>();
        Map<UUID, BigDecimal> costByRoom = new HashMap<>();

        for (RevenueEntry revenueEntry : revenues) {
            UUID roomId = revenueEntry.getRoom().getId();
            revenueByRoom.merge(roomId, revenueAmount(revenueEntry), BigDecimal::add);
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
        return new RevenueEntryResponse(
            entry.getId(),
            entry.getImportId(),
            entry.getBookingGroupId(),
            entry.getRoom().getId(),
            entry.getRoom().getRoomNumber(),
            entry.getCheckInDate(),
            entry.getCheckInTime(),
            entry.getChargeFromDate(),
            entry.getRentUntilDate(),
            entry.getCheckoutDate(),
            entry.getCheckoutTime(),
            entry.getGuestName(),
            entry.getMobileNumber(),
            entry.getAddress(),
            entry.getAadharNumber(),
            entry.getPurposeOfStay(),
            entry.getRentDays(),
            normalize(entry.getRoomRent()),
            revenueAmount(entry),
            entry.getRentEditReason(),
            entry.isCheckingOut(),
            entry.getCreatedAt()
        );
    }

    private ExpenseResponse toExpenseResponse(Expense expense) {
        return new ExpenseResponse(
            expense.getId(),
            expense.getImportId(),
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

    private List<RevenueEntry> listRevenueEntities(LocalDate fromDate, LocalDate toDate) {
        DateRange dateRange = resolveOptionalRange(fromDate, toDate);
        return dateRange == null
            ? revenueEntryRepository.findAllByOrderByCheckInDateDescCreatedAtDesc()
            : revenueEntryRepository.findByCheckInDateBetweenOrderByCheckInDateDescCreatedAtDesc(dateRange.from(), dateRange.to());
    }

    private List<Expense> listExpenseEntities(LocalDate fromDate, LocalDate toDate) {
        DateRange dateRange = resolveOptionalRange(fromDate, toDate);
        return dateRange == null
            ? expenseRepository.findAllByOrderByExpenseDateDescCreatedAtDesc()
            : expenseRepository.findByExpenseDateBetweenOrderByExpenseDateDescCreatedAtDesc(dateRange.from(), dateRange.to());
    }

    private <T> PagedResponse<T> toPagedResponse(Page<T> page) {
        return new PagedResponse<>(
            page.getContent(),
            page.getNumber(),
            page.getSize(),
            page.getTotalElements(),
            page.getTotalPages(),
            page.isFirst(),
            page.isLast()
        );
    }

    private FilterRange resolveFilterRange(String filter, LocalDate fromDate, LocalDate toDate) {
        String normalized = filter == null || filter.isBlank() ? "daily" : filter.trim().toLowerCase();
        LocalDate today = LocalDate.now();
        return switch (normalized) {
            case "custom", "date_range", "date-range" -> {
                DateRange range = resolveRange(fromDate, toDate);
                yield new FilterRange(range.from(), range.to(), 15);
            }
            case "weekly" -> {
                LocalDate from = today.with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
                yield new FilterRange(from, from.plusDays(6), 10);
            }
            case "monthly" -> new FilterRange(today.withDayOfMonth(1), today.withDayOfMonth(today.lengthOfMonth()), 15);
            case "yearly" -> new FilterRange(today.withDayOfYear(1), today.withDayOfYear(today.lengthOfYear()), 30);
            case "daily" -> new FilterRange(today, today, 5);
            default -> throw new BadRequestException("Unsupported filter. Use daily, weekly, monthly, yearly, or custom.");
        };
    }

    private BigDecimal normalize(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal revenueAmount(RevenueEntry entry) {
        return normalize(entry.getRoomRent()).multiply(BigDecimal.valueOf(entry.getRentDays()));
    }

    private void syncRoomStatusFromRevenueHistory(UUID roomId) {
        Room room = roomRepository.findByIdAndActiveTrue(roomId)
            .orElse(null);
        if (room == null) {
            return;
        }

        List<RevenueEntry> roomRevenueHistory = revenueEntryRepository.findByRoomIdOrderByCreatedAtDesc(roomId);
        if (roomRevenueHistory.isEmpty() || roomRevenueHistory.get(0).isCheckingOut()) {
            room.setStatus(RoomStatus.AVAILABLE);
            return;
        }
        room.setStatus(RoomStatus.OCCUPIED);
    }

    private String csv(String value) {
        if (value == null) {
            return "";
        }
        return "\"" + value.replace("\"", "\"\"") + "\"";
    }

    private record DateRange(LocalDate from, LocalDate to) {
    }

    private record FilterRange(LocalDate from, LocalDate to, int pageSize) {
    }
}
