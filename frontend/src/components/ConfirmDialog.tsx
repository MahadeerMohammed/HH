interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loading = false,
  onCancel,
  onConfirm
}: ConfirmDialogProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="confirm-dialog" role="presentation">
      <button
        type="button"
        className="confirm-dialog__backdrop"
        aria-label={cancelLabel}
        disabled={loading}
        onClick={onCancel}
      />
      <section className="confirm-dialog__panel" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
        <div className="confirm-dialog__body">
          <h2 id="confirm-dialog-title">{title}</h2>
          <p>{message}</p>
          <div className="confirm-dialog__actions">
            <button type="button" className="confirm-dialog__button" disabled={loading} onClick={onCancel}>
              {cancelLabel}
            </button>
            <button
              type="button"
              className="confirm-dialog__button confirm-dialog__button--danger"
              disabled={loading}
              onClick={onConfirm}
            >
              {loading ? "Please wait..." : confirmLabel}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
