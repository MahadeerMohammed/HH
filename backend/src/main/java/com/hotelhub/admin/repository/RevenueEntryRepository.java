package com.hotelhub.admin.repository;

import com.hotelhub.admin.domain.RevenueEntry;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RevenueEntryRepository extends JpaRepository<RevenueEntry, UUID> {

    @EntityGraph(attributePaths = "room")
    List<RevenueEntry> findAllByOrderByCheckInDateDescCreatedAtDesc();

    @EntityGraph(attributePaths = "room")
    List<RevenueEntry> findByCheckInDateBetweenOrderByCheckInDateDescCreatedAtDesc(LocalDate from, LocalDate to);

    @EntityGraph(attributePaths = "room")
    List<RevenueEntry> findByRoomIdOrderByCreatedAtDesc(UUID roomId);

    @EntityGraph(attributePaths = "room")
    List<RevenueEntry> findByBookingGroupId(UUID bookingGroupId);

    boolean existsByImportId(UUID importId);

    @Query("select coalesce(sum(r.roomRent * r.rentDays), 0) from RevenueEntry r where r.checkInDate between :from and :to")
    BigDecimal sumGrossRevenueBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("select coalesce(sum(r.roomRent * 0), 0) from RevenueEntry r where r.checkInDate between :from and :to")
    BigDecimal sumRevenueCostsBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);
}
