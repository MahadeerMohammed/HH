package com.hotelhub.admin.controller;

import com.hotelhub.admin.dto.finance.DashboardSummaryResponse;
import com.hotelhub.admin.dto.finance.ExpenseRequest;
import com.hotelhub.admin.dto.finance.ExpenseResponse;
import com.hotelhub.admin.dto.finance.RevenueEntryRequest;
import com.hotelhub.admin.dto.finance.RevenueEntryResponse;
import com.hotelhub.admin.service.FinanceService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
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

    @PostMapping("/expenses")
    @ResponseStatus(HttpStatus.CREATED)
    public ExpenseResponse createExpense(@Valid @RequestBody ExpenseRequest request) {
        return financeService.createExpense(request);
    }

    @PutMapping("/expenses/{expenseId}")
    public ExpenseResponse updateExpense(@PathVariable UUID expenseId, @Valid @RequestBody ExpenseRequest request) {
        return financeService.updateExpense(expenseId, request);
    }
}
