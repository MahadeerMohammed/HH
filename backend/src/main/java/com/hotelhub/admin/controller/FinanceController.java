package com.hotelhub.admin.controller;

import com.hotelhub.admin.dto.finance.DashboardSummaryResponse;
import com.hotelhub.admin.dto.finance.ExpenseRequest;
import com.hotelhub.admin.dto.finance.ExpenseResponse;
import com.hotelhub.admin.dto.finance.RevenueEntryRequest;
import com.hotelhub.admin.dto.finance.RevenueEntryResponse;
import com.hotelhub.admin.dto.common.PagedResponse;
import com.hotelhub.admin.dto.imports.ImportResultResponse;
import com.hotelhub.admin.service.FinanceService;
import jakarta.validation.Valid;
import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1")
public class FinanceController {

    private final FinanceService financeService;

    @GetMapping("/dashboard")
    public DashboardSummaryResponse dashboard(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate
    ) {
        return financeService.getDashboardSummary(fromDate, toDate);
    }

    @GetMapping("/revenue")
    public List<RevenueEntryResponse> listRevenue(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate
    ) {
        return financeService.listRevenueEntries(fromDate, toDate);
    }

    @GetMapping("/revenue/page")
    public PagedResponse<RevenueEntryResponse> listRevenuePage(
        @RequestParam(defaultValue = "daily") String filter,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
        @RequestParam(defaultValue = "0") int page
    ) {
        return financeService.listRevenueEntriesPage(filter, fromDate, toDate, page);
    }

    @GetMapping("/revenue/export")
    public ResponseEntity<byte[]> exportRevenue(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate
    ) {
        return excelResponse("revenue.xlsx", financeService.exportRevenue(fromDate, toDate));
    }

    @PostMapping(value = "/revenue/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ImportResultResponse importRevenue(
        @RequestParam("file") MultipartFile file,
        @RequestParam(defaultValue = "false") boolean commit
    ) throws IOException {
        return financeService.importRevenue(file, commit);
    }

    @PostMapping("/revenue")
    @ResponseStatus(HttpStatus.CREATED)
    public List<RevenueEntryResponse> createRevenue(@Valid @RequestBody RevenueEntryRequest request) {
        return financeService.createRevenueEntry(request);
    }

    @PutMapping("/revenue/{bookingGroupId}")
    public List<RevenueEntryResponse> updateRevenue(@PathVariable UUID bookingGroupId, @Valid @RequestBody RevenueEntryRequest request) {
        return financeService.updateRevenueEntry(bookingGroupId, request);
    }

    @DeleteMapping("/revenue/{bookingGroupId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRevenue(@PathVariable UUID bookingGroupId) {
        financeService.deleteRevenueEntry(bookingGroupId);
    }

    @GetMapping("/expenses")
    public List<ExpenseResponse> listExpenses(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate
    ) {
        return financeService.listExpenses(fromDate, toDate);
    }

    @GetMapping("/expenses/page")
    public PagedResponse<ExpenseResponse> listExpensesPage(
        @RequestParam(defaultValue = "daily") String filter,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
        @RequestParam(defaultValue = "0") int page
    ) {
        return financeService.listExpensesPage(filter, fromDate, toDate, page);
    }

    @GetMapping("/expenses/export")
    public ResponseEntity<byte[]> exportExpenses(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate
    ) {
        return excelResponse("expenses.xlsx", financeService.exportExpenses(fromDate, toDate));
    }

    @PostMapping(value = "/expenses/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ImportResultResponse importExpenses(
        @RequestParam("file") MultipartFile file,
        @RequestParam(defaultValue = "false") boolean commit
    ) throws IOException {
        return financeService.importExpenses(file, commit);
    }

    @PostMapping("/expenses")
    @ResponseStatus(HttpStatus.CREATED)
    public ExpenseResponse createExpense(@Valid @RequestBody ExpenseRequest request) {
        return financeService.createExpense(request);
    }

    @PutMapping("/expenses/{expenseId}")
    public ExpenseResponse updateExpense(@PathVariable UUID expenseId, @Valid @RequestBody ExpenseRequest request) {
        return financeService.updateExpense(expenseId, request);
    }

    private ResponseEntity<byte[]> excelResponse(String filename, byte[] body) {
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
            .body(body);
    }
}
