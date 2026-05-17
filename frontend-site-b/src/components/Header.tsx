import { Link, useNavigate } from 'react-router-dom';
import { Button, Space } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';

export default function Header() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const toggleLanguage = () => {
    const next = i18n.language.startsWith('zh') ? 'en' : 'zh';
    i18n.changeLanguage(next);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <a href="http://localhost:3000" className="site-header__logo">
          <span className="logo-zh">国际医疗</span>
          <span className="logo-divider">·</span>
          <span className="logo-en">International Medical</span>
        </a>

        <nav className="site-header__nav">
          <Space size={12} align="center">
            <Button
              type="text"
              className="header-lang-btn"
              onClick={toggleLanguage}
            >
              {t('nav.language')}
            </Button>

            {user ? (
              <>
                <Link to="/profile" className="header-profile-link">
                  <UserOutlined />
                  <span>{user.username}</span>
                </Link>
                <Link to="/profile" className="header-nav-link">
                  {t('nav.profile')}
                </Link>
                <Button
                  type="text"
                  icon={<LogoutOutlined />}
                  className="header-logout-btn"
                  onClick={handleLogout}
                >
                  {t('nav.logout')}
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" className="header-nav-link">
                  {t('nav.login')}
                </Link>
                <Link to="/register">
                  <Button type="primary" className="header-register-btn">
                    {t('nav.register')}
                  </Button>
                </Link>
              </>
            )}
          </Space>
        </nav>
      </div>
    </header>
  );
}
