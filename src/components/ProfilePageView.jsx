import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useLedgerStore } from '../store/ledgerStore';
import { usePreferencesStore } from '../store/preferencesStore';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Camera, 
  ShieldCheck, 
  CheckCircle2, 
  LogOut, 
  Save, 
  Building2, 
  Calendar, 
  Clock,
  Moon,
  Sun,
  Globe,
  Sliders
} from 'lucide-react';

export default function ProfilePageView({ onBack }) {
  const { user, currentWorkspace, updateProfile, logout } = useAuthStore();
  const { setActiveTab } = useLedgerStore();
  const { theme, lang, setTheme, setLang, t } = usePreferencesStore();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    avatarUrl: ''
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || 'Apex Admin Executive',
        email: user.email || 'demo@khata.pro',
        phone: user.phone || '+91 9876543210',
        role: user.role || 'Enterprise Administrator',
        avatarUrl: user.avatarUrl || ''
      });
    }
  }, [user]);

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatarUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    updateProfile(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 2500);
  };

  return (
    <div style={{
      padding: '1rem',
      maxWidth: '640px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem',
      paddingBottom: '100px'
    }}>
      
      {/* Top Header Navigation Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <button
          onClick={onBack || (() => setActiveTab('dashboard'))}
          className="btn-secondary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.45rem 0.9rem',
            fontSize: '0.85rem',
            fontWeight: '700',
            borderRadius: '12px'
          }}
        >
          <ArrowLeft size={18} /> {t('backToDashboard')}
        </button>

        <span className="badge badge-purple" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}>
          <ShieldCheck size={14} /> {t('profileSettings')}
        </span>
      </div>

      {/* Hero Avatar & Title Section */}
      <div className="glass-card" style={{
        padding: '1.75rem 1.5rem',
        borderRadius: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        position: 'relative',
        background: 'linear-gradient(180deg, rgba(79, 70, 229, 0.12) 0%, rgba(15, 23, 42, 0.6) 100%)',
        borderColor: 'rgba(99, 102, 241, 0.25)',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Profile Picture Upload Badge Container */}
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          {formData.avatarUrl ? (
            <img 
              src={formData.avatarUrl} 
              alt="User Avatar" 
              style={{
                width: '96px',
                height: '96px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid var(--color-purple-40)',
                boxShadow: '0 8px 24px rgba(79, 70, 229, 0.4)'
              }}
            />
          ) : (
            <div style={{
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FF6B6B, #EE5253)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
              fontWeight: '900',
              boxShadow: '0 8px 24px rgba(238, 82, 83, 0.45)',
              border: '3px solid rgba(255, 255, 255, 0.2)'
            }}>
              {formData.name ? formData.name.charAt(0).toUpperCase() : 'A'}
            </div>
          )}

          {/* Camera Upload Trigger */}
          <label 
            htmlFor="profile-pic-input"
            style={{
              position: 'absolute',
              bottom: '0',
              right: '0',
              background: 'var(--color-purple-40)',
              color: '#FFFFFF',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border: '2px solid var(--bg-canvas)',
              boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
              transition: 'transform 0.15s ease'
            }}
            title="Change / Upload Profile Picture"
          >
            <Camera size={16} />
          </label>
          <input 
            id="profile-pic-input" 
            type="file" 
            accept="image/*" 
            onChange={handleAvatarUpload} 
            style={{ display: 'none' }} 
          />
        </div>

        <h2 style={{ fontSize: '1.4rem', fontWeight: '900', letterSpacing: '-0.5px', marginBottom: '0.25rem' }}>
          {formData.name || 'Apex Admin Executive'}
        </h2>
        <div style={{ fontSize: '0.85rem', color: 'var(--color-purple-80)', fontWeight: '700', marginBottom: '0.75rem' }}>
          {formData.role || 'Enterprise Administrator'}
        </div>

        <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
          <CheckCircle2 size={12} /> Active Account Verified
        </span>
      </div>

      {savedSuccess && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid var(--color-emerald)',
          color: 'var(--color-emerald)',
          padding: '0.85rem 1.1rem',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontSize: '0.9rem',
          fontWeight: '700',
          boxShadow: '0 4px 14px rgba(16, 185, 129, 0.2)'
        }}>
          <CheckCircle2 size={20} /> Profile details saved successfully!
        </div>
      )}

      {/* NEW: PREFERENCES & SETTINGS SECTION (Theme & Language Toggles) */}
      <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '20px' }}>
        <div style={{
          fontSize: '0.8rem',
          fontWeight: '800',
          textTransform: 'uppercase',
          color: 'var(--color-deep-purple)',
          marginBottom: '1.1rem',
          letterSpacing: '0.05em',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem'
        }}>
          <Sliders size={16} /> {t('preferences')}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Theme Row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1rem',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '16px',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              {theme === 'dark' ? <Moon size={20} color="var(--color-purple-40)" /> : <Sun size={20} color="var(--color-amber)" />}
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: '800' }}>{t('themeSetting')}</div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                  {theme === 'dark' ? t('darkMode') : t('lightMode')}
                </div>
              </div>
            </div>

            {/* iOS Style Segmented Pill Switch for Theme */}
            <div style={{
              display: 'flex',
              background: 'var(--bg-canvas)',
              padding: '3px',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)'
            }}>
              <button
                onClick={() => setTheme('dark')}
                style={{
                  border: 'none',
                  background: theme === 'dark' ? 'var(--color-purple-40)' : 'transparent',
                  color: theme === 'dark' ? '#FFF' : 'var(--text-muted)',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '9px',
                  fontSize: '0.775rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <Moon size={13} /> {t('darkMode')}
              </button>
              <button
                onClick={() => setTheme('light')}
                style={{
                  border: 'none',
                  background: theme === 'light' ? 'var(--color-purple-40)' : 'transparent',
                  color: theme === 'light' ? '#FFF' : 'var(--text-muted)',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '9px',
                  fontSize: '0.775rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <Sun size={13} /> {t('lightMode')}
              </button>
            </div>
          </div>

          {/* Language Row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1rem',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '16px',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Globe size={20} color="var(--color-cyan)" />
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: '800' }}>{t('languageSetting')}</div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                  {lang === 'EN' ? 'English' : 'हिंदी (Hindi)'}
                </div>
              </div>
            </div>

            {/* iOS Style Segmented Pill Switch for Language */}
            <div style={{
              display: 'flex',
              background: 'var(--bg-canvas)',
              padding: '3px',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)'
            }}>
              <button
                onClick={() => setLang('EN')}
                style={{
                  border: 'none',
                  background: lang === 'EN' ? 'var(--color-purple-40)' : 'transparent',
                  color: lang === 'EN' ? '#FFF' : 'var(--text-muted)',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '9px',
                  fontSize: '0.775rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                🇬🇧 {t('englishLang')}
              </button>
              <button
                onClick={() => setLang('HI')}
                style={{
                  border: 'none',
                  background: lang === 'HI' ? 'var(--color-purple-40)' : 'transparent',
                  color: lang === 'HI' ? '#FFF' : 'var(--text-muted)',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '9px',
                  fontSize: '0.775rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                🇮🇳 {t('hindiLang')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Editable Fields Form */}
      <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '20px' }}>
        <div style={{
          fontSize: '0.8rem',
          fontWeight: '800',
          textTransform: 'uppercase',
          color: 'var(--color-deep-purple)',
          marginBottom: '1.1rem',
          letterSpacing: '0.05em'
        }}>
          {t('editableDetails')}
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* Full Name */}
          <div>
            <label style={{ fontSize: '0.775rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
              {t('fullName')}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder="Enter your full name"
                style={{ paddingLeft: '2.5rem' }}
              />
              <User size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label style={{ fontSize: '0.775rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
              {t('emailAddress')}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="input-field"
                placeholder="user@khata.pro"
                style={{ paddingLeft: '2.5rem' }}
              />
              <Mail size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label style={{ fontSize: '0.775rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
              {t('phoneNumber')}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="input-field"
                placeholder="+91 9876543210"
                style={{ paddingLeft: '2.5rem' }}
              />
              <Phone size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            </div>
          </div>

          {/* Role / Designation */}
          <div>
            <label style={{ fontSize: '0.775rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
              {t('roleDesignation')}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
                className="input-field"
                placeholder="Enterprise Administrator"
                style={{ paddingLeft: '2.5rem' }}
              />
              <Briefcase size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            </div>
          </div>

          {/* Save Changes Button */}
          <button
            type="submit"
            className="btn-primary"
            style={{
              marginTop: '0.5rem',
              justifyContent: 'center',
              padding: '0.85rem',
              fontSize: '0.95rem',
              fontWeight: '800',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #4F46E5, #818CF8)',
              boxShadow: '0 4px 16px rgba(79, 70, 229, 0.4)'
            }}
          >
            <Save size={18} /> {t('saveChanges')}
          </button>
        </form>
      </div>

      {/* Account Details Section */}
      <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '20px' }}>
        <div style={{
          fontSize: '0.8rem',
          fontWeight: '800',
          textTransform: 'uppercase',
          color: 'var(--color-deep-purple)',
          marginBottom: '1.1rem',
          letterSpacing: '0.05em'
        }}>
          {t('accountMetadata')}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1rem',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '14px',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Building2 size={18} color="var(--color-purple-40)" />
              <div>
                <div style={{ fontSize: '0.825rem', fontWeight: '700' }}>Linked Workspace Ledger</div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{currentWorkspace?.name || 'Dev\'s Primary Ledger'}</div>
              </div>
            </div>
            <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>Primary</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1rem',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '14px',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Calendar size={18} color="var(--color-purple-40)" />
              <div>
                <div style={{ fontSize: '0.825rem', fontWeight: '700' }}>Account Creation Date</div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>September 11, 2026</div>
              </div>
            </div>
            <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>ID: USR-8942</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1rem',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '14px',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Clock size={18} color="var(--color-emerald)" />
              <div>
                <div style={{ fontSize: '0.825rem', fontWeight: '700' }}>Last Login Active Session</div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Today at 11:22 PM (Verified IP)</div>
              </div>
            </div>
            <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>Active</span>
          </div>
        </div>
      </div>

      {/* Logout Action Button */}
      <button
        onClick={() => logout()}
        className="btn-secondary"
        style={{
          padding: '0.85rem',
          justifyContent: 'center',
          fontSize: '0.95rem',
          fontWeight: '800',
          borderRadius: '14px',
          color: 'var(--color-rose)',
          borderColor: 'rgba(244, 63, 94, 0.3)',
          background: 'rgba(244, 63, 94, 0.05)',
          marginTop: '0.25rem'
        }}
      >
        <LogOut size={18} /> {t('signOut')}
      </button>

    </div>
  );
}
