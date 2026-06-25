import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { adminTheme } from './theme'
import './index.less'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <ConfigProvider theme={adminTheme} locale={zhCN}>
      <App />
    </ConfigProvider>
  </BrowserRouter>
)
