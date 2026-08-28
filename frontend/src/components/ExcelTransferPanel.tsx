import { IonButton, IonIcon } from "@ionic/react";
import { cloudUploadOutline, downloadOutline, saveOutline } from "ionicons/icons";
import { useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import type { ImportResult } from "../types";
import { ModalDialog } from "./ModalDialog";

interface ExcelTransferPanelProps {
  title: string;
  exportPath: string;
  importPath: string;
  filenamePrefix: string;
  onImported: () => Promise<void>;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

const today = new Date().toISOString().slice(0, 10);

export const ExcelTransferPanel = ({
  title,
  exportPath,
  importPath,
  filenamePrefix,
  onImported,
  onError,
  onSuccess
}: ExcelTransferPanelProps) => {
  const { fetchWithAuth } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportResult | null>(null);
  const [backupDialog, setBackupDialog] = useState<"menu" | "download" | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [importing, setImporting] = useState(false);

  const withDateRange = () => {
    const params = new URLSearchParams();
    if (fromDate && toDate) {
      params.set("fromDate", fromDate);
      params.set("toDate", toDate);
    }
    return params.toString() ? `${exportPath}?${params}` : exportPath;
  };

  const downloadExcel = async () => {
    if ((fromDate && !toDate) || (!fromDate && toDate)) {
      onError("Select both from and to dates, or leave both empty.");
      return;
    }

    setDownloading(true);
    try {
      const response = await fetchWithAuth(withDateRange());
      if (!response.ok) {
        throw new Error("Unable to download Excel file.");
      }
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${filenamePrefix}-${fromDate || "all"}-to-${toDate || today}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
      setBackupDialog(null);
    } catch (downloadError) {
      onError(downloadError instanceof Error ? downloadError.message : "Unable to download Excel file.");
    } finally {
      setDownloading(false);
    }
  };

  const uploadForPreview = async (file: File) => {
    setImporting(true);
    setSelectedFile(file);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetchWithAuth(`${importPath}?commit=false`, {
        method: "POST",
        body: formData
      });
      if (!response.ok) {
        throw new Error("Unable to preview import.");
      }
      setPreview((await response.json()) as ImportResult);
    } catch (uploadError) {
      onError(uploadError instanceof Error ? uploadError.message : "Unable to preview import.");
      setSelectedFile(null);
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const confirmImport = async () => {
    if (!selectedFile || !preview || preview.errors.length > 0 || preview.totalRows === 0) {
      return;
    }

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const response = await fetchWithAuth(`${importPath}?commit=true`, {
        method: "POST",
        body: formData
      });
      if (!response.ok) {
        throw new Error("Unable to import Excel file.");
      }
      const result = (await response.json()) as ImportResult;
      setPreview(null);
      setSelectedFile(null);
      onSuccess(`Imported ${result.importedRows} ${title.toLowerCase()} rows.`);
      await onImported();
    } catch (confirmError) {
      onError(confirmError instanceof Error ? confirmError.message : "Unable to import Excel file.");
    } finally {
      setImporting(false);
    }
  };

  const visiblePreviewRows = preview?.previewRows ?? [];
  const visibleErrors = preview?.errors ?? [];
  const headers = visiblePreviewRows[0] ? Object.keys(visiblePreviewRows[0].values).slice(0, 8) : [];

  return (
    <div className="excel-transfer-panel">
      <IonButton fill="outline" color="dark" onClick={() => setBackupDialog("menu")} disabled={downloading || importing}>
        <IonIcon icon={saveOutline} slot="start" />
        Backup
      </IonButton>
      <input
        ref={fileInputRef}
        className="visually-hidden-file"
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void uploadForPreview(file);
          }
        }}
      />

      <ModalDialog
        isOpen={backupDialog === "menu"}
        title={`${title} Backup`}
        onClose={() => !importing && !downloading && setBackupDialog(null)}
        className="backup-choice-dialog"
      >
        <div className="backup-choice">
          <button
            type="button"
            className="backup-choice__button"
            disabled={importing}
            onClick={() => {
              setBackupDialog(null);
              fileInputRef.current?.click();
            }}
          >
            <IonIcon icon={cloudUploadOutline} aria-hidden="true" />
            <span>
              <strong>Import Excel</strong>
              <small>Upload, validate, preview, then confirm.</small>
            </span>
          </button>
          <button
            type="button"
            className="backup-choice__button"
            disabled={downloading}
            onClick={() => setBackupDialog("download")}
          >
            <IonIcon icon={downloadOutline} aria-hidden="true" />
            <span>
              <strong>Download Excel</strong>
              <small>Choose a date range before downloading.</small>
            </span>
          </button>
        </div>
      </ModalDialog>

      <ModalDialog
        isOpen={backupDialog === "download"}
        title={`Download ${title}`}
        onClose={() => !downloading && setBackupDialog(null)}
        className="backup-download-dialog"
      >
        <div className="backup-download">
          <div className="backup-download__dates">
            <label className="backup-download__field">
              <span>From</span>
              <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
            </label>
            <label className="backup-download__field">
              <span>To</span>
              <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
            </label>
          </div>
          <div className="backup-download__actions">
            <IonButton fill="outline" color="medium" disabled={downloading} onClick={() => setBackupDialog("menu")}>
              Back
            </IonButton>
            <IonButton fill="outline" color="medium" disabled={downloading} onClick={() => {
              setFromDate("");
              setToDate("");
            }}>
              All Dates
            </IonButton>
            <IonButton disabled={downloading} onClick={() => void downloadExcel()}>
              <IonIcon icon={downloadOutline} slot="start" />
              {downloading ? "Downloading..." : "Download"}
            </IonButton>
          </div>
        </div>
      </ModalDialog>

      <ModalDialog
        isOpen={!!preview}
        title={`Import ${title}`}
        onClose={() => !importing && setPreview(null)}
        className="import-preview-dialog"
      >
        {preview ? (
          <div className="import-preview">
            <div className="import-preview__summary">
              <div>
                <strong>{preview.totalRows}</strong>
                <span>Rows Found</span>
              </div>
              <div>
                <strong>{preview.validRows}</strong>
                <span>Valid Rows</span>
              </div>
              <div className={preview.errors.length > 0 ? "import-preview__summary-item--danger" : "import-preview__summary-item--success"}>
                <strong>{preview.errors.length}</strong>
                <span>Issues</span>
              </div>
            </div>
            {visibleErrors.length > 0 ? (
              <div className="import-preview__errors">
                {visibleErrors.map((item, index) => (
                  <p key={`${item.rowNumber}-${item.field}-${index}`}>
                    Row {item.rowNumber}, {item.field}: {item.message}
                  </p>
                ))}
              </div>
            ) : null}
            {visiblePreviewRows.length > 0 ? (
              <div className="table-shell import-preview__table">
                <table>
                  <thead>
                    <tr>
                      <th>Row</th>
                      {headers.map((header) => <th key={header}>{header}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {visiblePreviewRows.map((row) => (
                      <tr key={row.rowNumber}>
                        <td>{row.rowNumber}</td>
                        {headers.map((header) => <td key={header}>{row.values[header]}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
            <div className="form-actions">
              <IonButton fill="outline" color="medium" disabled={importing} onClick={() => setPreview(null)}>
                Cancel
              </IonButton>
              <IonButton disabled={importing || preview.errors.length > 0 || preview.totalRows === 0} onClick={() => void confirmImport()}>
                {importing ? "Importing..." : "Confirm Import"}
              </IonButton>
            </div>
          </div>
        ) : null}
      </ModalDialog>
    </div>
  );
};
