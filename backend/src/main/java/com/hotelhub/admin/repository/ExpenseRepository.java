package com.hotelhub.admin.repository;

import com.hotelhub.admin.domain.Expense;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ExpenseRepository extends JpaRepository<Expense, UUID> {

    @EntityGraph(attributePaths = "room")
    List<Expense> findAllByOrderByExpenseDateDescCreatedAtDesc();

    @EntityGraph(attributePaths = "room")
    List<Expense> findByExpenseDateBetweenOrderByExpenseDateDescCreatedAtDesc(LocalDate from, LocalDate to);

    boolean existsByImportId(UUID importId);

    @Query("select coalesce(sum(e.amount), 0) from Expense e where e.expenseDate between :from and :to")
    BigDecimal sumAmountBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);
}
