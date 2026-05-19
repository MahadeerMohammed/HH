package com.hotelhub.admin.service;

import com.hotelhub.admin.domain.Room;
import com.hotelhub.admin.dto.room.RoomRequest;
import com.hotelhub.admin.dto.room.RoomResponse;
import com.hotelhub.admin.exception.BadRequestException;
import com.hotelhub.admin.exception.ResourceNotFoundException;
import com.hotelhub.admin.repository.RoomRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;

    public List<RoomResponse> listRooms() {
        return roomRepository.findAllByActiveTrueOrderByRoomNumberAsc()
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional
    public RoomResponse createRoom(RoomRequest request) {
        if (roomRepository.existsByRoomNumberIgnoreCase(request.roomNumber().trim())) {
            throw new BadRequestException("Room number already exists.");
        }

        Room room = new Room();
        applyRoomRequest(room, request);
        return toResponse(roomRepository.save(room));
    }

    @Transactional
    public RoomResponse updateRoom(UUID roomId, RoomRequest request) {
        Room room = roomRepository.findByIdAndActiveTrue(roomId)
            .orElseThrow(() -> new ResourceNotFoundException("Room not found."));

        if (roomRepository.existsByRoomNumberIgnoreCaseAndIdNot(request.roomNumber().trim(), roomId)) {
            throw new BadRequestException("Room number already exists.");
        }

        applyRoomRequest(room, request);
        return toResponse(roomRepository.save(room));
    }

    @Transactional
    public RoomResponse archiveRoom(UUID roomId) {
        Room room = roomRepository.findByIdAndActiveTrue(roomId)
            .orElseThrow(() -> new ResourceNotFoundException("Room not found."));
        room.setActive(false);
        return toResponse(roomRepository.save(room));
    }

    private void applyRoomRequest(Room room, RoomRequest request) {
        room.setRoomNumber(request.roomNumber().trim().toUpperCase());
        room.setRoomType(request.roomType().trim());
        room.setFloorNumber(request.floorNumber());
        room.setMaxOccupancy(request.maxOccupancy());
        room.setStatus(request.status());
        room.setBaseRate(request.baseRate());
        room.setNotes(request.notes() == null ? null : request.notes().trim());
        room.setActive(true);
    }

    private RoomResponse toResponse(Room room) {
        return new RoomResponse(
            room.getId(),
            room.getRoomNumber(),
            room.getRoomType(),
            room.getFloorNumber(),
            room.getMaxOccupancy(),
            room.getStatus().name(),
            room.getBaseRate(),
            room.getNotes(),
            room.isActive(),
            room.getUpdatedAt()
        );
    }
}
