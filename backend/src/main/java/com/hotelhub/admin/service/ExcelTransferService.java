package com.hotelhub.admin.service;

import com.hotelhub.admin.domain.Expense;
import com.hotelhub.admin.domain.ExpenseCategory;
import com.hotelhub.admin.domain.RevenueEntry;
import com.hotelhub.admin.domain.Room;
import com.hotelhub.admin.domain.RoomStatus;
import com.hotelhub.admin.dto.imports.ImportErrorResponse;
import com.hotelhub.admin.dto.imports.ImportPreviewRowResponse;
import com.hotelhub.admin.dto.imports.ImportResultResponse;
import com.hotelhub.admin.exception.BadRequestException;
import com.hotelhub.admin.repository.ExpenseRepository;
import com.hotelhub.admin.repository.RevenueEntryRepository;
import com.hotelhub.admin.repository.RoomRepository;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class ExcelTransferService {

    private static final String[] ROOM_HEADERS = {
        "Import ID", "Room Number", "Room Type", "Floor Number", "Max Occupancy", "Status", "Room Rent", "Notes", "Active", "Updated At"
    };
    private static final String[] REVENUE_HEADERS = {
        "Import ID", "Booking Group ID", "Room Number", "Check In Date", "Check In Time", "Charge From Date", "Rent Until Date",
        "Checkout Date", "Checkout Time", "Guest Name", "Mobile Number", "Address", "Aadhar Number", "Purpose Of Stay",
        "Rent Days", "Room Rent", "Gross Revenue", "Rent Edit Reason", "Checking Out", "Created At"
    };
    private static final String[] EXPENSE_HEADERS = {
        "Import ID", "Expense Date", "Category", "Vendor Name", "Room Number", "Amount", "Notes", "Created At"
    };

    private final RoomRepository roomRepository;
    private final RevenueEntryRepository revenueEntryRepository;
    private final ExpenseRepository expenseRepository;

    public List<Room> roomExportRows(LocalDate fromDate, LocalDate toDate) {
        if (fromDate == null && toDate == null) {
            return roomRepository.findAllByActiveTrueOrderByRoomNumberAsc();
        }
        if (fromDate == null || toDate == null || toDate.isBefore(fromDate)) {
            throw new BadRequestException("Both fromDate and toDate are required, and toDate must be on or after fromDate.");
        }
        Instant from = fromDate.atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant to = toDate.plusDays(1).atStartOfDay().minusNanos(1).toInstant(ZoneOffset.UTC);
        return roomRepository.findByActiveTrueAndUpdatedAtBetweenOrderByRoomNumberAsc(from, to);
    }

    public byte[] exportRooms(List<Room> rooms) {
        return workbook("Rooms", ROOM_HEADERS, rooms.stream().map(room -> List.of(
            text(room.getImportId()),
            text(room.getRoomNumber()),
            text(room.getRoomType()),
            text(room.getFloorNumber()),
            text(room.getMaxOccupancy()),
            room.getStatus().name(),
            money(room.getRoomRent()),
            text(room.getNotes()),
            text(room.isActive()),
            text(room.getUpdatedAt())
        )).toList());
    }

    public byte[] exportRevenue(List<RevenueEntry> entries) {
        return workbook("Revenue", REVENUE_HEADERS, entries.stream().map(entry -> List.of(
            text(entry.getImportId()),
            text(entry.getBookingGroupId()),
            text(entry.getRoom().getRoomNumber()),
            text(entry.getCheckInDate()),
            text(entry.getCheckInTime()),
            text(entry.getChargeFromDate()),
            text(entry.getRentUntilDate()),
            text(entry.getCheckoutDate()),
            text(entry.getCheckoutTime()),
            text(entry.getGuestName()),
            text(entry.getMobileNumber()),
            text(entry.getAddress()),
            text(entry.getAadharNumber()),
            text(entry.getPurposeOfStay()),
            text(entry.getRentDays()),
            money(entry.getRoomRent()),
            money(revenueAmount(entry)),
            text(entry.getRentEditReason()),
            text(entry.isCheckingOut()),
            text(entry.getCreatedAt())
        )).toList());
    }

    public byte[] exportExpenses(List<Expense> expenses) {
        return workbook("Expenses", EXPENSE_HEADERS, expenses.stream().map(expense -> List.of(
            text(expense.getImportId()),
            text(expense.getExpenseDate()),
            expense.getCategory().name(),
            text(expense.getVendorName()),
            expense.getRoom() == null ? "Property" : expense.getRoom().getRoomNumber(),
            money(expense.getAmount()),
            text(expense.getNotes()),
            text(expense.getCreatedAt())
        )).toList());
    }

    public ImportResultResponse importRooms(MultipartFile file, boolean commit) throws IOException {
        ParsedRows parsed = parse(file, "Rooms");
        List<Room> toSave = new ArrayList<>();
        Set<UUID> importIds = new HashSet<>();
        Set<String> roomNumbers = new HashSet<>();

        for (RowMap row : parsed.rows()) {
            UUID importId = uuid(row, "Import ID", parsed.errors(), importIds);
            String roomNumber = required(row, "Room Number", parsed.errors());
            if (roomNumber != null && !roomNumbers.add(roomNumber.trim().toUpperCase())) {
                parsed.errors().add(error(row.rowNumber(), "Room Number", "Duplicate room number inside this file."));
            }
            if (importId != null && roomRepository.existsByImportId(importId)) {
                parsed.errors().add(error(row.rowNumber(), "Import ID", "A record with this import ID already exists."));
            }
            if (roomNumber != null && roomRepository.existsByRoomNumberIgnoreCase(roomNumber.trim())) {
                parsed.errors().add(error(row.rowNumber(), "Room Number", "Room number already exists."));
            }

            Room room = new Room();
            room.setImportId(importId);
            room.setRoomNumber(roomNumber == null ? null : roomNumber.trim().toUpperCase());
            room.setRoomType(required(row, "Room Type", parsed.errors()));
            room.setFloorNumber(integer(row, "Floor Number", parsed.errors()));
            room.setMaxOccupancy(integer(row, "Max Occupancy", parsed.errors()));
            room.setStatus(enumValue(row, "Status", RoomStatus.class, parsed.errors()));
            room.setRoomRent(decimal(row, "Room Rent", parsed.errors()));
            room.setNotes(optional(row, "Notes"));
            room.setActive(true);
            toSave.add(room);
        }

        return finish("rooms", parsed, toSave, commit, roomRepository::saveAll);
    }

    public ImportResultResponse importRevenue(MultipartFile file, boolean commit) throws IOException {
        ParsedRows parsed = parse(file, "Revenue");
        List<RevenueEntry> toSave = new ArrayList<>();
        Set<UUID> importIds = new HashSet<>();

        for (RowMap row : parsed.rows()) {
            UUID importId = uuid(row, "Import ID", parsed.errors(), importIds);
            if (importId != null && revenueEntryRepository.existsByImportId(importId)) {
                parsed.errors().add(error(row.rowNumber(), "Import ID", "A record with this import ID already exists."));
            }

            String roomNumber = required(row, "Room Number", parsed.errors());
            Room room = roomNumber == null ? null : roomRepository.findByRoomNumberIgnoreCaseAndActiveTrue(roomNumber.trim())
                .orElse(null);
            if (roomNumber != null && room == null) {
                parsed.errors().add(error(row.rowNumber(), "Room Number", "Room number does not exist."));
            }

            LocalDate chargeFrom = date(row, "Charge From Date", parsed.errors());
            LocalDate rentUntil = date(row, "Rent Until Date", parsed.errors());
            if (chargeFrom != null && rentUntil != null && rentUntil.isBefore(chargeFrom)) {
                parsed.errors().add(error(row.rowNumber(), "Rent Until Date", "Rent until date must be on or after charge from date."));
            }

            RevenueEntry entry = new RevenueEntry();
            entry.setImportId(importId);
            entry.setBookingGroupId(uuid(row, "Booking Group ID", parsed.errors(), null));
            entry.setRoom(room);
            entry.setCheckInDate(date(row, "Check In Date", parsed.errors()));
            entry.setCheckInTime(time(row, "Check In Time", parsed.errors()));
            entry.setChargeFromDate(chargeFrom);
            entry.setRentUntilDate(rentUntil);
            entry.setCheckoutDate(optional(row, "Checkout Date").isBlank() ? null : date(row, "Checkout Date", parsed.errors()));
            entry.setCheckoutTime(optional(row, "Checkout Time").isBlank() ? null : time(row, "Checkout Time", parsed.errors()));
            entry.setGuestName(required(row, "Guest Name", parsed.errors()));
            entry.setMobileNumber(required(row, "Mobile Number", parsed.errors()));
            entry.setAddress(required(row, "Address", parsed.errors()));
            entry.setAadharNumber(required(row, "Aadhar Number", parsed.errors()));
            entry.setPurposeOfStay(required(row, "Purpose Of Stay", parsed.errors()));
            entry.setRoomRent(decimal(row, "Room Rent", parsed.errors()));
            entry.setRentEditReason(optional(row, "Rent Edit Reason"));
            entry.setCheckingOut(bool(row, "Checking Out", parsed.errors()));
            if (chargeFrom != null && rentUntil != null) {
                entry.setRentDays(Math.toIntExact(ChronoUnit.DAYS.between(chargeFrom, rentUntil) + 1));
            }
            toSave.add(entry);
        }

        return finish("revenue", parsed, toSave, commit, entries -> {
            entries.stream()
                .filter(entry -> !entry.isCheckingOut())
                .map(RevenueEntry::getRoom)
                .forEach(room -> room.setStatus(RoomStatus.OCCUPIED));
            revenueEntryRepository.saveAll(entries);
        });
    }

    public ImportResultResponse importExpenses(MultipartFile file, boolean commit) throws IOException {
        ParsedRows parsed = parse(file, "Expenses");
        List<Expense> toSave = new ArrayList<>();
        Set<UUID> importIds = new HashSet<>();

        for (RowMap row : parsed.rows()) {
            UUID importId = uuid(row, "Import ID", parsed.errors(), importIds);
            if (importId != null && expenseRepository.existsByImportId(importId)) {
                parsed.errors().add(error(row.rowNumber(), "Import ID", "A record with this import ID already exists."));
            }

            String roomNumber = required(row, "Room Number", parsed.errors());
            Room room = null;
            if (roomNumber != null && !roomNumber.trim().equalsIgnoreCase("Property")) {
                room = roomRepository.findByRoomNumberIgnoreCaseAndActiveTrue(roomNumber.trim()).orElse(null);
                if (room == null) {
                    parsed.errors().add(error(row.rowNumber(), "Room Number", "Room number does not exist, or use Property."));
                }
            }

            Expense expense = new Expense();
            expense.setImportId(importId);
            expense.setExpenseDate(date(row, "Expense Date", parsed.errors()));
            expense.setCategory(enumValue(row, "Category", ExpenseCategory.class, parsed.errors()));
            expense.setVendorName(required(row, "Vendor Name", parsed.errors()));
            expense.setRoom(room);
            expense.setAmount(decimal(row, "Amount", parsed.errors()));
            expense.setNotes(optional(row, "Notes"));
            toSave.add(expense);
        }

        return finish("expenses", parsed, toSave, commit, expenseRepository::saveAll);
    }

    private <T> ImportResultResponse finish(String section, ParsedRows parsed, List<T> toSave, boolean commit, java.util.function.Consumer<List<T>> saver) {
        int validRows = parsed.rows().size() - (int) parsed.errors().stream().map(ImportErrorResponse::rowNumber).distinct().count();
        if (commit) {
            if (!parsed.errors().isEmpty() || parsed.rows().isEmpty()) {
                throw new BadRequestException("Import has validation errors. Preview the file, fix the rows, and try again.");
            }
            saver.accept(toSave);
        }
        return new ImportResultResponse(section, parsed.rows().size(), validRows, commit ? toSave.size() : 0, parsed.errors(), parsed.previewRows());
    }

    private ParsedRows parse(MultipartFile file, String sheetName) throws IOException {
        if (file.isEmpty()) {
            throw new BadRequestException("Excel file is required.");
        }
        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheet(sheetName);
            if (sheet == null) {
                sheet = workbook.getSheetAt(0);
            }
            Row headerRow = sheet.getRow(0);
            if (headerRow == null) {
                throw new BadRequestException("Excel file must include a header row.");
            }
            Map<Integer, String> headers = new HashMap<>();
            for (Cell cell : headerRow) {
                headers.put(cell.getColumnIndex(), cellText(cell).trim());
            }
            List<RowMap> rows = new ArrayList<>();
            List<ImportPreviewRowResponse> previewRows = new ArrayList<>();
            List<ImportErrorResponse> errors = new ArrayList<>();
            for (int index = 1; index <= sheet.getLastRowNum(); index++) {
                Row excelRow = sheet.getRow(index);
                if (excelRow == null) {
                    continue;
                }
                Map<String, String> values = new LinkedHashMap<>();
                boolean hasAnyValue = false;
                for (Map.Entry<Integer, String> header : headers.entrySet()) {
                    String value = cellText(excelRow.getCell(header.getKey())).trim();
                    values.put(header.getValue(), value);
                    hasAnyValue = hasAnyValue || !value.isBlank();
                }
                if (hasAnyValue) {
                    rows.add(new RowMap(index + 1, values));
                    previewRows.add(new ImportPreviewRowResponse(index + 1, values));
                }
            }
            return new ParsedRows(rows, previewRows, errors);
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Upload a valid .xlsx Excel file.");
        }
    }

    private byte[] workbook(String sheetName, String[] headers, List<List<String>> rows) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet(sheetName);
            Row headerRow = sheet.createRow(0);
            for (int column = 0; column < headers.length; column++) {
                headerRow.createCell(column).setCellValue(headers[column]);
            }
            for (int rowIndex = 0; rowIndex < rows.size(); rowIndex++) {
                Row row = sheet.createRow(rowIndex + 1);
                List<String> values = rows.get(rowIndex);
                for (int column = 0; column < values.size(); column++) {
                    row.createCell(column).setCellValue(values.get(column));
                }
            }
            for (int column = 0; column < headers.length; column++) {
                sheet.autoSizeColumn(column);
            }
            workbook.write(output);
            return output.toByteArray();
        } catch (IOException ex) {
            throw new BadRequestException("Unable to create Excel file.");
        }
    }

    private String required(RowMap row, String field, List<ImportErrorResponse> errors) {
        String value = optional(row, field);
        if (value.isBlank()) {
            errors.add(error(row.rowNumber(), field, "Value is required."));
            return null;
        }
        return value;
    }

    private UUID uuid(RowMap row, String field, List<ImportErrorResponse> errors, Set<UUID> seen) {
        String value = required(row, field, errors);
        if (value == null) {
            return null;
        }
        try {
            UUID uuid = UUID.fromString(value);
            if (seen != null && !seen.add(uuid)) {
                errors.add(error(row.rowNumber(), field, "Duplicate import ID inside this file."));
            }
            return uuid;
        } catch (IllegalArgumentException ex) {
            errors.add(error(row.rowNumber(), field, "Must be a valid UUID."));
            return null;
        }
    }

    private BigDecimal decimal(RowMap row, String field, List<ImportErrorResponse> errors) {
        String value = required(row, field, errors);
        if (value == null) {
            return null;
        }
        try {
            return new BigDecimal(value).setScale(2, RoundingMode.HALF_UP);
        } catch (NumberFormatException ex) {
            errors.add(error(row.rowNumber(), field, "Must be a valid number."));
            return null;
        }
    }

    private Integer integer(RowMap row, String field, List<ImportErrorResponse> errors) {
        String value = required(row, field, errors);
        if (value == null) {
            return null;
        }
        try {
            return Integer.valueOf(value);
        } catch (NumberFormatException ex) {
            errors.add(error(row.rowNumber(), field, "Must be a whole number."));
            return null;
        }
    }

    private LocalDate date(RowMap row, String field, List<ImportErrorResponse> errors) {
        String value = required(row, field, errors);
        if (value == null) {
            return null;
        }
        try {
            return LocalDate.parse(value);
        } catch (RuntimeException ex) {
            errors.add(error(row.rowNumber(), field, "Use date format YYYY-MM-DD."));
            return null;
        }
    }

    private LocalTime time(RowMap row, String field, List<ImportErrorResponse> errors) {
        String value = required(row, field, errors);
        if (value == null) {
            return null;
        }
        try {
            return LocalTime.parse(value);
        } catch (RuntimeException ex) {
            errors.add(error(row.rowNumber(), field, "Use time format HH:mm or HH:mm:ss."));
            return null;
        }
    }

    private Boolean bool(RowMap row, String field, List<ImportErrorResponse> errors) {
        String value = required(row, field, errors);
        if (value == null) {
            return false;
        }
        if (value.equalsIgnoreCase("true") || value.equalsIgnoreCase("yes")) {
            return true;
        }
        if (value.equalsIgnoreCase("false") || value.equalsIgnoreCase("no")) {
            return false;
        }
        errors.add(error(row.rowNumber(), field, "Use TRUE or FALSE."));
        return false;
    }

    private <E extends Enum<E>> E enumValue(RowMap row, String field, Class<E> type, List<ImportErrorResponse> errors) {
        String value = required(row, field, errors);
        if (value == null) {
            return null;
        }
        try {
            return Enum.valueOf(type, value.trim().replace(' ', '_').toUpperCase());
        } catch (IllegalArgumentException ex) {
            errors.add(error(row.rowNumber(), field, "Value is not supported."));
            return null;
        }
    }

    private String optional(RowMap row, String field) {
        return row.values().getOrDefault(field, "");
    }

    private ImportErrorResponse error(int rowNumber, String field, String message) {
        return new ImportErrorResponse(rowNumber, field, message);
    }

    private String cellText(Cell cell) {
        if (cell == null || cell.getCellType() == CellType.BLANK) {
            return "";
        }
        if (cell.getCellType() == CellType.NUMERIC) {
            if (DateUtil.isCellDateFormatted(cell)) {
                LocalDateTime dateTime = cell.getLocalDateTimeCellValue();
                if (dateTime.toLocalDate().equals(LocalDate.of(1899, 12, 31))) {
                    return dateTime.toLocalTime().truncatedTo(ChronoUnit.SECONDS).toString();
                }
                if (dateTime.toLocalTime().equals(LocalTime.MIDNIGHT)) {
                    return dateTime.toLocalDate().toString();
                }
                return dateTime.toLocalTime().truncatedTo(ChronoUnit.SECONDS).toString();
            }
            double number = cell.getNumericCellValue();
            if (number == Math.rint(number)) {
                return String.valueOf((long) number);
            }
            return BigDecimal.valueOf(number).stripTrailingZeros().toPlainString();
        }
        if (cell.getCellType() == CellType.BOOLEAN) {
            return String.valueOf(cell.getBooleanCellValue());
        }
        return cell.getStringCellValue();
    }

    private String text(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private String money(BigDecimal value) {
        return value == null ? "" : value.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private BigDecimal revenueAmount(RevenueEntry entry) {
        return entry.getRoomRent().multiply(BigDecimal.valueOf(entry.getRentDays())).setScale(2, RoundingMode.HALF_UP);
    }

    private record RowMap(int rowNumber, Map<String, String> values) {
    }

    private record ParsedRows(
        List<RowMap> rows,
        List<ImportPreviewRowResponse> previewRows,
        List<ImportErrorResponse> errors
    ) {
    }
}
