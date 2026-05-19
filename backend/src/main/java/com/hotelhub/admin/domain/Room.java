package com.hotelhub.admin.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

@Getter
@Setter
@Entity
@Table(name = "rooms")
public class Room extends BaseEntity {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @Column(nullable = false, unique = true, length = 50)
    private String roomNumber;

    @Column(nullable = false, length = 80)
    private String roomType;

    @Column(nullable = false)
    private Integer floorNumber;

    @Column(nullable = false)
    private Integer maxOccupancy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private RoomStatus status;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal baseRate;

    @Column(length = 1200)
    private String notes;

    @Column(nullable = false)
    private boolean active = true;

    @PrePersist
    void prePersist() {
        if (status == null) {
            status = RoomStatus.AVAILABLE;
        }
    }
}
