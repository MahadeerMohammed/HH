package com.hotelhub.admin.dto.imports;

import java.util.Map;

public record ImportPreviewRowResponse(
    int rowNumber,
    Map<String, String> values
) {
}
