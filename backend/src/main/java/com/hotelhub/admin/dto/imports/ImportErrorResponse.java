package com.hotelhub.admin.dto.imports;

public record ImportErrorResponse(
    int rowNumber,
    String field,
    String message
) {
}
