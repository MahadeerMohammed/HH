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
          <section className="login-hero">
            <span className="login-hero__pill">Admin-only operations suite</span>
            <h1>Control room inventory, revenue, expenses, and reporting from one secure workspace.</h1>
            <p>
              HotelHub Admin is designed for owners, general managers, and finance teams who need a single command
              center across iOS, Android, tablets, and desktop browsers.
            </p>

            <div className="login-hero__stats">
              <article>
                <strong>Room lifecycle</strong>
                <span>Availability, cleaning, maintenance, and archive controls.</span>
              </article>
              <article>
                <strong>Finance visibility</strong>
                <span>Track gross revenue, channel fees, variable costs, and operating expenses.</span>
              </article>
              <article>
                <strong>Monthly reporting</strong>
                <span>See trends, occupancy, net profit, and room profitability at a glance.</span>
              </article>
            </div>
          </section>

          <section className="login-card">
            <div>
              <p className="page-header__eyebrow">Secure Sign-In</p>
              <h2>Welcome back</h2>
              <p>Use your admin credentials to open the command center.</p>
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
                {submitting ? "Signing in..." : "Open Admin Console"}
              </IonButton>
            </form>

            <div className="login-card__footnote">
              <small>
                Replace the seeded credentials in your environment before production deployment. Refresh sessions use an
                HttpOnly cookie and short-lived access token.
              </small>
            </div>
          </section>
        </div>
      </IonContent>
    </IonPage>
  );
};
