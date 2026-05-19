package com.hotelhub.admin.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

@Getter
@Setter
@Entity
@Table(name = "revenue_entries")
public class RevenueEntry extends BaseEntity {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Column(nullable = false)
    private LocalDate stayDate;

    @Column(nullable = false, length = 120)
    private String guestName;

    @Column(nullable = false, length = 80)
    private String bookingChannel;

    @Column(nullable = false)
    private Integer nights;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal grossRevenue;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal platformFee;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal taxAmount;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal variableCost;

    @Column(length = 1200)
    private String notes;
}
