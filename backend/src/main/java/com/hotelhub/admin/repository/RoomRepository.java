package com.hotelhub.admin.repository;

import com.hotelhub.admin.domain.Room;
import com.hotelhub.admin.domain.RoomStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface RoomRepository extends JpaRepository<Room, UUID> {

    List<Room> findAllByActiveTrueOrderByRoomNumberAsc();

    Optional<Room> findByIdAndActiveTrue(UUID id);

    boolean existsByRoomNumberIgnoreCase(String roomNumber);

    boolean existsByRoomNumberIgnoreCaseAndIdNot(String roomNumber, UUID id);

    @Query("select count(r) from Room r where r.active = true")
    long countActiveRooms();

    @Query("select count(r) from Room r where r.active = true and r.status = ?1")
    long countByStatus(RoomStatus status);
}
