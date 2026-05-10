// src/App.jsx
import { useState, useEffect } from 'react';
import { auth, provider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import Dashboard from './Dashboard';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try { await signInWithPopup(auth, provider); } 
    catch (error) { console.error("Google Login failed", error); }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isSignUp) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setAuthError(error.message.replace('Firebase: ', '').replace('auth/', ''));
    }
  };

  const getDisplayName = () => {
    if (user?.displayName) return user.displayName.split(' ')[0];
    if (user?.email) return user.email.split('@')[0];
    return 'Traveler';
  };

  if (!isAuthReady) return null;

  return (
    <>
      <div className="background-container">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="particle p-1"></div>
        <div className="particle p-2"></div>
        <div className="particle p-3"></div>
      </div>

      <div className="app-container">
        <header className="app-header">
          <h1>Goal<span>Sync</span></h1>
        </header>
        
        {user ? (
          <>
            <div className="user-info">
              <p>Welcome, <span>{getDisplayName()}</span></p>
              <button className="btn-outline" onClick={() => signOut(auth)}>Sign Out</button>
            </div>
            <Dashboard user={user} />
          </>
        ) : (
          <div className="login-screen">
            <div className="auth-header-text">
              <h2>Enter the Void</h2>
              <p className="subtitle">Track your daily protocols with precision.</p>
            </div>
            
            <form className="auth-form" onSubmit={handleEmailAuth}>
              <div className="input-group">
                <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <label htmlFor="email">Email Address</label>
              </div>

              <div className="input-group">
                <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength="6" />
                <label htmlFor="password">Password</label>
              </div>
              
              {authError && <p className="error-text">⚠️ {authError}</p>}
              
              <button type="submit" className="btn-primary auth-submit-btn">
                {isSignUp ? 'Initialize Profile' : 'Access Terminal'}
              </button>
            </form>

            <div className="auth-divider"><span>OR CONTINUE WITH</span></div>

            <button className="btn-outline w-100 social-btn" onClick={handleGoogleLogin}>
              <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google Auth
            </button>

            <p className="auth-toggle">
              {isSignUp ? 'Already have clearance?' : 'Need security clearance?'} 
              <button type="button" className="btn-text" onClick={() => { setIsSignUp(!isSignUp); setAuthError(''); }}>
                {isSignUp ? 'Sign In' : 'Request Access'}
              </button>
            </p>
          </div>
        )}
      </div>
    </>
  );
}

export default App;