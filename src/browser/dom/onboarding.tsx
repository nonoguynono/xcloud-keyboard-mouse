import React from 'react';
import ReactDOM from 'react-dom';
import OnboardingIntro from '../components/OnboardingIntro';

const ONBOARDING_ID = 'onboarding-xmnk';

function getOnboardingDiv() {
  let div = document.getElementById(ONBOARDING_ID);
  if (!div) {
    div = document.createElement('div');
    div.id = ONBOARDING_ID;
    document.body.appendChild(div);
  }
  return div;
}

export function renderOnboardingIntro(onDismiss: () => void) {
  function handleDismiss() {
    onDismiss();
    ReactDOM.unmountComponentAtNode(getOnboardingDiv());
  }
  ReactDOM.render(<OnboardingIntro onDismiss={handleDismiss} />, getOnboardingDiv());
}
