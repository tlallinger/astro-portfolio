import type { CookieConsentConfig } from 'vanilla-cookieconsent';

export const config: CookieConsentConfig = {
  disablePageInteraction: true,
  guiOptions: {
    consentModal: {
      layout: 'box inline',
      position: 'middle center',

    },

    preferencesModal: {
      layout: 'box',
      position: 'right',
      equalWeightButtons: true,
      flipButtons: false,
    },
  },
  categories: {
    necessary: {
      readOnly: true,
    },
  },
  onConsent({ cookie }) {
    document.getElementById('recaptcha')?.setAttribute('data-netlify-recaptcha', cookie.categories.includes('necessary') ? 'true' : 'false');
  },
  language: {
    default: 'de',
    autoDetect: 'document',
    translations: {
      en: {
        consentModal: {
          title: 'Your Privacy Matters',
          description:
            'We use essential cookies to provide security and core functionality, including Google reCAPTCHA to protect against spam. By clicking "Accept all", you also allow future optional cookies if added.',
          acceptAllBtn: 'Accept all',
          acceptNecessaryBtn: 'Accept necessary',
          showPreferencesBtn: 'Manage preferences',
          footer: '<a href="/en/dsgvo">Privacy Policy</a>',
        },
        preferencesModal: {
          title: 'Consent Preferences Center',
          acceptAllBtn: 'Accept all',
          acceptNecessaryBtn: 'Accept necessary',
          savePreferencesBtn: 'Save preferences',
          closeIconLabel: 'Close modal',
          serviceCounterLabel: 'Service|Services',
          sections: [
            {
              title: 'Cookie Usage',
              description:
                'We use cookies to ensure basic functionality and enhance your experience. Google reCAPTCHA is used as a security measure to protect forms from spam and abuse.',
            },
            {
              title:
                'Strictly Necessary Cookies <span class="pm__badge">Always Enabled</span>',
              description:
                'These cookies are essential for the functioning of the website and cannot be disabled. This includes services like Google reCAPTCHA.',
              linkedCategory: 'necessary',
            },
            {
              title: 'More Information',
              description:
                'For any questions about how we use cookies or process data, please <a class="cc__link" href="/en/contact">contact us</a>.',
            },
          ],
        },
      },
      de: {
        consentModal: {
          title: 'Ihre Privatsphäre ist uns wichtig',
          description:
            'Wir verwenden essenzielle Cookies, um Sicherheit und grundlegende Funktionen bereitzustellen – darunter Google reCAPTCHA zum Schutz vor Spam. Mit "Alle akzeptieren" erlauben Sie zusätzlich zukünftige optionale Cookies.',
          acceptAllBtn: 'Alle akzeptieren',
          acceptNecessaryBtn: 'Nur notwendige',
          showPreferencesBtn: 'Einstellungen verwalten',
          footer: '<a href="/de/dsgvo">Datenschutzerklärung</a>',
        },
        preferencesModal: {
          title: 'Datenschutzeinstellungen',
          acceptAllBtn: 'Alle akzeptieren',
          acceptNecessaryBtn: 'Nur notwendige',
          savePreferencesBtn: 'Einstellungen speichern',
          closeIconLabel: 'Modul schließen',
          serviceCounterLabel: 'Dienst|Dienste',
          sections: [
            {
              title: 'Verwendung von Cookies',
              description:
                'Wir verwenden Cookies, um grundlegende Funktionen bereitzustellen und Ihre Erfahrung zu verbessern. Google reCAPTCHA dient dem Schutz vor Spam und Missbrauch in Formularen.',
            },
            {
              title:
                'Unbedingt erforderliche Cookies <span class="pm__badge">Immer aktiv</span>',
              description:
                'Diese Cookies sind für den Betrieb der Website erforderlich und können nicht deaktiviert werden. Dazu gehört z. B. Google reCAPTCHA.',
              linkedCategory: 'necessary',
            },
            {
              title: 'Weitere Informationen',
              description:
                'Bei Fragen zur Verwendung von Cookies oder zum Datenschutz kontaktieren Sie uns bitte über <a class="cc__link" href="/de/contact">unser Kontaktformular</a>.',
            },
          ],
        },
      },
    },
  }

};
