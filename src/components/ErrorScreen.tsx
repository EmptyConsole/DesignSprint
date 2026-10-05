import { CloudOff, RotateCcw } from "lucide-react";

interface Props {
  photo: string;
  message: string;
  onRetry: () => void;
  onBack: () => void;
}

export function ErrorScreen({ photo, message, onRetry, onBack }: Props) {
  return (
    <section className="error-screen">
      <img className="frozen dim" src={photo} alt="" />
      <div className="error-card" role="alert">
        <div className="error-icon">
          <CloudOff size={28} />
        </div>
        <h2>That didn't go through</h2>
        <p>{message}</p>
        <div className="row">
          <button className="btn btn-primary" onClick={onRetry}>
            <RotateCcw size={18} /> Try again
          </button>
          <button className="btn btn-ghost" onClick={onBack}>
            New photo
          </button>
        </div>
      </div>
    </section>
  );
}
