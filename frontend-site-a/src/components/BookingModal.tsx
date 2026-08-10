import { Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import type { ContactEntry } from '../hooks/useContacts';

interface BookingModalProps {
  visible: boolean;
  onClose: () => void;
  contacts: ContactEntry[];
}

export default function BookingModal({ visible, onClose, contacts }: BookingModalProps) {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language.startsWith('zh');

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      onOk={onClose}
      title={t('booking.title')}
      okText={t('booking.close')}
      cancelButtonProps={{ style: { display: 'none' } }}
      centered
      className="booking-modal"
    >
      <div className="booking-modal__content">
        {contacts.length === 0 ? (
          <p style={{ color: '#999' }}>{isZh ? '暂无联系方式' : 'No contact info available'}</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '6px 12px 6px 0', borderBottom: '1px solid #f0f0f0', color: '#888', fontWeight: 500, fontSize: 13 }}>
                  {isZh ? '联系人' : 'Contact'}
                </th>
                <th style={{ textAlign: 'left', padding: '6px 0', borderBottom: '1px solid #f0f0f0', color: '#888', fontWeight: 500, fontSize: 13 }}>
                  {isZh ? '联系电话' : 'Phone'}
                </th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c, i) => (
                <tr key={i}>
                  <td style={{ padding: '8px 12px 8px 0', borderBottom: '1px solid #f9f9f9' }}>{c.name || '—'}</td>
                  <td style={{ padding: '8px 0', borderBottom: '1px solid #f9f9f9' }}>{c.phone || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Modal>
  );
}
