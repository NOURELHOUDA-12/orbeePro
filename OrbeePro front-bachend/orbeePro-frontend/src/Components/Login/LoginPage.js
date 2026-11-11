import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { loginUser } from '../../services/authService';

import './LoginPage.css';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await loginUser(email, password);

            localStorage.setItem('token', data.token);
            localStorage.setItem('userRole', data.role);
        localStorage.setItem('user', JSON.stringify(data.user));

            const roleRedirects = {
                'admin': '/DashboardAdmin',
                'menage': '/TacheEmployeemysql',
            };
            navigate(roleRedirects[data.role] || '/accueil');
        } catch (err) {
            setError(err.message || 'Identifiants incorrects.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                
                {/* --- SECTION GAUCHE : IMAGE BACKROUND --- */}
                <div className="login-sidebar">
                    <div className="sidebar-overlay">
                        <div className="brand-badge">
                            <img src='images/image.png' alt="OrbeePro Logo" className="logo-img" />
                        </div>
                        
                        <div className="sidebar-content">
                            <h2>Optimisez votre gestion d'espace.</h2>
                            <p>La plateforme tout-en-un pour les professionnels de la maintenance et de l'accueil.</p>
                        </div>

<div className="qr-section">
            <div className="qr-container">
                <img src='/images/qrcode.png' alt="QR Code App Mobile" className="qr-code" />
            </div>
            <div className="qr-text">
                <span>Version Mobile</span>
                <p>Scannez pour installer l'application</p>
            </div>
        </div>


                        <div className="sidebar-footer">
                            © 2026 OrbeePro France
                        </div>
                    </div>
                </div>

                {/* --- SECTION DROITE : FORMULAIRE --- */}
                <div className="login-main">
                    <div className="form-wrapper">
                        <header className="form-header">
                            <h1>Connexion</h1>
                            <p>Heureux de vous revoir !</p>
                        </header>

                        {error && <div className="error-banner">{error}</div>}

                        <form onSubmit={handleSubmit} className="login-form">
                            <div className="input-field">
                                <label>Email professionnel</label>
                                <div className="input-wrapper">
                                    <Mail className="input-icon" size={18} />
                                    <input 
                                        type="email" 
                                        placeholder="nom@entreprise.fr"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="input-field">
                                <label>Mot de passe</label>
                                <div className="input-wrapper">
                                    <Lock className="input-icon" size={18} />
                                    <input 
                                        type="password" 
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <button type="submit" className="btn-submit" disabled={loading}>
                                {loading ? <Loader2 className="spinner" /> : <>Se connecter <ArrowRight size={18} /></>}
                            </button>
                        </form>

                        <footer className="form-footer">
                            {/* <p>Nouveau sur la plateforme ? <Link to="/register">Créer un compte</Link></p> */}
                        </footer>
                    </div>
                </div>






            </div>
        </div>
    );
};

export default LoginPage;