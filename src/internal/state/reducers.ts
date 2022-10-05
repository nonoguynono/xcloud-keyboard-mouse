import {
  Action,
  createReducer,
  isFulfilled,
  isPending,
  isRejected,
  PayloadAction,
  SerializedError,
} from '@reduxjs/toolkit';
import { AllMyGamepadConfigs, GlobalPrefs, Payment } from '../../shared/types';
import { defaultGamepadConfig, DEFAULT_CONFIG_NAME } from '../../shared/gamepadConfig';
import {
  activateGamepadConfigAction,
  deleteGamepadConfigAction,
  disableGamepadConfigAction,
  fetchAllAction,
  fetchGameStatusAction,
  fetchPaymentAction,
  modifyGamepadConfigAction,
  showUpsellModalAction,
} from './actions';
import { defaultPrefs } from '../../shared/defaults';

export const upsellModalVisibilityReducer = createReducer<boolean>(false, (builder) => {
  builder.addCase(showUpsellModalAction, (state, action) => action.payload);
});

export const currentGameReducer = createReducer<string | null>(null, (builder) => {
  builder.addCase(fetchGameStatusAction.fulfilled, (state, action) => action.payload || null);
});

export const activeConfigReducer = createReducer<AllMyGamepadConfigs['activeConfig']>(
  DEFAULT_CONFIG_NAME,
  (builder) => {
    builder.addCase(fetchAllAction.fulfilled, (state, action) => {
      return action.payload.activeConfig;
    });
    builder.addCase(activateGamepadConfigAction.fulfilled, (state, action) => {
      return action.payload.name;
    });
  },
);

export const enabledReducer = createReducer<AllMyGamepadConfigs['isEnabled']>(true, (builder) => {
  builder.addCase(fetchAllAction.fulfilled, (state, action) => {
    return action.payload.isEnabled;
  });
  builder.addCase(activateGamepadConfigAction.fulfilled, () => {
    return true;
  });
  builder.addCase(disableGamepadConfigAction.fulfilled, () => {
    return false;
  });
});

export const configDetailsReducer = createReducer<AllMyGamepadConfigs['configs']>(
  {
    [DEFAULT_CONFIG_NAME]: defaultGamepadConfig,
  },
  (builder) => {
    builder.addCase(fetchAllAction.fulfilled, (state, action) => {
      return action.payload.configs;
    });
    builder.addCase(deleteGamepadConfigAction.fulfilled, (state, action) => {
      delete state[action.payload.name];
    });
    builder.addCase(modifyGamepadConfigAction.fulfilled, (state, action) => {
      state[action.payload.name] = action.payload.gamepadConfig;
    });
  },
);

export const paymentReducer = createReducer<Payment | null>(null, (builder) => {
  builder.addCase(fetchAllAction.fulfilled, (state, action) => action.payload.payment || null);
  builder.addCase(fetchPaymentAction.fulfilled, (state, action) => action.payload || state);
});

export const prefsReducer = createReducer<GlobalPrefs>(defaultPrefs, (builder) => {
  builder.addCase(fetchAllAction.fulfilled, (state, action) => {
    return action.payload.prefs || state;
  });
  // TODO better type safety
  builder.addCase('prefs/update' as string, (state, action: PayloadAction<GlobalPrefs>) => action.payload);
});

export type PendingReadStatus = 'idle' | 'reading' | 'success' | 'failure';
export type PendingReadWriteStatus = PendingReadStatus | 'writing';

interface PendingStatusesState {
  readAll: PendingReadStatus;
  readAllError?: SerializedError;
  gameStatus: PendingReadStatus;
  payment: PendingReadStatus;
  configs: Record<string, PendingReadWriteStatus>;
}

function isWriteAction(action: { type: string }): action is Action {
  return (
    action.type.startsWith(deleteGamepadConfigAction.typePrefix) ||
    action.type.startsWith(modifyGamepadConfigAction.typePrefix)
  );
}

export const pendingStatusesReducer = createReducer<PendingStatusesState>(
  {
    readAll: 'idle',
    gameStatus: 'idle',
    payment: 'idle',
    configs: {},
  },
  (builder) => {
    builder.addCase(fetchAllAction.pending, (state) => {
      state.readAll = 'reading';
    });
    builder.addCase(fetchAllAction.fulfilled, (state, action) => {
      state.readAll = 'success';
      if (action.payload.payment?.paid) {
        state.payment = 'success';
      }
    });
    builder.addCase(fetchAllAction.rejected, (state, action) => {
      state.readAll = 'failure';
      state.readAllError = action.error;
    });
    builder.addCase(fetchGameStatusAction.pending, (state) => {
      state.gameStatus = 'reading';
    });
    builder.addCase(fetchGameStatusAction.fulfilled, (state) => {
      state.gameStatus = 'success';
    });
    builder.addCase(fetchGameStatusAction.rejected, (state) => {
      state.gameStatus = 'failure';
    });
    builder.addCase(fetchPaymentAction.pending, (state) => {
      state.payment = 'reading';
    });
    builder.addCase(fetchPaymentAction.fulfilled, (state) => {
      state.payment = 'success';
    });
    builder.addCase(fetchPaymentAction.rejected, (state) => {
      state.payment = 'failure';
    });
    builder.addMatcher(
      (action) => isWriteAction(action) && isPending(action),
      (state, action) => {
        state.configs[action.meta.arg.name] = 'writing';
      },
    );
    builder.addMatcher(
      (action) => isWriteAction(action) && isFulfilled(action),
      (state, action) => {
        state.configs[action.payload.name] = 'success';
      },
    );
    builder.addMatcher(
      (action) => isWriteAction(action) && isRejected(action),
      (state, action) => {
        if (action.payload) {
          state.configs[action.payload.name] = 'failure';
        }
      },
    );
  },
);
