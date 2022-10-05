import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import Toolbar from '../components/Toolbar';
import { store } from '../state';

const TOOLBAR_ID = 'toolbar-xmnk';

function getToolbarDiv() {
  let div = document.getElementById(TOOLBAR_ID);
  if (!div) {
    div = document.createElement('div');
    div.id = TOOLBAR_ID;
    document.body.appendChild(div);
  }
  return div;
}

export function renderToolbar() {
  ReactDOM.render(
    <Provider store={store}>
      <Toolbar />
    </Provider>,
    getToolbarDiv(),
  );
}
