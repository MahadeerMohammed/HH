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
    List<RevenueEntry> findAllByOrderByStayDateDescCreatedAtDesc();

    @EntityGraph(attributePaths = "room")
    List<RevenueEntry> findByStayDateBetweenOrderByStayDateDescCreatedAtDesc(LocalDate from, LocalDate to);

    @Query("select coalesce(sum(r.grossRevenue), 0) from RevenueEntry r where r.stayDate between :from and :to")
    BigDecimal sumGrossRevenueBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("select coalesce(sum(r.platformFee + r.taxAmount + r.variableCost), 0) from RevenueEntry r where r.stayDate between :from and :to")
    BigDecimal sumRevenueCostsBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);
}
