package com.hotelhub.admin.controller;

import com.hotelhub.admin.dto.room.RoomRequest;
import com.hotelhub.admin.dto.room.RoomResponse;
import com.hotelhub.admin.service.RoomService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/rooms")
public class RoomController {

    private final RoomService roomService;

    @GetMapping
    public List<RoomResponse> listRooms() {
        return roomService.listRooms();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RoomResponse createRoom(@Valid @RequestBody RoomRequest request) {
        return roomService.createRoom(request);
    }

    @PutMapping("/{roomId}")
    public RoomResponse updateRoom(@PathVariable UUID roomId, @Valid @RequestBody RoomRequest request) {
        return roomService.updateRoom(roomId, request);
    }

    @DeleteMapping("/{roomId}")
    public RoomResponse archiveRoom(@PathVariable UUID roomId) {
        return roomService.archiveRoom(roomId);
    }
}
