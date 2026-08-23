package com.hotelhub.admin.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
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

    @Column(name = "import_id", nullable = false, unique = true)
    private UUID importId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Column(nullable = false)
    private UUID bookingGroupId;

    @Column(nullable = false)
    private LocalDate checkInDate;

    @Column(nullable = false)
    private LocalTime checkInTime;

    @Column(nullable = false)
    private LocalDate chargeFromDate;

    @Column(nullable = false)
    private LocalDate rentUntilDate;

    @Column
    private LocalDate checkoutDate;

    @Column
    private LocalTime checkoutTime;

    @Column(nullable = false, length = 120)
    private String guestName;

    @Column(nullable = false, length = 30)
    private String mobileNumber;

    @Column(nullable = false, length = 1200)
    private String address;

    @Column(nullable = false, length = 30)
    private String aadharNumber;

    @Column(nullable = false, length = 255)
    private String purposeOfStay;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal roomRent;

    @Column(length = 500)
    private String rentEditReason;

    @Column(nullable = false)
    private Integer rentDays;

    @Column(nullable = false)
    private boolean checkingOut;

    @PrePersist
    void prePersist() {
        if (importId == null) {
            importId = UUID.randomUUID();
        }
    }
}
