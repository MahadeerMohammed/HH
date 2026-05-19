package com.hotelhub.admin.service;

import com.hotelhub.admin.config.BootstrapProperties;
import com.hotelhub.admin.domain.AdminUser;
import com.hotelhub.admin.domain.Expense;
import com.hotelhub.admin.domain.ExpenseCategory;
import com.hotelhub.admin.domain.RevenueEntry;
import com.hotelhub.admin.domain.Room;
import com.hotelhub.admin.domain.RoomStatus;
import com.hotelhub.admin.domain.UserRole;
import com.hotelhub.admin.repository.AdminUserRepository;
import com.hotelhub.admin.repository.ExpenseRepository;
import com.hotelhub.admin.repository.RevenueEntryRepository;
import com.hotelhub.admin.repository.RoomRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class BootstrapService implements ApplicationRunner {

    private final BootstrapProperties bootstrapProperties;
    private final AdminUserRepository adminUserRepository;
    private final RoomRepository roomRepository;
    private final RevenueEntryRepository revenueEntryRepository;
    private final ExpenseRepository expenseRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedAdminUser();
        if (bootstrapProperties.isSeedSampleData() && roomRepository.count() == 0L) {
            seedSampleRoomsAndFinancials();
        }
    }

    private void seedAdminUser() {
        adminUserRepository.findByEmailIgnoreCase(bootstrapProperties.getAdminEmail()).ifPresentOrElse(
            existing -> {
            },
            () -> {
                AdminUser adminUser = new AdminUser();
                adminUser.setEmail(bootstrapProperties.getAdminEmail().trim().toLowerCase(Locale.ROOT));
                adminUser.setFullName(bootstrapProperties.getAdminFullName().trim());
                adminUser.setPasswordHash(passwordEncoder.encode(bootstrapProperties.getAdminPassword()));
                adminUser.setRole(UserRole.ADMIN);
                adminUser.setActive(true);
                adminUserRepository.save(adminUser);
            }
        );
    }

    private void seedSampleRoomsAndFinancials() {
        List<Room> rooms = new ArrayList<>();
        rooms.add(buildRoom("101", "Deluxe King", 1, 2, RoomStatus.AVAILABLE, new BigDecimal("145.00")));
        rooms.add(buildRoom("102", "Executive Twin", 1, 2, RoomStatus.OCCUPIED, new BigDecimal("162.00")));
        rooms.add(buildRoom("201", "Family Suite", 2, 4, RoomStatus.AVAILABLE, new BigDecimal("210.00")));
        rooms.add(buildRoom("202", "Premium King", 2, 2, RoomStatus.CLEANING, new BigDecimal("185.00")));
        rooms.add(buildRoom("301", "Penthouse Suite", 3, 4, RoomStatus.MAINTENANCE, new BigDecimal("340.00")));
        roomRepository.saveAll(rooms);

        LocalDate today = LocalDate.now();
        List<RevenueEntry> revenueEntries = new ArrayList<>();
        revenueEntries.add(buildRevenueEntry(rooms.get(0), today.minusDays(7), "Anika Sen", "Direct", 2, "290.00", "0.00", "26.10", "24.00"));
        revenueEntries.add(buildRevenueEntry(rooms.get(1), today.minusDays(5), "Carlos Reed", "Booking.com", 3, "486.00", "58.32", "43.74", "39.00"));
        revenueEntries.add(buildRevenueEntry(rooms.get(2), today.minusDays(3), "Family Patel", "Direct", 2, "420.00", "0.00", "37.80", "30.00"));
        revenueEntries.add(buildRevenueEntry(rooms.get(3), today.minusDays(1), "Leah Thomas", "Expedia", 1, "185.00", "22.20", "16.65", "12.00"));
        revenueEntryRepository.saveAll(revenueEntries);

        List<Expense> expenses = new ArrayList<>();
        expenses.add(buildExpense(rooms.get(0), today.minusDays(6), ExpenseCategory.HOUSEKEEPING, "Sparkle Services", "18.50"));
        expenses.add(buildExpense(rooms.get(1), today.minusDays(4), ExpenseCategory.MAINTENANCE, "CoolAir Repairs", "67.00"));
        expenses.add(buildExpense(null, today.minusDays(2), ExpenseCategory.SOFTWARE, "Cloud PMS", "120.00"));
        expenses.add(buildExpense(null, today.minusDays(1), ExpenseCategory.UTILITIES, "City Power", "255.00"));
        expenseRepository.saveAll(expenses);
    }

    private Room buildRoom(String roomNumber, String roomType, int floor, int occupancy, RoomStatus status, BigDecimal baseRate) {
        Room room = new Room();
        room.setRoomNumber(roomNumber);
        room.setRoomType(roomType);
        room.setFloorNumber(floor);
        room.setMaxOccupancy(occupancy);
        room.setStatus(status);
        room.setBaseRate(baseRate);
        room.setNotes("Auto-seeded sample room.");
        room.setActive(true);
        return room;
    }

    private RevenueEntry buildRevenueEntry(
        Room room,
        LocalDate stayDate,
        String guestName,
        String bookingChannel,
        int nights,
        String grossRevenue,
        String platformFee,
        String taxAmount,
        String variableCost
    ) {
        RevenueEntry revenueEntry = new RevenueEntry();
        revenueEntry.setRoom(room);
        revenueEntry.setStayDate(stayDate);
        revenueEntry.setGuestName(guestName);
        revenueEntry.setBookingChannel(bookingChannel);
        revenueEntry.setNights(nights);
        revenueEntry.setGrossRevenue(new BigDecimal(grossRevenue));
        revenueEntry.setPlatformFee(new BigDecimal(platformFee));
        revenueEntry.setTaxAmount(new BigDecimal(taxAmount));
        revenueEntry.setVariableCost(new BigDecimal(variableCost));
        revenueEntry.setNotes("Auto-seeded booking revenue.");
        return revenueEntry;
    }

    private Expense buildExpense(Room room, LocalDate date, ExpenseCategory category, String vendorName, String amount) {
        Expense expense = new Expense();
        expense.setRoom(room);
        expense.setExpenseDate(date);
        expense.setCategory(category);
        expense.setVendorName(vendorName);
        expense.setAmount(new BigDecimal(amount));
        expense.setNotes("Auto-seeded operating expense.");
        return expense;
    }
}
