import { IonButton, IonContent, IonIcon, IonPage } from "@ionic/react";
import { eyeOffOutline, eyeOutline } from "ionicons/icons";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await signIn({ email, password });
      navigate("/dashboard", { replace: true });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="login-layout">
          <section className="login-card">
            <div className="login-illustration" aria-hidden="true">
              <div className="login-illustration__sun" />
              <div className="login-illustration__building">
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className="login-illustration__base" />
            </div>

            <div className="login-brand">
              <div className="login-brand__mark" aria-hidden="true">AR</div>
              <div>
                <p>Alsabah Residency</p>
                <h2>Sign in</h2>
              </div>
            </div>

            <form className="stack-form" onSubmit={handleSubmit} noValidate>
              <label className="field">
                <span>Email</span>
                <input 
                  value={email} 
                  onChange={(event) => setEmail(event.target.value)} 
                  type="email" 
                  autoComplete="username"
                  required
                  aria-required="true"
                  placeholder="admin@hotelhub.com"
                />
              </label>

              <label className="field">
                <span>Password</span>
                <div className="password-input">
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    aria-required="true"
                    placeholder="********"
                  />
                  <button
                    type="button"
                    className="password-input__toggle"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                  >
                    <IonIcon icon={showPassword ? eyeOffOutline : eyeOutline} aria-hidden="true" />
                  </button>
                </div>
              </label>
              {error ? <div className="alert alert--danger" role="alert">{error}</div> : null}

              <IonButton 
                expand="block" 
                type="submit" 
                disabled={submitting || !email || !password}
                aria-busy={submitting}
              >
                {submitting ? "Signing in..." : "Sign In"}
              </IonButton>
            </form>
          </section>
        </div>
      </IonContent>
    </IonPage>
  );
};
