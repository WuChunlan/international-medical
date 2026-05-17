import { Modal } from 'antd';
import { useTranslation } from 'react-i18next';

interface BookingModalProps {
  visible: boolean;
  onClose: () => void;
  contactPerson: string | null;
  contactInfo: string | null;
}

export default function BookingModal({
  visible,
  onClose,
  contactPerson,
  contactInfo,
}: BookingModalProps) {
  const { t } = useTranslation();

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
        <p>
          {t('booking.message', {
            person: contactPerson || '—',
            info: contactInfo || '—',
          })}
        </p>
      </div>
    </Modal>
  );
}
