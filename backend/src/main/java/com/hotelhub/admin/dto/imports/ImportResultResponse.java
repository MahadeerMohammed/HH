package com.hotelhub.admin.dto.imports;

import java.util.List;

public record ImportResultResponse(
    String section,
    int totalRows,
    int validRows,
    int importedRows,
    List<ImportErrorResponse> errors,
    List<ImportPreviewRowResponse> previewRows
) {
}
