import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { 
  Orbit, 
  ShieldAlert, 
  Sliders, 
  Layers, 
  FileText, 
  Menu, 
  X, 
  Sun,
  Moon,
  Clock
} from 'lucide-react';

export const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentIstTime, setCurrentIstTime] = useState<string>('');
  const location = useLocation();

  // Live Indian Standard Time (IST, UTC+05:30) mission clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const istString = now.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setCurrentIstTime(`${istString} IST`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close mobile drawer on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { to: '/', label: 'Overview', icon: Orbit },
    { to: '/conjunctions', label: 'Conjunctions', icon: ShieldAlert },
    { to: '/simulator', label: 'Manoeuvre Simulator', icon: Sliders },
    { to: '/secondary-risk', label: 'Secondary Risk', icon: Layers },
    { to: '/reports', label: 'Reports', icon: FileText },
  ];

  return (
    <header 
      className="sticky top-0 z-40 border-b shadow-xs transition-colors"
      style={{
        backgroundColor: 'var(--bg-surface-panel)',
        borderColor: 'var(--border-default)',
        color: 'var(--text-primary)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-8">
            <NavLink to="/" className="flex items-center gap-2.5 group">
              <div 
                className="w-8 h-8 rounded-md flex items-center justify-center transition-colors border"
                style={{
                  backgroundColor: 'var(--accent-soft)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--accent-primary)',
                }}
              >
                <Orbit className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span 
                  className="text-sm font-bold tracking-wider font-sans"
                  style={{ color: 'var(--text-primary)' }}
                >
                  ORBITIQ
                </span>
                <span 
                  className="text-[10px] -mt-0.5 font-sans"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Orbital Decision Support
                </span>
              </div>
            </NavLink>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === '/'}
                    className={({ isActive }) =>
                      `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        isActive
                          ? 'font-semibold border'
                          : 'hover:opacity-90'
                      }`
                    }
                    style={({ isActive }) => ({
                      backgroundColor: isActive ? 'var(--accent-soft)' : 'transparent',
                      color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      borderColor: isActive ? 'var(--accent-primary)' : 'transparent',
                    })}
                  >
                    <Icon className="w-3.5 h-3.5 opacity-80" />
                    <span>{link.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Right Action: Live IST Clock & Theme Toggle */}
          <div className="flex items-center gap-2.5">
            
            {/* Live Indian Standard Time (IST) Clock */}
            <div 
              className="inline-flex items-center gap-1.5 text-xs font-mono-telemetry border px-2.5 py-1 rounded-md shadow-2xs"
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
              title="Indian Standard Time (IST, UTC+05:30)"
            >
              <Clock className="w-3.5 h-3.5 text-[#52745C]" />
              <span className="font-semibold">{currentIstTime || '00:00:00 IST'}</span>
            </div>

            {/* Theme Toggle (Light / Dark Mode) */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-md border transition-colors cursor-pointer flex items-center justify-center shadow-xs"
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-[#D6A45B]" />
              ) : (
                <Moon className="w-4 h-4 text-[#626A73]" />
              )}
            </button>

            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md focus:outline-hidden"
              style={{
                color: 'var(--text-secondary)',
              }}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden border-t px-4 pt-3 pb-4 space-y-2"
          style={{
            backgroundColor: 'var(--bg-surface-panel)',
            borderColor: 'var(--border-default)',
          }}
        >
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium ${
                    isActive
                      ? 'font-semibold border'
                      : ''
                  }`
                }
                style={({ isActive }) => ({
                  backgroundColor: isActive ? 'var(--accent-soft)' : 'transparent',
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  borderColor: isActive ? 'var(--accent-primary)' : 'transparent',
                })}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}

          {/* Mobile Theme Toggle */}
          <div 
            className="flex items-center justify-between pt-3 border-t text-xs"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <span style={{ color: 'var(--text-secondary)' }}>Interface Theme:</span>
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-mono-telemetry text-xs cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-[#D6A45B]" /> : <Moon className="w-3.5 h-3.5 text-[#626A73]" />}
              <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
