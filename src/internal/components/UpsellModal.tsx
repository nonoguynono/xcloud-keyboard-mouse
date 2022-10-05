import { CompoundButton } from '@fluentui/react';
import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { Modal } from 'react-responsive-modal';
import { getExtPay } from '../../shared/payments';
import { showUpsellModalAction } from '../state/actions';
import { getUpsellModalVisibility } from '../state/selectors';
import { useAppSelector } from './hooks/reduxHooks';

const extpay = getExtPay();

// TODO pull this from a server
const price = '$3.99';

export default function UpsellModal() {
  const dispatch = useDispatch();
  const show = useAppSelector(getUpsellModalVisibility);

  const openPaymentPage = useCallback(async () => {
    await extpay.openPaymentPage();
    setTimeout(() => {
      window.close();
    }, 100);
  }, []);

  const handleClose = useCallback(async () => {
    dispatch(showUpsellModalAction(false));
  }, [dispatch]);

  return (
    <Modal center open={show} onClose={handleClose} showCloseIcon={true} focusTrapped={true} closeOnEsc={true}>
      <div className="explanation-modal-xmnk">
        <h2>Upgrade for additional features</h2>
        <p>
          <strong>Pay once - access these premium features forever!</strong>
        </p>
        <ul>
          <li>Create additional presets</li>
          <li>Import community-made presets for existing games</li>
          <li>More features coming soon</li>
        </ul>
        <div style={{ textAlign: 'center' }}>
          <CompoundButton
            primary
            secondaryText={`Only ${price}`}
            onClick={openPaymentPage}
            styles={{ root: { width: '100%' }, textContainer: { textAlign: 'center' } }}
          >
            Upgrade now
          </CompoundButton>
        </div>
      </div>
    </Modal>
  );
}
