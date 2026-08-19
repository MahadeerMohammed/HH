import { IonButton, IonIcon } from "@ionic/react";
import { closeOutline } from "ionicons/icons";
import type { ReactNode } from "react";

interface ModalDialogProps {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  size?: "default" | "wide";
}

export const ModalDialog = ({ isOpen, title, children, onClose, size = "default" }: ModalDialogProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="modal-dialog-title">
      <button className="modal-dialog__backdrop" type="button" aria-label="Close dialog" onClick={onClose} />
      <section className={`modal-dialog__panel modal-dialog__panel--${size}`}>
        <header className="modal-dialog__header">
          <h2 id="modal-dialog-title">{title}</h2>
          <IonButton fill="clear" color="medium" onClick={onClose} aria-label="Close dialog">
            <IonIcon icon={closeOutline} />
          </IonButton>
        </header>
        <div className="modal-dialog__body">{children}</div>
      </section>
    </div>
  );
};
